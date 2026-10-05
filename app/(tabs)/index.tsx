import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import { useTheme } from '@/lib/theme';
import type { Palette, Radius } from '@/constants/themes';

const FEATURES = [
  { icon: 'shield-checkmark-outline', label: 'Secure' },
  { icon: 'flash-outline', label: 'Real-time' },
  { icon: 'document-text-outline', label: 'Paperless' },
] as const;

export default function Index() {
  const { colors, radius } = useTheme();
  const styles = useMemo(
    () => makeStyles(colors, radius),
    [colors, radius]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
        <Header title="QR Attendance" subtitle="IT School System" />
      </View>

      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Ionicons name="school-outline" size={16} color={colors.primary} />
          <Text style={styles.heroBadgeText}>Attendance Portal</Text>
        </View>
        <Text style={styles.mainTitle}>School Event Attendance</Text>
        <Text style={styles.subtitle}>
          Scan QR Codes to record attendance during school activities.
        </Text>

        <View style={styles.featureRow}>
          {FEATURES.map((feature) => (
            <View key={feature.label} style={styles.featureChip}>
              <Ionicons name={feature.icon} size={13} color={colors.primary} />
              <Text style={styles.featureText}>{feature.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footerContainer}>
        <AppButton
          theme="primary"
          title="Scan QR Code"
          icon="qr-code-outline"
          onPress={() => router.push('/scan')}
        />
        <AppButton
          title="Attendance History"
          icon="time-outline"
          onPress={() => router.push('/history')}
        />
        <AppButton
          title="Profile"
          icon="person-outline"
          variant="outline"
          onPress={() => router.push('/profile')}
        />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette, r: Radius) =>
  StyleSheet.create({
    container: { flex: 1, alignItems: 'center' },
    headerContainer: { flex: 0.45, justifyContent: 'center' },
    hero: {
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 18,
      backgroundColor: c.card,
      marginHorizontal: 20,
      borderRadius: r.card,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 22,
      width: '100%',
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: c.shadowOpacity,
      shadowRadius: 12,
      elevation: 4,
    },
    heroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.tint,
      borderRadius: r.chip,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 12,
    },
    heroBadgeText: {
      marginLeft: 6,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: c.primary,
    },
    mainTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: c.textPrimary,
      marginBottom: 6,
      textAlign: 'center',
      letterSpacing: 0.2,
    },
    subtitle: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    featureRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
      marginTop: 16,
    },
    featureChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: r.chip,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    featureText: {
      marginLeft: 5,
      fontSize: 12,
      fontWeight: '700',
      color: c.textSecondary,
    },
    footerContainer: {
      flex: 0.8,
      alignItems: 'center',
      paddingHorizontal: 24,
      width: '100%',
      paddingTop: 6,
    },
  });
