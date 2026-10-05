import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useFocusEffect } from 'expo-router';

import AppButton from '@/components/AppButton';
import AppTextInput from '@/components/AppTextInput';
import { useTheme } from '@/lib/theme';
import { useAuth, syncProfile } from '@/lib/auth';
import { createEvent } from '@/lib/events';
import { getProfile, type Role } from '@/lib/profiles';
import { buildQRPayload } from '@/lib/qr';
import type { Palette, Radius } from '@/constants/themes';

function toLocalISO(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
}

function formatDateTime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${month} ${pad(date.getDate())}, ${date.getFullYear()} at ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

const QUICK_END_OPTIONS = [
  { label: '+30 min', ms: 30 * 60 * 1000 },
  { label: '+1 hour', ms: 60 * 60 * 1000 },
  { label: '+2 hours', ms: 2 * 60 * 60 * 1000 },
];

type EditTarget = 'start' | 'end';

export default function TeacherScreen() {
  const { user, session } = useAuth();
  const { colors, radius } = useTheme();
  const styles = makeStyles(colors, radius);
  const [role, setRole] = useState<Role | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [eventId, setEventId] = useState('');
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(
    () => new Date(Date.now() + 60 * 60 * 1000)
  );
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editingPart, setEditingPart] = useState<'date' | 'time'>('date');
  const [payload, setPayload] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageError, setMessageError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!user) {
        setRoleLoading(false);
        return () => {
          active = false;
        };
      }
      (async () => {
        let profile = await getProfile(user.id);
        const metadataRole =
          (session?.user?.user_metadata?.role as
            | 'student'
            | 'teacher'
            | undefined) ?? null;

        if ((profile?.role ?? 'student') !== 'teacher' && metadataRole !== 'teacher') {
          // Self-heal: apply the signup intent / metadata, then re-read —
          // so a stale row repairs itself while you look at this screen.
          await syncProfile(session);
          profile = await getProfile(user.id);
        }
        if (!active) return;
        const finalRole = profile?.role ?? metadataRole ?? 'student';
        setRole(finalRole);
        setRoleLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [user, session])
  );

  const isAndroid = Platform.OS === 'android';

  const openPicker = (target: EditTarget) => {
    setMessage(null);
    setMessageError(false);
    setEditTarget(target);
    setEditingPart('date');
  };

  const onPickerChange = (
    event: DateTimePickerEvent,
    selected?: Date
  ) => {
    if (!editTarget) return;
    if (event.type === 'dismissed' || !selected) {
      setEditTarget(null);
      setEditingPart('date');
      return;
    }

    const current = editTarget === 'start' ? startDate : endDate;
    const next = new Date(current);
    next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);

    if (editTarget === 'start') setStartDate(next);
    else setEndDate(next);

    if (isAndroid && editingPart === 'date') {
      setEditingPart('time');
    } else {
      setEditTarget(null);
      setEditingPart('date');
    }
  };

  const handleQuickEnd = (ms: number) => {
    setMessage(null);
    setMessageError(false);
    setEndDate(new Date(startDate.getTime() + ms));
  };

  const handleCreateEvent = async () => {
    const event = {
      eventId: eventId.trim(),
      title: title.trim(),
      start: toLocalISO(startDate),
      end: toLocalISO(endDate),
    };

    if (!event.eventId || !event.title) {
      setMessage('Event title and code are required.');
      setMessageError(true);
      return;
    }

    if (endDate.getTime() <= startDate.getTime()) {
      setMessage('End time must be after start time.');
      setMessageError(true);
      return;
    }

    try {
      const { error } = await createEvent(event);
      if (error) {
        throw new Error(error);
      }
      setMessage('Event saved! Scan the QR with the Scan tab to test it.');
      setMessageError(false);
      setPayload(buildQRPayload(event));
    } catch (err: any) {
      setMessage(err?.message || 'Could not save the event.');
      setMessageError(true);
    }
  };

  if (roleLoading) {
    return (
      <View style={styles.gateContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.gateText}>Checking your account...</Text>
      </View>
    );
  }

  if (role !== 'teacher') {
    return (
      <View style={styles.gateContainer}>
        <View style={styles.gateIcon}>
          <Ionicons
            name="lock-closed-outline"
            size={40}
            color={colors.primary}
          />
        </View>
        <Text style={styles.gateTitle}>Teachers Only</Text>
        <Text style={styles.gateText}>Only teacher accounts can create events.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.introCard}>
        <View style={styles.introIcon}>
          <Ionicons name="qr-code" size={22} color={colors.primary} />
        </View>
        <View style={styles.introText}>
          <Text style={styles.title}>Create Event QR</Text>
          <Text style={styles.subtitle}>
            Fill in the event details, then scan the generated QR with the Scan tab.
          </Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Event Title</Text>
        <AppTextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Founders Day Assembly"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.label}>Event Code</Text>
        <AppTextInput
          value={eventId}
          onChangeText={setEventId}
          placeholder="e.g. EVT-2026-0002"
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
          style={styles.codeInput}
        />

        <Text style={styles.label}>Starts</Text>
        <PickerField
          value={formatDateTime(startDate)}
          icon="sunny-outline"
          onPress={() => openPicker('start')}
        />

        <Text style={styles.label}>Ends</Text>
        <PickerField
          value={formatDateTime(endDate)}
          icon="moon-outline"
          onPress={() => openPicker('end')}
        />
        <View style={styles.chipRow}>
          {QUICK_END_OPTIONS.map((option) => (
            <Pressable
              key={option.label}
              style={styles.chip}
              onPress={() => handleQuickEnd(option.ms)}
              accessibilityRole="button"
            >
              <Ionicons name="time-outline" size={13} color={colors.primary} />
              <Text style={styles.chipText}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.hint}>Tap a chip to set the end time from start.</Text>

        {message && (
          <View
            style={[
              styles.messageBox,
              {
                backgroundColor: messageError
                  ? colors.danger + '14'
                  : colors.success + '14',
                borderColor: messageError
                  ? colors.danger + '4D'
                  : colors.success + '4D',
              },
            ]}
          >
            <Ionicons
              name={messageError ? 'alert-circle-outline' : 'checkmark-circle-outline'}
              size={17}
              color={messageError ? colors.danger : colors.success}
            />
            <Text
              style={[
                styles.message,
                messageError && styles.messageError,
              ]}
            >
              {message}
            </Text>
          </View>
        )}

        <AppButton
          theme="primary"
          title="Create Event"
          icon="add-circle-outline"
          onPress={handleCreateEvent}
        />
      </View>

      {editTarget && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={editTarget === 'start' ? startDate : endDate}
            mode={isAndroid ? editingPart : 'datetime'}
            display={isAndroid ? 'default' : 'spinner'}
            onChange={onPickerChange}
          />
        </View>
      )}

      {payload && (
        <View style={styles.resultCard}>
          <View style={styles.resultHead}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.resultTitle}>Ready to scan</Text>
          </View>
          <Text style={styles.resultSubtitle}>
            Scan this QR code with the Scan tab
          </Text>
          <View style={styles.qrBox}>
            <QRCode value={payload} size={200} />
          </View>
          <Text style={styles.payloadText} selectable>
            {payload}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

type PickerFieldProps = {
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

function PickerField({ value, icon, onPress }: PickerFieldProps) {
  const { colors, radius } = useTheme();
  const styles = makeStyles(colors, radius);
  return (
    <Pressable
      style={({ pressed }) => [styles.pickerField, pressed && styles.pickerFieldPressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={styles.pickerIcon}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={styles.pickerValue}>{value}</Text>
      <Ionicons name="calendar-outline" size={18} color={colors.muted} />
    </Pressable>
  );
}

const makeStyles = (c: Palette, r: Radius) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    gateContainer: {
      flex: 1,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    gateIcon: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: c.tint,
      borderWidth: 1.5,
      borderColor: c.primary + '4D',
      alignItems: 'center',
      justifyContent: 'center',
    },
    gateTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: c.textPrimary,
      marginTop: 14,
    },
    gateText: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      marginTop: 6,
      lineHeight: 20,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 40,
    },
    introCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: r.card,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      marginBottom: 16,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: c.shadowOpacity,
      shadowRadius: 8,
      elevation: 3,
    },
    introIcon: {
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor: c.tint,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    introText: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: c.textPrimary,
      marginBottom: 2,
      letterSpacing: 0.2,
    },
    subtitle: {
      fontSize: 13,
      color: c.textSecondary,
      lineHeight: 18,
    },
    formCard: {
      backgroundColor: c.card,
      borderRadius: r.card,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      marginBottom: 16,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: c.shadowOpacity,
      shadowRadius: 8,
      elevation: 3,
    },
    label: {
      fontSize: 11,
      fontWeight: '800',
      color: c.muted,
      marginBottom: 6,
      marginTop: 12,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    codeInput: {
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    pickerField: {
      backgroundColor: c.surface,
      borderRadius: r.input,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 12,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    pickerFieldPressed: {
      borderColor: c.primary,
      backgroundColor: c.tint,
    },
    pickerIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    pickerValue: {
      flex: 1,
      fontSize: 14,
      fontWeight: '700',
      color: c.textPrimary,
      marginHorizontal: 10,
    },
    chipRow: {
      flexDirection: 'row',
      marginTop: 10,
      gap: 8,
      flexWrap: 'wrap',
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.tint,
      borderRadius: r.chip,
      borderWidth: 1,
      borderColor: c.primary + '40',
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '700',
      color: c.primary,
      marginLeft: 5,
    },
    hint: {
      fontSize: 12,
      color: c.muted,
      marginTop: 6,
    },
    messageBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderWidth: 1,
      borderRadius: r.input,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: 14,
      marginBottom: 4,
    },
    message: {
      fontSize: 13,
      color: c.textPrimary,
      flex: 1,
      marginLeft: 8,
      lineHeight: 18,
      fontWeight: '600',
    },
    messageError: {
      color: c.danger,
    },
    pickerContainer: {
      marginTop: 4,
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: r.card,
      borderWidth: 1,
      borderColor: c.border,
      padding: 8,
      marginBottom: 16,
    },
    resultCard: {
      backgroundColor: c.card,
      borderRadius: r.card,
      borderWidth: 1,
      borderColor: c.border,
      padding: 18,
      alignItems: 'center',
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: c.shadowOpacity,
      shadowRadius: 12,
      elevation: 4,
    },
    resultHead: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    resultTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: c.textPrimary,
      marginLeft: 6,
    },
    resultSubtitle: {
      fontSize: 13,
      color: c.muted,
      textAlign: 'center',
      marginBottom: 14,
    },
    qrBox: {
      backgroundColor: '#FFFFFF',
      padding: 12,
      borderRadius: 12,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    payloadText: {
      fontSize: 11,
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
      color: c.muted,
      textAlign: 'center',
      lineHeight: 16,
    },
  });
