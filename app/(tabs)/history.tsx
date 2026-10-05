import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import {
  getAttendanceHistory,
  getTeacherEventAttendance,
  type AttendanceRecord,
  type TeacherEventAttendance,
} from '@/lib/attendance';
import { getProfile, type Role } from '@/lib/profiles';
import type { Palette, Radius } from '@/constants/themes';

export default function HistoryScreen() {
  const { user } = useAuth();
  const { colors, radius } = useTheme();
  const styles = makeStyles(colors, radius);
  const [role, setRole] = useState<Role | null>(null);
  const [studentRecords, setStudentRecords] = useState<AttendanceRecord[]>([]);
  const [teacherEvents, setTeacherEvents] = useState<TeacherEventAttendance[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setRole(null);
      setStudentRecords([]);
      setTeacherEvents([]);
      setLoading(false);
      return;
    }

    try {
      const profile = await getProfile(user.id);
      const currentRole = profile?.role ?? 'student';
      setRole(currentRole);

      if (currentRole === 'teacher') {
        const events = await getTeacherEventAttendance(user.id);
        setTeacherEvents(events);
        setStudentRecords([]);
      } else {
        const records = await getAttendanceHistory(user.id);
        setStudentRecords(records);
        setTeacherEvents([]);
      }
    } catch {
      setStudentRecords([]);
      setTeacherEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.title}>Attendance History</Text>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 28 }} />
        <Text style={styles.subtitle}>Loading records...</Text>
      </View>
    );
  }

  if (role === 'teacher') {
    return (
      <View style={styles.container}>
        <ScreenTitle
          styles={styles}
          count={teacherEvents.length}
          label="events"
        />

        {teacherEvents.length === 0 ? (
          <EmptyState
            styles={styles}
            icon="calendar-outline"
            message="No events yet. Create an event from the Teacher tab to start collecting attendance."
          />
        ) : (
          <FlatList
            data={teacherEvents}
            keyExtractor={(item) => item.eventId}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardAccent} />
                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    <View style={styles.countBadge}>
                      <Ionicons name="people-outline" size={12} color={colors.textOnPrimary} />
                      <Text style={styles.countBadgeText}>
                        {item.attendeeCount}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.codeRow}>
                    <Ionicons name="barcode-outline" size={13} color={colors.primary} />
                    <Text style={styles.eventCode}>{item.eventCode}</Text>
                  </View>
                  {item.startTime ? (
                    <Text style={styles.eventMeta}>
                      Starts {formatDate(item.startTime)}
                    </Text>
                  ) : null}

                  <View style={styles.attendeeList}>
                    {item.attendees.length === 0 ? (
                      <Text style={styles.eventMeta}>No scans yet.</Text>
                    ) : (
                      item.attendees.map((attendee) => (
                        <View
                          key={attendee.studentId}
                          style={styles.attendeeRow}
                        >
                          <View style={styles.attendeeDot} />
                          <Text style={styles.attendeeName}>
                            {attendee.studentName?.trim()
                              ? attendee.studentName
                              : shortId(attendee.studentId)}
                          </Text>
                          <Text style={styles.attendeeTime}>
                            {formatDate(attendee.scannedAt)}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenTitle
        styles={styles}
        count={studentRecords.length}
        label="records"
      />

      {studentRecords.length === 0 ? (
        <EmptyState
          styles={styles}
          icon="scan-outline"
          message="No records yet. Scan a QR code to register your attendance."
        />
      ) : (
        <FlatList
          data={studentRecords}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.card, styles.cardSingle]}>
              <View style={styles.cardAccent} />
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={styles.eventTitle}>{item.eventTitle}</Text>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.success}
                  />
                </View>
                <View style={styles.codeRow}>
                  <Ionicons name="barcode-outline" size={13} color={colors.primary} />
                  <Text style={styles.eventCode}>{item.eventId}</Text>
                </View>
                <Text style={styles.eventMeta}>{formatDate(item.scannedAt)}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

function ScreenTitle({
  styles,
  count,
  label,
}: {
  styles: ReturnType<typeof makeStyles>;
  count: number;
  label: string;
}) {
  return (
    <View style={styles.titleRow}>
      <Text style={styles.title}>Attendance History</Text>
      <View style={styles.totalBadge}>
        <Text style={styles.totalBadgeText}>
          {count} {label}
        </Text>
      </View>
    </View>
  );
}

function EmptyState({
  styles,
  icon,
  message,
}: {
  styles: ReturnType<typeof makeStyles>;
  icon: 'calendar-outline' | 'scan-outline';
  message: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      <Text style={styles.subtitle}>{message}</Text>
    </View>
  );
}

function shortId(id: string) {
  return id ? `...${id.slice(-8)}` : 'unknown';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

const makeStyles = (c: Palette, r: Radius) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      paddingHorizontal: 24,
      paddingTop: 24,
    },
    centered: {
      alignItems: 'center',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: c.textPrimary,
      letterSpacing: 0.2,
      flexShrink: 1,
      marginRight: 8,
    },
    totalBadge: {
      backgroundColor: c.tint,
      borderRadius: r.chip,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    totalBadgeText: {
      fontSize: 12,
      fontWeight: '800',
      color: c.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    subtitle: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginTop: 12,
      paddingHorizontal: 12,
    },
    empty: {
      alignItems: 'center',
      marginTop: 40,
      paddingHorizontal: 12,
    },
    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.tint,
      borderWidth: 1.5,
      borderColor: c.primary + '40',
      alignItems: 'center',
      justifyContent: 'center',
    },
    list: {
      paddingBottom: 24,
    },
    card: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderRadius: r.card,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 12,
      overflow: 'hidden',
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: c.shadowOpacity,
      shadowRadius: 8,
      elevation: 3,
    },
    cardSingle: {},
    cardAccent: {
      width: 4,
      backgroundColor: c.primary,
    },
    cardBody: {
      flex: 1,
      padding: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    eventTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.textPrimary,
      flexShrink: 1,
      marginRight: 8,
    },
    codeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
    },
    eventCode: {
      fontSize: 13,
      fontFamily: 'monospace',
      fontWeight: '700',
      color: c.primary,
      marginLeft: 6,
      letterSpacing: 0.4,
    },
    eventMeta: {
      fontSize: 13,
      color: c.muted,
      marginTop: 4,
    },
    countBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.primary,
      borderRadius: r.chip,
      minWidth: 28,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    countBadgeText: {
      color: c.textOnPrimary,
      fontSize: 13,
      fontWeight: '800',
      marginLeft: 4,
    },
    attendeeList: {
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: 8,
    },
    attendeeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
    },
    attendeeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.success,
      marginRight: 8,
    },
    attendeeName: {
      fontSize: 14,
      color: c.textPrimary,
      flexShrink: 1,
      marginRight: 8,
    },
    attendeeTime: {
      fontSize: 12,
      color: c.muted,
      marginLeft: 'auto',
    },
  });
