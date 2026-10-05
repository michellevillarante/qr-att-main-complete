import { getEventByCode } from './events';
import { parseQRPayload } from './qr';
import { supabase } from './supabase';

export type AttendanceRecord = {
  id: string;
  eventId: string;
  eventTitle: string;
  scannedAt: string;
};

export type RegisterResult = {
  success: boolean;
  message: string;
  eventTitle?: string;
};

export type Attendee = {
  studentId: string;
  scannedAt: string;
  studentName?: string | null;
};

export type TeacherEventAttendance = {
  eventId: string;
  eventCode: string;
  title: string;
  startTime: string | null;
  endTime: string | null;
  attendeeCount: number;
  attendees: Attendee[];
};

export type TeacherEventSummary = {
  eventId: string;
  eventCode: string;
  title: string;
  attendeeCount: number;
};

export async function registerAttendance(
  rawPayload: string,
  studentId: string
): Promise<RegisterResult> {
  const parsed = parseQRPayload(rawPayload);
  if (!parsed.ok) {
    return { success: false, message: parsed.message };
  }
  const payload = parsed.payload;

  const now = Date.now();
  const start = payload.start ? new Date(payload.start).getTime() : null;
  const end = payload.end ? new Date(payload.end).getTime() : null;

  if (start && now < start) {
    return { success: false, message: 'Event has not started yet.' };
  }
  if (end && now > end) {
    return { success: false, message: 'Event has already ended.' };
  }

  const title = payload.title ?? payload.event;

  let foundEvent;
  try {
    foundEvent = await getEventByCode(payload.event);
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? `Could not look up the event in Supabase: ${error.message}`
          : 'Could not look up the event in Supabase.',
    };
  }

  let event: { id: string; title: string };
  if (foundEvent) {
    event = { id: foundEvent.id, title: foundEvent.title };
  } else {
    const { data: newEvent, error: insertError } = await supabase
      .from('events')
      .insert([
        {
          event_code: payload.event,
          title,
          start_time: payload.start ?? null,
          end_time: payload.end ?? null,
        },
      ])
      .select('id, title')
      .single();

    if (insertError || !newEvent) {
      const missingTable =
        insertError?.code === '42P01' ||
        /table .*events.*does not exist|event.*does not exist/i.test(
          insertError?.message ?? ''
        );

      return {
        success: false,
        message: missingTable
          ? 'Event table is missing. Run docs/schema.sql in Supabase SQL Editor.'
          : insertError?.message ?? 'Could not save the event in Supabase.',
      };
    }
    event = newEvent;
  }

  const { error: attError } = await supabase.from('attendance').insert([
    {
      student_id: studentId,
      event_id: event.id,
    },
  ]);

  if (attError) {
    if (attError.code === '23505') {
      return {
        success: false,
        message: 'Already registered for this event.',
        eventTitle: event.title,
      };
    }
    return { success: false, message: attError.message };
  }

  return {
    success: true,
    message: 'Attendance recorded!',
    eventTitle: event.title,
  };
}

export async function getAttendanceHistory(
  studentId: string
): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('id, scanned_at, events ( event_code, title )')
    .eq('student_id', studentId)
    .order('scanned_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    eventId: row.events?.event_code ?? '',
    eventTitle: row.events?.title ?? '',
    scannedAt: row.scanned_at,
  }));
}

export async function getTeacherEventAttendance(
  teacherId: string
): Promise<TeacherEventAttendance[]> {
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id, event_code, title, start_time, end_time')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });

  if (eventError || !events) return [];

  const eventIds = events.map((e: any) => e.id);
  if (eventIds.length === 0) return [];

  const { data: attendance, error: attError } = await supabase
    .from('attendance')
    .select('student_id, scanned_at, event_id')
    .in('event_id', eventIds)
    .order('scanned_at', { ascending: false });

  const rows: any[] = attError ? [] : attendance ?? [];

  const namesById = await loadAttendeeNames(rows);

  return events.map((e: any) => {
    const eventRows = rows.filter((a: any) => a.event_id === e.id);
    return {
      eventId: e.id,
      eventCode: e.event_code,
      title: e.title,
      startTime: e.start_time,
      endTime: e.end_time,
      attendeeCount: eventRows.length,
      attendees: eventRows.map((a: any) => ({
        studentId: a.student_id,
        scannedAt: a.scanned_at,
        studentName: namesById[a.student_id] ?? null,
      })),
    };
  });
}

async function loadAttendeeNames(
  rows: any[]
): Promise<Record<string, string | null>> {
  const studentIds = Array.from(
    new Set(rows.map((row) => row.student_id).filter(Boolean))
  );

  if (studentIds.length === 0) return {};

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', studentIds);

  if (error || !profiles) return {};

  const names: Record<string, string | null> = {};
  profiles.forEach((profile: any) => {
    names[profile.id] = profile.full_name ?? null;
  });
  return names;
}

export async function getTeacherEventSummary(
  teacherId: string
): Promise<TeacherEventSummary[]> {
  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id, event_code, title')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });

  if (eventError || !events) return [];

  const eventIds = events.map((e: any) => e.id);
  if (eventIds.length === 0) return [];

  const { data: attRows } = await supabase
    .from('attendance')
    .select('event_id')
    .in('event_id', eventIds);

  const counts: Record<string, number> = {};
  (attRows ?? []).forEach((row: any) => {
    counts[row.event_id] = (counts[row.event_id] ?? 0) + 1;
  });

  return events.map((e: any) => ({
    eventId: e.id,
    eventCode: e.event_code,
    title: e.title,
    attendeeCount: counts[e.id] ?? 0,
  }));
}
