-- ============================================================================
-- QR Attendance - Supabase schema (TARGET project)
-- ----------------------------------------------------------------------------
-- Run this file in the TARGET project's Supabase Dashboard -> SQL Editor.
--
-- Functionality, table design, RLS policies and the signup trigger are taken
-- from the SOURCE project (QR-ATT-main / supabase/schema.sql) - the SOURCE is
-- the source of truth for database behaviour.
--
-- Safe to re-run: every statement is idempotent.
-- NON-DESTRUCTIVE: this file never drops a table, never deletes rows and never
-- rewrites an existing column type. It only
--   * creates objects that are missing,
--   * guarantees constraints the app depends on,
--   * enables RLS and (re)creates policies,
--   * (re)creates the signup function and trigger.
--
-- The TARGET keeps its own Supabase project - no credentials are embedded here.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- TABLE 1: profiles - who are the users?
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text,
  role       text not null default 'student' check (role in ('student', 'teacher')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Guarantee the role CHECK exists even if the table was created by an older
-- script that only carried the DEFAULT.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%teacher%'
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('student', 'teacher'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- TABLE 2: events - what is the event?
-- NOTE: start_time / end_time instead of start / end (reserved words).
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  event_code  text not null unique,
  title       text not null,
  start_time  timestamptz,
  end_time    timestamptz,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- unique (event_code) is REQUIRED: the Scan screen does
-- .eq('event_code', ...).maybeSingle() and the Teacher screen does
-- upsert(..., { onConflict: 'event_code' }).
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.events'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) ilike '%event_code%'
  ) then
    alter table public.events
      add constraint events_event_code_key unique (event_code);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- TABLE 3: attendance - who scanned what?
-- unique (student_id, event_id) is the anti-double-scan rule.
-- ---------------------------------------------------------------------------
create table if not exists public.attendance (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references auth.users (id) on delete cascade,
  event_id    uuid not null references public.events (id) on delete cascade,
  scanned_at  timestamptz not null default now(),
  unique (student_id, event_id)
);

-- The unique constraint is REQUIRED: registerAttendance() turns Postgres error
-- code 23505 into "Already registered for this event."
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.attendance'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) ilike '%student_id%'
      and pg_get_constraintdef(oid) ilike '%event_id%'
  ) then
    alter table public.attendance
      add constraint attendance_student_id_event_id_key unique (student_id, event_id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY - enabled on every table
-- ---------------------------------------------------------------------------
alter table public.profiles   enable row level security;
alter table public.events     enable row level security;
alter table public.attendance enable row level security;

-- ---------------------------------------------------------------------------
-- profiles policies
-- ---------------------------------------------------------------------------
drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Teachers can view profiles of their attendees" on public.profiles;
create policy "Teachers can view profiles of their attendees"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.attendance a
      join public.events e on e.id = a.event_id
      where a.student_id = profiles.id
        and e.created_by = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- events policies
-- The INSERT policy is intentionally permissive (as in the SOURCE): a student's
-- scan creates the events row when it does not exist yet, and that insert
-- carries no owner.
-- ---------------------------------------------------------------------------
drop policy if exists "Events are readable by any authenticated user" on public.events;
create policy "Events are readable by any authenticated user"
  on public.events for select
  to authenticated
  using (true);

drop policy if exists "Users can insert events" on public.events;
create policy "Users can insert events"
  on public.events for insert
  to authenticated
  with check (true);

drop policy if exists "Users can update their own events" on public.events;
create policy "Users can update their own events"
  on public.events for update
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- ---------------------------------------------------------------------------
-- attendance policies
-- ---------------------------------------------------------------------------
drop policy if exists "Students can view their own attendance" on public.attendance;
create policy "Students can view their own attendance"
  on public.attendance for select
  to authenticated
  using (auth.uid() = student_id);

drop policy if exists "Students can insert their own attendance" on public.attendance;
create policy "Students can insert their own attendance"
  on public.attendance for insert
  to authenticated
  with check (auth.uid() = student_id);

drop policy if exists "Teachers can view attendance for their events" on public.attendance;
create policy "Teachers can view attendance for their events"
  on public.attendance for select
  to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = attendance.event_id
        and e.created_by = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- TRIGGER - automatically create a profile row on signup
-- Reads full_name / role from the signup metadata (options.data) so the role
-- the user picked on the Sign Up screen is written atomically - even when
-- email confirmation is on and the client has no session yet.
-- (SOURCE: instructions/13-signup-role-bugfix.md, Layer 2.)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    case when new.raw_user_meta_data->>'role' = 'teacher'
         then 'teacher'
         else 'student'
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
