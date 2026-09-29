import { useEffect, useState, useSyncExternalStore } from 'react';
import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

export type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
};

let globalSession: Session | null = null;
let globalUser: User | null = null;
let globalLoading = false;
let globalInitialized = false;

/**
 * Immutable snapshot, rebuilt on every change.
 * IMPORTANT: `useAuth` must hand this object straight to useSyncExternalStore
 * (no object literal in the component). Otherwise the React Compiler — which is
 * enabled in app.json — memoizes the literal on first render and every screen
 * keeps reading stale auth state (app stuck on the loading screen forever).
 */
let snapshot: AuthState = {
  session: null,
  user: null,
  loading: false,
  initialized: false,
};

const listeners: Set<() => void> = new Set();

function publish() {
  snapshot = {
    session: globalSession,
    user: globalUser,
    loading: globalLoading,
    initialized: globalInitialized,
  };
  listeners.forEach((listener) => listener());
}

export function setAuth(session: Session | null) {
  globalSession = session;
  globalUser = session?.user ?? null;
  globalLoading = false;
  publish();
}

let initPromise: Promise<void> | null = null;

/**
 * Reads the stored session once, when the app boots.
 * getSession() is raced against a timeout so a slow/hanging call can never keep
 * the app on the loading screen, and the finally block guarantees `initialized`
 * flips to true no matter what happens.
 */
export function initAuth(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const timeout = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 4000)
        );
        const stored = Promise.resolve()
          .then(() => supabase.auth.getSession())
          .then((res) => res?.data?.session ?? null)
          .catch(() => null);

        const session = await Promise.race([stored, timeout]);

        globalSession = session;
        globalUser = session?.user ?? null;

        if (session) {
          // Boot-time repair: if the profile role is stuck (e.g. signed up
          // before the role fix, or the earlier sync failed), heal it from the
          // device stash / signup metadata WITHOUT requiring a re-login.
          // Bounded by a timeout so boot can never hang on it — if the sync
          // loses the race it keeps running in the background.
          await Promise.race([
            syncProfile(session),
            new Promise((resolve) => setTimeout(resolve, 1500)),
          ]);
        }
      } catch {
        globalSession = null;
        globalUser = null;
      } finally {
        globalLoading = false;
        globalInitialized = true;
        publish();
      }
    })();
  }
  return initPromise;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return snapshot;
}

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export type SignUpProfile = {
  full_name: string;
  role: 'student' | 'teacher';
};

type Intent = SignUpProfile & { email: string };

const INTENT_KEY = 'qratt_pending_profile';

/**
 * The role/name chosen at sign-up. Kept in memory (always works for this JS
 * session) and in SecureStore (survives restarts when the platform supports
 * it). The durable copy lives server-side in `user_metadata` — see syncProfile.
 */
let memoryIntent: Intent | null = null;

export function normalizeRole(value: unknown): 'student' | 'teacher' | null {
  return value === 'teacher' || value === 'student' ? value : null;
}

async function stashIntent(email: string, profile: SignUpProfile) {
  const intent: Intent = { email: email.trim().toLowerCase(), ...profile };
  memoryIntent = intent;
  try {
    await SecureStore.setItemAsync(INTENT_KEY, JSON.stringify(intent));
  } catch {
    // SecureStore can be unavailable (e.g. some web builds) — memory covers
    // this session, user_metadata covers every future session.
  }
}

async function readIntent(email: string): Promise<Intent | null> {
  const normalized = email.trim().toLowerCase();
  let intent = memoryIntent;
  if (!intent) {
    try {
      const raw = await SecureStore.getItemAsync(INTENT_KEY);
      if (raw) intent = JSON.parse(raw);
    } catch {
      // fall through to metadata
    }
  }
  if (!intent || intent.email !== normalized) return null;
  return intent;
}

async function clearIntent() {
  memoryIntent = null;
  try {
    await SecureStore.deleteItemAsync(INTENT_KEY);
  } catch {
    // ignore
  }
}

/**
 * Self-healing profile sync — runs at sign-up, sign-in, AND app boot.
 *
 * Intent sources (best first):
 *   1. device stash (memory/SecureStore) from this sign-up
 *   2. session.user.user_metadata — the `options.data` we sent at sign-up.
 *      It lives on the server, so it works on other devices, after a cleared
 *      cache, and even if schema.sql was never re-run.
 *
 * It reads the profiles row, upserts on mismatch, then READS BACK to verify —
 * and only clears the stash once the DB provably matches. Never throws.
 * Returns the role the DB actually holds afterwards (or null if unknown).
 */
export async function syncProfile(
  session: Session | null
): Promise<'student' | 'teacher' | null> {
  const user = session?.user;
  if (!user?.email) return null;
  const email = user.email;

  try {
    const intent = await readIntent(email);
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

    const intendedRole = intent
      ? normalizeRole(intent.role)
      : normalizeRole(meta.role);
    const metaName = typeof meta.full_name === 'string' ? meta.full_name : '';
    const intendedName = intent?.full_name || metaName || null;

    if (!intendedRole && !intendedName) return null;

    const { data: row } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle();

    const currentRole = normalizeRole(row?.role) ?? 'student';
    const roleMatches = !intendedRole || currentRole === intendedRole;
    const nameMatches = !intendedName || !!row?.full_name;

    if (roleMatches && nameMatches) {
      await clearIntent();
      return currentRole;
    }

    const nextRole = intendedRole ?? currentRole;
    const nextName = intendedName ?? row?.full_name ?? null;

    const { error: writeError } = await supabase
      .from('profiles')
      .upsert(
        { id: user.id, email, full_name: nextName, role: nextRole },
        { onConflict: 'id' }
      );

    if (writeError) {
      // Keep the intent — it will be retried at the next sign-in / boot.
      console.warn('syncProfile: write failed:', writeError.message);
      return currentRole;
    }

    const { data: verify } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const verified = normalizeRole(verify?.role) ?? null;

    if (!intendedRole || verified === intendedRole) {
      await clearIntent();
    } else {
      console.warn(
        'syncProfile: read-back mismatch — wanted',
        intendedRole,
        'got',
        verified
      );
    }
    return verified ?? currentRole;
  } catch (err) {
    console.warn('syncProfile failed:', err);
    return null;
  }
}

export async function signUp(
  email: string,
  password: string,
  profile?: SignUpProfile
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Layer 1: carry the profile in the user metadata so it survives every
    // session (and so the DB trigger can write it atomically at insert time).
    options: profile
      ? { data: { full_name: profile.full_name, role: profile.role } }
      : undefined,
  });

  let verifiedRole: 'student' | 'teacher' | null = null;

  if (!error && profile) {
    // Always remember the choice — before any write is attempted.
    await stashIntent(email, profile);

    if (data.session) {
      setAuth(data.session);
      // Layer 3: write the row ourselves with read-back verification.
      verifiedRole = await syncProfile(data.session);
    }
    // No session (email confirmation on): metadata + trigger cover the server;
    // the first sign-in / next boot runs syncProfile and finishes the job.
  } else if (!error && data.session) {
    setAuth(data.session);
  }

  return { data, error, verifiedRole };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (!error && data.session) {
    setAuth(data.session);
    // Heal the role BEFORE the caller navigates, so every screen — including
    // the Teacher tab's role gate — sees the final, verified role.
    await syncProfile(data.session);
  }
  return { data, error };
}

export async function signOut() {
  setAuth(null);
  supabase.auth.signOut().catch(() => {});
  return { error: null };
}
