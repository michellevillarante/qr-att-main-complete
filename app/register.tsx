import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import AppButton from '@/components/AppButton';
import AppTextInput from '@/components/AppTextInput';
import Header from '@/components/Header';
import { useTheme } from '@/lib/theme';
import { signUp } from '@/lib/auth';
import type { Palette, Radius } from '@/constants/themes';

type Role = 'student' | 'teacher';

const ROLE_OPTIONS: { value: Role; label: string; icon: 'school-outline' | 'briefcase-outline' }[] = [
  { value: 'student', label: 'Student', icon: 'school-outline' },
  { value: 'teacher', label: 'Teacher', icon: 'briefcase-outline' },
];

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, radius } = useTheme();
  const styles = makeStyles(colors, radius);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError, verifiedRole } = await signUp(
        email.trim(),
        password,
        {
          full_name: fullName.trim(),
          role,
        }
      );

      if (authError) {
        setError(authError.message);
      } else if (data.session) {
        // Email confirmation is off, so a session exists right away.
        // Teachers go straight to the create-events section; students to Home.
        const metadataRole =
          (data.user?.user_metadata?.role as 'student' | 'teacher' | undefined) ??
          role;
        const finalRole = verifiedRole ?? metadataRole ?? role;
        router.replace(
          finalRole === 'teacher' ? '/(tabs)/teacher' : '/(tabs)'
        );
      } else {
        // Email confirmation is on — show the "check your email" message.
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerContainer}>
              <Header title="QR Attendance" subtitle="Create your account" />
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Register to start recording attendance</Text>

              {success ? (
                <View style={styles.successContainer}>
                  <View style={styles.successIcon}>
                    <Ionicons name="mail-unread-outline" size={26} color={colors.primary} />
                  </View>
                  <Text style={styles.successTitle}>Check your email!</Text>
                  <Text style={styles.successText}>
                    We sent a confirmation link to {email}. Click the link to verify your
                    account, then come back and sign in.
                  </Text>
                  <Link href="/login" style={styles.link}>
                    Back to Sign In
                  </Link>
                </View>
              ) : (
                <View style={styles.form}>
                  <Text style={styles.label}>Full Name</Text>
                  <AppTextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="e.g. Juan Dela Cruz"
                    placeholderTextColor={colors.muted}
                    editable={!loading}
                  />

                  <Text style={styles.label}>I am a...</Text>
                  <View style={styles.roleRow}>
                    {ROLE_OPTIONS.map((option) => {
                      const active = role === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          style={[styles.roleChip, active && styles.roleChipActive]}
                          onPress={() => setRole(option.value)}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                        >
                          <Ionicons
                            name={option.icon}
                            size={17}
                            color={active ? colors.primary : colors.muted}
                          />
                          <Text
                            style={[
                              styles.roleChipText,
                              active && styles.roleChipTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={styles.label}>Email</Text>
                  <AppTextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your.email@school.edu"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    editable={!loading}
                  />

                  <Text style={styles.label}>Password</Text>
                  <AppTextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="At least 6 characters"
                    placeholderTextColor={colors.muted}
                    secureTextEntry
                    textContentType="newPassword"
                    editable={!loading}
                  />

                  <Text style={styles.label}>Confirm Password</Text>
                  <AppTextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter your password"
                    placeholderTextColor={colors.muted}
                    secureTextEntry
                    textContentType="newPassword"
                    editable={!loading}
                  />

                  {error && (
                    <View style={styles.errorBox}>
                      <Text style={styles.error}>{error}</Text>
                    </View>
                  )}

                  {loading ? (
                    <ActivityIndicator
                      size="large"
                      color={colors.primary}
                      style={styles.loader}
                    />
                  ) : (
                    <AppButton
                      theme="primary"
                      title="Sign Up"
                      icon="person-add-outline"
                      onPress={handleRegister}
                    />
                  )}
                </View>
              )}

              {!success && (
                <Link href="/login" style={styles.link}>
                  Already have an account? Sign In
                </Link>
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (c: Palette, r: Radius) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    headerContainer: {
      alignItems: 'center',
      marginTop: 12,
      marginBottom: 8,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: r.card,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: c.shadowOpacity,
      shadowRadius: 14,
      elevation: 4,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: c.textPrimary,
      textAlign: 'center',
      marginBottom: 4,
      letterSpacing: 0.2,
    },
    subtitle: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    form: {
      marginBottom: 16,
    },
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: c.muted,
      marginBottom: 6,
      marginTop: 10,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    roleRow: {
      flexDirection: 'row',
      marginBottom: 4,
      gap: 10,
    },
    roleChip: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: r.input,
      borderWidth: 1.5,
      borderColor: c.border,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    roleChipActive: {
      borderColor: c.primary,
      backgroundColor: c.tint,
    },
    roleChipText: {
      fontSize: 15,
      fontWeight: '700',
      color: c.muted,
      marginLeft: 6,
    },
    roleChipTextActive: {
      color: c.primary,
    },
    errorBox: {
      backgroundColor: c.danger + '14',
      borderRadius: r.input,
      borderWidth: 1,
      borderColor: c.danger + '40',
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: 12,
      marginBottom: 4,
    },
    error: {
      fontSize: 13,
      color: c.danger,
      textAlign: 'center',
      fontWeight: '600',
    },
    loader: {
      marginVertical: 16,
    },
    link: {
      fontSize: 14,
      color: c.primary,
      textAlign: 'center',
      fontWeight: '700',
    },
    successContainer: {
      alignItems: 'center',
      marginBottom: 16,
      padding: 20,
      backgroundColor: c.surface,
      borderRadius: r.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    successIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: c.tint,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    successTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: c.textPrimary,
      marginBottom: 8,
    },
    successText: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 16,
    },
  });
