import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import AppButton from '@/components/AppButton';
import AppTextInput from '@/components/AppTextInput';
import AppearancePicker from '@/components/AppearancePicker';
import { useTheme } from '@/lib/theme';
import { useAuth, signOut, syncProfile } from '@/lib/auth';
import {
  getProfile,
  updateProfile,
  type Profile,
  type Role,
} from '@/lib/profiles';
import type { Palette, Radius } from '@/constants/themes';

function initialsOf(name: string, email: string) {
  const source = name.trim() || email.trim();
  if (!source) return '?';
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + second).toUpperCase() || '?';
}

export default function ProfileScreen() {
  const { user, session } = useAuth();
  const { colors, radius } = useTheme();
  const styles = makeStyles(colors, radius);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const loadProfile = useCallback(async () => {
    if (!user) return;
    // Self-heal first: apply the signup intent / metadata if the row is stale
    // (e.g. an account created before the role fix), then show the DB truth.
    await syncProfile(session);
    const p = await getProfile(user.id);
    setProfile(p);
    setDraftName(p?.full_name ?? '');
  }, [user, session]);

  const metadataRole =
    (session?.user?.user_metadata?.role as Role | undefined) ?? null;
  const effectiveRole: Role =
    profile?.role === 'teacher' || metadataRole === 'teacher'
      ? 'teacher'
      : 'student';

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleSaveName = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await updateProfile(user.id, {
      full_name: draftName.trim(),
    });
    setSaving(false);
    if (error) {
      Alert.alert('Error', error);
    } else {
      setProfile((prev) =>
        prev ? { ...prev, full_name: draftName.trim() } : prev
      );
      setEditing(false);
    }
  };

  const handleSwitchRole = async () => {
    if (!user || !profile) return;
    const next: Role = effectiveRole === 'teacher' ? 'student' : 'teacher';
    setSaving(true);
    const { error } = await updateProfile(user.id, { role: next });
    setSaving(false);
    if (error) {
      Alert.alert('Error', error);
    } else {
      setProfile((prev) => (prev ? { ...prev, role: next } : prev));
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      router.replace('/login');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to sign out.');
    } finally {
      setLoading(false);
    }
  };

  const displayName = profile?.full_name || '';
  const email = profile?.email ?? user?.email ?? '';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>My Profile</Text>

      <View style={styles.identityCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {initialsOf(displayName, email)}
          </Text>
        </View>
        <View style={styles.identityText}>
          <Text style={styles.identityName} numberOfLines={1}>
            {displayName || 'Unnamed account'}
          </Text>
          <Text style={styles.identityEmail} numberOfLines={1}>
            {email || '-'}
          </Text>
          <View
            style={[
              styles.roleBadge,
              effectiveRole !== 'teacher' && styles.roleBadgeStudent,
            ]}
          >
            <Ionicons
              name={effectiveRole === 'teacher' ? 'briefcase' : 'school'}
              size={11}
              color={effectiveRole === 'teacher' ? colors.textOnPrimary : colors.primary}
            />
            <Text
              style={[
                styles.roleBadgeText,
                effectiveRole !== 'teacher' && styles.roleBadgeTextStudent,
              ]}
            >
              {effectiveRole === 'teacher' ? 'Teacher' : 'Student'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Name</Text>
        {editing ? (
          <View style={styles.nameEditRow}>
            <AppTextInput
              style={styles.nameInput}
              compact
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Enter your name"
              placeholderTextColor={colors.muted}
              editable={!saving}
            />
            <Pressable
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveName}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? '...' : 'Save'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setEditing(true)} style={styles.nameRow}>
            <Text style={styles.value}>
              {profile?.full_name || 'Tap to add your name'}
            </Text>
            <View style={styles.editHint}>
              <Ionicons name="create-outline" size={14} color={colors.primary} />
              <Text style={styles.editHintText}>Edit</Text>
            </View>
          </Pressable>
        )}

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{profile?.email ?? user?.email ?? '-'}</Text>

        <Text style={styles.label}>Role</Text>
        <View style={styles.roleRow}>
          <Text style={styles.value}>
            {effectiveRole === 'teacher' ? 'Teacher' : 'Student'}
          </Text>
          <Pressable
            onPress={handleSwitchRole}
            disabled={saving || !profile}
            style={[
              styles.roleSwitch,
              (saving || !profile) && styles.saveButtonDisabled,
            ]}
          >
            <Text style={styles.saveButtonText}>
              {saving
                ? '...'
                : effectiveRole === 'teacher'
                ? 'Make Student'
                : 'Make Teacher'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.roleHint}>
          Role is set when you sign up. If an older account still says
          Student, tap the button to switch it.
        </Text>

        <Text style={styles.label}>User ID</Text>
        <View style={styles.idRow}>
          <Ionicons name="finger-print-outline" size={14} color={colors.muted} />
          <Text style={styles.valueSmall}>{user?.id ?? '-'}</Text>
        </View>
      </View>

      <AppearancePicker />

      <AppButton
        title="Sign Out"
        icon="log-out-outline"
        variant="danger"
        onPress={handleSignOut}
        disabled={loading}
      />
    </ScrollView>
  );
}

const makeStyles = (c: Palette, r: Radius) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 32,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: c.textPrimary,
      marginBottom: 16,
      letterSpacing: 0.2,
    },
    identityCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: r.card,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      marginBottom: 14,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: c.shadowOpacity,
      shadowRadius: 8,
      elevation: 3,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: c.tint,
      borderWidth: 2,
      borderColor: c.primary + '66',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    avatarText: {
      fontSize: 22,
      fontWeight: '800',
      color: c.primary,
      letterSpacing: 0.5,
    },
    identityText: {
      flex: 1,
    },
    identityName: {
      fontSize: 17,
      fontWeight: '800',
      color: c.textPrimary,
      marginBottom: 2,
    },
    identityEmail: {
      fontSize: 13,
      color: c.muted,
      marginBottom: 8,
    },
    roleBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.primary,
      borderRadius: r.chip,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    roleBadgeStudent: {
      backgroundColor: c.tint,
    },
    roleBadgeText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFFFFF',
      marginLeft: 5,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    roleBadgeTextStudent: {
      color: c.primary,
    },
    infoCard: {
      backgroundColor: c.card,
      borderRadius: r.card,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      marginBottom: 16,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: c.shadowOpacity,
      shadowRadius: 8,
      elevation: 3,
    },
    label: {
      fontSize: 11,
      fontWeight: '800',
      color: c.muted,
      marginBottom: 4,
      marginTop: 10,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    value: {
      fontSize: 15,
      color: c.textPrimary,
      fontWeight: '600',
    },
    valueSmall: {
      fontSize: 11,
      color: c.muted,
      fontFamily: 'monospace',
      flexShrink: 1,
    },
    idRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.surface,
      borderRadius: r.input,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    roleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.surface,
      borderRadius: r.input,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    roleSwitch: {
      backgroundColor: c.primary,
      borderRadius: r.chip,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    roleHint: {
      fontSize: 12,
      color: c.muted,
      marginTop: 6,
      lineHeight: 17,
    },
    editHint: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    editHintText: {
      fontSize: 13,
      fontWeight: '700',
      color: c.primary,
      marginLeft: 4,
    },
    nameEditRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    nameInput: {
      flex: 1,
      backgroundColor: c.surface,
      marginRight: 8,
    },
    saveButton: {
      backgroundColor: c.primary,
      borderRadius: r.chip,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: c.textOnPrimary,
      fontSize: 14,
      fontWeight: '800',
    },
  });
