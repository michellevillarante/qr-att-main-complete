import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';

import { COLORS } from '@/constants/colors';
import { initAuth, useAuth } from '@/lib/auth';
import { getProfile } from '@/lib/profiles';

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
    <View style={styles.root}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops! Not Found' }} />
      </Stack>

      {!initialized && (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator size="large" color={COLORS.primary} />
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
    backgroundColor: COLORS.background,
  },
});
