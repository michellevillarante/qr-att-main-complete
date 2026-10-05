import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';
import type { Palette, Radius, ThemeMode } from '@/constants/themes';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

type Props = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Legacy prop kept for existing call sites — same as variant="primary". */
  theme?: 'primary';
  variant?: ButtonVariant;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
};

export default function AppButton({
  title,
  icon,
  theme,
  variant,
  onPress,
  disabled = false,
  compact = false,
}: Props) {
  const { colors, radius, mode } = useTheme();
  const styles = useMemo(
    () => makeStyles(colors, radius, mode),
    [colors, radius, mode]
  );

  const resolved: ButtonVariant =
    variant ?? (theme === 'primary' ? 'primary' : 'secondary');

  const labelColor =
    resolved === 'primary'
      ? colors.textOnPrimary
      : resolved === 'danger'
      ? '#FFFFFF'
      : resolved === 'secondary'
      ? colors.textPrimary
      : colors.primary;

  return (
    <View style={styles.outer}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.inner,
          resolved === 'primary' && { backgroundColor: colors.primary },
          resolved === 'danger' && { backgroundColor: colors.danger },
          resolved === 'secondary' && {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          resolved === 'outline' && {
            backgroundColor: 'transparent',
            borderColor: colors.primary,
          },
          resolved === 'ghost' && { backgroundColor: 'transparent' },
          resolved === 'primary' && styles.glowPrimary,
          resolved === 'danger' && styles.glowDanger,
          (resolved === 'outline' || resolved === 'ghost') && styles.noShadow,
          compact && styles.compact,
          disabled && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name={icon}
          size={compact ? 18 : 21}
          color={disabled ? colors.muted : labelColor}
          style={styles.icon}
        />
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            compact && styles.labelCompact,
            { color: disabled ? colors.muted : labelColor },
          ]}
        >
          {title}
        </Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (c: Palette, r: Radius, mode: ThemeMode) =>
  StyleSheet.create({
    outer: {
      width: '100%',
      marginBottom: 14,
      borderRadius: r.button,
    },
    glowPrimary: {
      shadowColor: c.primary,
      shadowOpacity: mode === 'dark' ? 0.5 : 0.4,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    glowDanger: {
      shadowColor: c.danger,
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
      elevation: 5,
    },
    inner: {
      borderRadius: r.button,
      paddingVertical: 15,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      borderWidth: 1.5,
      borderColor: 'transparent',
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: c.shadowOpacity,
      shadowRadius: 6,
      elevation: 3,
    },
    noShadow: {
      shadowOpacity: 0,
      elevation: 0,
    },
    compact: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      shadowOpacity: 0,
      elevation: 0,
    },
    icon: {
      paddingRight: 10,
    },
    label: {
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    labelCompact: {
      fontSize: 14,
    },
    disabled: {
      opacity: 0.55,
      shadowOpacity: 0,
      elevation: 0,
    },
    pressed: {
      opacity: 0.88,
      transform: [{ scale: 0.985 }],
    },
  });
