import { MaterialIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';
import type { Palette, Radius } from '@/constants/themes';

type Props = { title: string; subtitle?: string };

export default function Header({ title, subtitle }: Props) {
  const { colors, radius } = useTheme();
  const styles = useMemo(
    () => makeStyles(colors, radius),
    [colors, radius]
  );

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <View pointerEvents="none" style={styles.halo} />
        <View style={styles.logoCircle}>
          <MaterialIcons name="qr-code-2" size={36} color={colors.logo} />
        </View>
      </View>

      <View style={styles.bar} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const makeStyles = (c: Palette, r: Radius) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: 18,
    },
    brand: {
      width: 72,
      height: 72,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    halo: {
      position: 'absolute',
      width: 132,
      height: 132,
      borderRadius: 66,
      backgroundColor: c.tint,
      top: -30,
      left: -30,
      zIndex: 0,
    },
    logoCircle: {
      position: 'relative',
      zIndex: 1,
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.primary + '59',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: c.primary,
      shadowOpacity: 0.35,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
    },
    bar: {
      width: 46,
      height: 4,
      borderRadius: r.chip,
      backgroundColor: c.primary,
      marginBottom: 10,
      opacity: 0.9,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: c.textPrimary,
      letterSpacing: 0.4,
    },
    subtitle: {
      fontSize: 12,
      fontWeight: '700',
      color: c.muted,
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginTop: 6,
    },
  });
