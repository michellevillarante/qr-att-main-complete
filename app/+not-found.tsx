import { View, StyleSheet, Text } from 'react-native';
import { Link, Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/lib/theme';
import type { Palette } from '@/constants/themes';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <>
      <Stack.Screen options={{ title: 'Oops! Not Found' }} />
      <View style={styles.container}>
        <View style={styles.icon}>
          <Ionicons name="compass-outline" size={34} color={colors.primary} />
        </View>
        <Text style={styles.heading}>Page not found</Text>
        <Link href="/" style={styles.button}>
          Go back to Home screen!
        </Link>
      </View>
    </>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    icon: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: c.card,
      borderWidth: 1.5,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: c.shadowOpacity,
      shadowRadius: 12,
      elevation: 4,
    },
    heading: {
      fontSize: 18,
      fontWeight: '800',
      color: c.textPrimary,
      marginBottom: 14,
    },
    button: {
      fontSize: 16,
      textDecorationLine: 'underline',
      fontWeight: '700',
      color: c.primary,
      padding: 4,
    },
  });
