export type QRPayload = {
  v: 1;
  event: string;
  title?: string;
  start?: string;
  end?: string;
};

export type ParseQRResult =
  | { ok: true; payload: QRPayload }
  | { ok: false; message: string };

export function buildQRPayload(event: {
  eventId: string;
  title: string;
  start?: string;
  end?: string;
}): string {
  return JSON.stringify({
    v: 1,
    event: event.eventId,
    title: event.title,
    start: event.start,
    end: event.end,
  });
}

export function parseQRPayload(raw: string): ParseQRResult {
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return { ok: false, message: 'Invalid QR code.' };
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    (payload as { v?: unknown }).v !== 1 ||
    typeof (payload as { event?: unknown }).event !== 'string' ||
    !(payload as { event?: string }).event
  ) {
    return { ok: false, message: 'Not an attendance QR code.' };
  }

  return { ok: true, payload: payload as QRPayload };
}
