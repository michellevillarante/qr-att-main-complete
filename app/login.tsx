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
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppButton from '@/components/AppButton';
import AppTextInput from '@/components/AppTextInput';
import Header from '@/components/Header';
import { useTheme } from '@/lib/theme';
import { signIn } from '@/lib/auth';
import { getProfile } from '@/lib/profiles';
import type { Palette, Radius } from '@/constants/themes';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, radius } = useTheme();
  const styles = makeStyles(colors, radius);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await signIn(email.trim(), password);

      if (authError) {
        setError(authError.message);
      } else {
        // Teachers land in the create-events section; students on Home.
        const profile = data.session
          ? await getProfile(data.session.user.id)
          : null;
        const metadataRole =
          (data.session?.user?.user_metadata?.role as
            | 'student'
            | 'teacher'
            | undefined) ?? null;
        const finalRole = profile?.role ?? metadataRole ?? 'student';
        router.replace(
          finalRole === 'teacher' ? '/(tabs)/teacher' : '/(tabs)'
        );
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected error');
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
              <Header title="QR Attendance" subtitle="Sign in to continue" />
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to record your attendance</Text>

              <View style={styles.form}>
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
                  placeholder="Enter your password"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  textContentType="password"
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
                    title="Sign In"
                    icon="log-in-outline"
                    onPress={handleLogin}
                  />
                )}
              </View>

              <Link href="/register" style={styles.link}>
                Don't have an account? Sign Up
              </Link>
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
      marginBottom: 20,
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
  });
