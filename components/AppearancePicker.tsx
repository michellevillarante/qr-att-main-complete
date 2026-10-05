import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import { useTheme } from '@/lib/theme';
import {
  ACCENTS,
  SHAPES,
  THEMES,
  luminanceOf,
  type Palette,
  type Radius,
} from '@/constants/themes';

export default function AppearancePicker() {
  const { colors, radius, mode, themeId, accentId, shapeId, setThemeId, setAccentId, setShapeId, resetAppearance } =
    useTheme();
  const styles = useMemo(
    () => makeStyles(colors, radius),
    [colors, radius]
  );

  return (
    <View style={styles.card}>
      <View style={styles.sectionHead}>
        <Ionicons name="color-palette-outline" size={18} color={colors.primary} />
        <Text style={styles.sectionTitle}>Appearance</Text>
      </View>

      <Text style={styles.label}>Theme</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.themeRow}
      >
        {THEMES.map((theme) => {
          const active = theme.id === themeId;
          return (
            <Pressable
              key={theme.id}
              onPress={() => setThemeId(theme.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.themeTile, active && styles.tileActive]}
            >
              <View style={[styles.themePreview, { backgroundColor: theme.colors.background }]}>
                <View style={[styles.previewCard, { backgroundColor: theme.colors.card }]} />
                <View
                  style={[styles.previewBar, { backgroundColor: theme.colors.primary }]}
                />
                <View
                  style={[styles.previewDot, { backgroundColor: theme.colors.accent }]}
                />
                {active ? (
                  <View style={styles.previewCheck}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                ) : null}
              </View>
              <Text style={styles.themeName} numberOfLines={1}>
                {theme.name}
              </Text>
              <Text style={styles.themeMode} numberOfLines={1}>
                {theme.mode === 'dark' ? 'Dark' : 'Light'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.label}>Accent colour</Text>
      <View style={styles.accentRow}>
        {ACCENTS.map((accent) => {
          const active = accent.id === accentId;
          const swatch = accent.color ?? colors.primary;
          return (
            <Pressable
              key={accent.id}
              onPress={() => setAccentId(accent.id)}
              accessibilityRole="button"
              accessibilityLabel={accent.name}
              accessibilityState={{ selected: active }}
              style={styles.accentWrap}
            >
              <View
                style={[
                  styles.accentDot,
                  {
                    backgroundColor: swatch,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                {active ? (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={luminanceOf(swatch) > 0.3 ? '#0B1020' : '#FFFFFF'}
                  />
                ) : null}
              </View>
              <Text style={styles.accentName} numberOfLines={1}>
                {accent.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Button style</Text>
      <View style={styles.shapeRow}>
        {SHAPES.map((shape) => {
          const active = shape.id === shapeId;
          return (
            <Pressable
              key={shape.id}
              onPress={() => setShapeId(shape.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.shapeTile, active && styles.tileActive]}
            >
              <View
                style={[
                  styles.shapeSample,
                  {
                    borderRadius: Math.min(shape.radius.button, 14),
                    backgroundColor: active ? colors.primary : colors.surface,
                  },
                ]}
              />
              <Text style={[styles.shapeLabel, active && styles.shapeLabelActive]}>
                {shape.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Preview</Text>
      <View style={styles.previewBox}>
        <AppButton
          variant="primary"
          title="Primary Action"
          icon="flash-outline"
          onPress={() => {}}
          compact
        />
        <AppButton
          variant="secondary"
          title="Secondary Action"
          icon="layers-outline"
          onPress={() => {}}
          compact
        />
        <View style={styles.chipPreviewRow}>
          <View style={styles.chipPreview}>
            <Text style={styles.chipPreviewText}>Event chip</Text>
          </View>
          <View style={[styles.chipPreview, styles.chipPreviewOk]}>
            <Text style={[styles.chipPreviewText, styles.chipPreviewOkText]}>Present</Text>
          </View>
        </View>
      </View>

      <View style={styles.resetRow}>
        <AppButton
          variant="outline"
          title="Reset to defaults"
          icon="refresh-outline"
          compact
          onPress={resetAppearance}
        />
      </View>

      <Text style={styles.note}>
        Saved on this device and applied everywhere instantly.
        {mode === 'dark' ? ' Dark theme active.' : ''}
      </Text>
    </View>
  );
}

const makeStyles = (c: Palette, r: Radius) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: r.card,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      marginBottom: 24,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: c.shadowOpacity,
      shadowRadius: 8,
      elevation: 3,
    },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.textPrimary,
      marginLeft: 8,
      letterSpacing: 0.3,
    },
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: c.muted,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: 16,
      marginBottom: 8,
    },
    themeRow: {
      paddingRight: 4,
      gap: 10,
    },
    themeTile: {
      width: 96,
      padding: 8,
      borderRadius: r.card,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.surface + '66',
    },
    tileActive: {
      borderColor: c.primary,
      backgroundColor: c.tint,
    },
    themePreview: {
      height: 56,
      borderRadius: 10,
      padding: 8,
      justifyContent: 'center',
      marginBottom: 6,
      overflow: 'hidden',
    },
    previewCard: {
      height: 18,
      borderRadius: 5,
      width: '70%',
      marginBottom: 5,
    },
    previewBar: {
      height: 8,
      borderRadius: 4,
      width: '55%',
      marginBottom: 5,
    },
    previewDot: {
      height: 8,
      width: 8,
      borderRadius: 4,
      position: 'absolute',
      right: 8,
      bottom: 8,
    },
    previewCheck: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeName: {
      fontSize: 13,
      fontWeight: '700',
      color: c.textPrimary,
    },
    themeMode: {
      fontSize: 10,
      fontWeight: '600',
      color: c.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    accentRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    accentWrap: {
      alignItems: 'center',
      width: 58,
      marginBottom: 6,
    },
    accentDot: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    accentName: {
      fontSize: 10,
      fontWeight: '600',
      color: c.muted,
      textAlign: 'center',
    },
    shapeRow: {
      flexDirection: 'row',
      gap: 8,
    },
    shapeTile: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 6,
      borderRadius: r.card,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.surface + '66',
    },
    shapeSample: {
      height: 14,
      width: 52,
      marginBottom: 8,
    },
    shapeLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textSecondary,
    },
    shapeLabelActive: {
      color: c.primary,
    },
    previewBox: {
      backgroundColor: c.background,
      borderRadius: r.card,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
    },
    chipPreviewRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 2,
    },
    chipPreview: {
      backgroundColor: c.tint,
      borderRadius: r.chip,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    chipPreviewText: {
      fontSize: 12,
      fontWeight: '700',
      color: c.primary,
    },
    chipPreviewOk: {
      backgroundColor: c.success + '1F',
    },
    chipPreviewOkText: {
      color: c.success,
    },
    resetRow: {
      marginTop: 4,
      marginBottom: -6,
    },
    note: {
      fontSize: 11,
      color: c.muted,
      marginTop: 14,
      lineHeight: 16,
      textAlign: 'center',
    },
  });
