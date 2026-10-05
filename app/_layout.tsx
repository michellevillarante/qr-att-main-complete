import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { COLORS } from '@/constants/colors';
import { initAuth, useAuth } from '@/lib/auth';
import { getProfile } from '@/lib/profiles';
import { ThemeProvider, useTheme } from '@/lib/theme';

const AUTH_PATHS = ['/login', '/register'];

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, initialized } = useAuth();

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const onAuthScreen = AUTH_PATHS.includes(pathname);

    if (!user && !onAuthScreen) {
      router.replace('/login');
    } else if (user && onAuthScreen) {
      // Role-aware landing: teachers go to the create-events section,
      // students to Home. (getProfile is async; the auth screens do their
      // own replace afterwards — both target the same place.)
      getProfile(user.id).then((profile) => {
        router.replace(
          profile?.role === 'teacher' ? '/(tabs)/teacher' : '/(tabs)'
        );
      });
    }
  }, [initialized, user, pathname, router]);

  return (
    <ThemeProvider>
      <RootShell initialized={initialized} />
    </ThemeProvider>
  );
}

function RootShell({ initialized }: { initialized: boolean }) {
  const { colors, mode } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops! Not Found' }} />
      </Stack>

      {!initialized && (
        <View style={[styles.loader, { backgroundColor: colors.background }]} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
