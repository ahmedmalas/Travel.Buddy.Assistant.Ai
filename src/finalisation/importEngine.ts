/**
 * Slice 89 — Universal import engine.
 * Manual upload only. PDF is treated as extractable text when provided as text/plain or pre-extracted content.
 */

export type ImportSourceKind = 'pdf_text' | 'email' | 'ics' | 'csv' | 'travel_buddy_backup';

export type ImportedEntityKind =
  | 'flight'
  | 'accommodation'
  | 'ground_transport'
  | 'activity'
  | 'traveller';

export interface ImportedEntity {
  id: string;
  kind: ImportedEntityKind;
  title: string;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  confirmationNumber: string | null;
  location: string | null;
  travellerHint: string | null;
  confidence: number; // 0–100
  rawSnippet: string;
  selected: boolean;
}

export interface ImportReviewDraft {
  id: string;
  sourceKind: ImportSourceKind;
  fileName: string;
  importedAt: string;
  entities: ImportedEntity[];
  warnings: string[];
  overallConfidence: number;
}

export interface FileValidationResult {
  ok: boolean;
  message: string;
  sizeBytes: number;
  mimeHint: string;
}

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.pdf', '.eml', '.txt', '.ics', '.csv', '.json'];

export function validateImportFile(input: {
  fileName: string;
  sizeBytes: number;
  mimeType?: string;
}): FileValidationResult {
  const lower = input.fileName.toLowerCase();
  const extOk = ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  if (!extOk) {
    return {
      ok: false,
      message: `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
      sizeBytes: input.sizeBytes,
      mimeHint: input.mimeType ?? 'unknown',
    };
  }
  if (input.sizeBytes <= 0) {
    return {
      ok: false,
      message: 'File is empty.',
      sizeBytes: input.sizeBytes,
      mimeHint: input.mimeType ?? 'unknown',
    };
  }
  if (input.sizeBytes > MAX_IMPORT_BYTES) {
    return {
      ok: false,
      message: `File exceeds ${MAX_IMPORT_BYTES} byte limit.`,
      sizeBytes: input.sizeBytes,
      mimeHint: input.mimeType ?? 'unknown',
    };
  }
  return {
    ok: true,
    message: 'File accepted for local parsing.',
    sizeBytes: input.sizeBytes,
    mimeHint: input.mimeType ?? 'unknown',
  };
}

function detectSourceKind(fileName: string, content: string): ImportSourceKind {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.ics')) return 'ics';
  if (lower.endsWith('.csv')) return 'csv';
  if (lower.endsWith('.json') || content.includes('"schema": "travel-buddy-backup"')) {
    return 'travel_buddy_backup';
  }
  if (lower.endsWith('.eml') || /^(from|subject|date):/im.test(content)) return 'email';
  return 'pdf_text';
}

function nextId(prefix: string, index: number): string {
  return `${prefix}-${index}-${Math.abs(hash(prefix + String(index))).toString(16)}`;
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}

const DATE_RE = /\b(20\d{2}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/20\d{2})\b/g;
const TIME_RE = /\b([01]?\d|2[0-3]):[0-5]\d\b/g;
const CONF_RE = /\b(?:confirmation|booking|pnr|ref(?:erence)?)\s*[#:]?\s*([A-Z0-9-]{5,})\b/gi;
const FLIGHT_RE =
  /\b(?:flight|depart(?:ure)?|arrive|airline)\b.*?(?:([A-Z]{3})\s*(?:→|->|to)\s*([A-Z]{3})|([A-Z]{2}\d{1,4}))/gi;
const HOTEL_RE = /\b(?:hotel|check[- ]?in|accommodation|stay at)\b[:\s-]*(.+)$/gim;
const TRANSFER_RE = /\b(?:transfer|taxi|train|bus|car hire|rental)\b[:\s-]*(.+)$/gim;
const ACTIVITY_RE = /\b(?:tour|museum|excursion|ticket)\b[:\s-]*(.+)$/gim;

function normalizeDate(raw: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(20\d{2})$/);
  if (!m) return null;
  return `${m[3]}-${m[1]!.padStart(2, '0')}-${m[2]!.padStart(2, '0')}`;
}

function extractDates(text: string): string[] {
  const matches = text.match(DATE_RE) ?? [];
  return matches.map(normalizeDate).filter((value): value is string => Boolean(value));
}

function extractTimes(text: string): string[] {
  return text.match(TIME_RE) ?? [];
}

function parseIcs(content: string): ImportedEntity[] {
  const events = content.split('BEGIN:VEVENT').slice(1);
  return events.map((block, index) => {
    const summary = block.match(/SUMMARY:(.+)/i)?.[1]?.trim() ?? `Calendar event ${index + 1}`;
    const dtStart = block.match(/DTSTART[^:]*:(\d{8}T?\d{0,6})/i)?.[1] ?? '';
    const dtEnd = block.match(/DTEND[^:]*:(\d{8}T?\d{0,6})/i)?.[1] ?? '';
    const uid = block.match(/UID:(.+)/i)?.[1]?.trim() ?? null;
    const startDate = dtStart ? `${dtStart.slice(0, 4)}-${dtStart.slice(4, 6)}-${dtStart.slice(6, 8)}` : null;
    const endDate = dtEnd ? `${dtEnd.slice(0, 4)}-${dtEnd.slice(4, 6)}-${dtEnd.slice(6, 8)}` : startDate;
    const startTime =
      dtStart.length >= 13 ? `${dtStart.slice(9, 11)}:${dtStart.slice(11, 13)}` : null;
    const endTime = dtEnd.length >= 13 ? `${dtEnd.slice(9, 11)}:${dtEnd.slice(11, 13)}` : null;
    const kind: ImportedEntityKind = /flight|air/i.test(summary)
      ? 'flight'
      : /hotel|stay|check/i.test(summary)
        ? 'accommodation'
        : /train|bus|taxi|transfer|car/i.test(summary)
          ? 'ground_transport'
          : 'activity';
    return {
      id: nextId('ics', index),
      kind,
      title: summary.replace(/\\,/g, ','),
      startDate,
      endDate,
      startTime,
      endTime,
      confirmationNumber: uid,
      location: block.match(/LOCATION:(.+)/i)?.[1]?.trim() ?? null,
      travellerHint: null,
      confidence: startDate ? 88 : 55,
      rawSnippet: summary,
      selected: true,
    };
  });
}

function parseCsv(content: string): ImportedEntity[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = lines[0]!.split(',').map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line, index) => {
    const cols = line.split(',').map((c) => c.trim());
    const get = (name: string) => {
      const idx = headers.findIndex((h) => h.includes(name));
      return idx >= 0 ? cols[idx] ?? '' : '';
    };
    const kindRaw = get('type') || get('kind') || 'activity';
    const kind: ImportedEntityKind = /flight/i.test(kindRaw)
      ? 'flight'
      : /hotel|accommodation|stay/i.test(kindRaw)
        ? 'accommodation'
        : /transport|transfer|train|bus|car/i.test(kindRaw)
          ? 'ground_transport'
          : /traveller|passenger/i.test(kindRaw)
            ? 'traveller'
            : 'activity';
    const title = get('title') || get('name') || `CSV row ${index + 1}`;
    return {
      id: nextId('csv', index),
      kind,
      title,
      startDate: normalizeDate(get('start') || get('date') || '') || null,
      endDate: normalizeDate(get('end') || '') || null,
      startTime: get('start_time') || get('time') || null,
      endTime: get('end_time') || null,
      confirmationNumber: get('confirmation') || get('pnr') || get('ref') || null,
      location: get('location') || get('destination') || null,
      travellerHint: get('traveller') || get('passenger') || null,
      confidence: 80,
      rawSnippet: line.slice(0, 160),
      selected: true,
    };
  });
}

function parseBackupJson(content: string): ImportedEntity[] {
  try {
    const parsed = JSON.parse(content) as {
      trip?: {
        flights?: Array<Record<string, unknown>>;
        stays?: Array<Record<string, unknown>>;
        groundTransport?: Array<Record<string, unknown>>;
        bookings?: Array<Record<string, unknown>>;
        travellers?: Array<Record<string, unknown>>;
      };
    };
    const trip = parsed.trip ?? {};
    const entities: ImportedEntity[] = [];
    let index = 0;
    for (const flight of trip.flights ?? []) {
      entities.push({
        id: nextId('bak-flight', index++),
        kind: 'flight',
        title: String(
          flight.flightNumber || `${flight.departureAirport ?? ''}→${flight.arrivalAirport ?? 'Flight'}`,
        ),
        startDate: String(flight.departureDate ?? '') || null,
        endDate: String(flight.arrivalDate ?? flight.departureDate ?? '') || null,
        startTime: String(flight.departureTime ?? '') || null,
        endTime: String(flight.arrivalTime ?? '') || null,
        confirmationNumber: String(flight.bookingReference ?? flight.confirmationNumber ?? '') || null,
        location: String(flight.departureAirport ?? '') || null,
        travellerHint: null,
        confidence: 95,
        rawSnippet: JSON.stringify(flight).slice(0, 160),
        selected: true,
      });
    }
    for (const stay of trip.stays ?? []) {
      entities.push({
        id: nextId('bak-stay', index++),
        kind: 'accommodation',
        title: String(stay.name || stay.propertyName || 'Stay'),
        startDate: String(stay.checkInDate ?? '') || null,
        endDate: String(stay.checkOutDate ?? '') || null,
        startTime: String(stay.checkInTime ?? '') || null,
        endTime: String(stay.checkOutTime ?? '') || null,
        confirmationNumber: String(stay.confirmationNumber ?? '') || null,
        location: String(stay.address || stay.city || '') || null,
        travellerHint: null,
        confidence: 95,
        rawSnippet: JSON.stringify(stay).slice(0, 160),
        selected: true,
      });
    }
    for (const ground of trip.groundTransport ?? []) {
      entities.push({
        id: nextId('bak-ground', index++),
        kind: 'ground_transport',
        title: String(ground.provider || ground.mode || 'Transport'),
        startDate: String(ground.pickupDate ?? '') || null,
        endDate: String(ground.dropoffDate ?? '') || null,
        startTime: String(ground.pickupTime ?? '') || null,
        endTime: String(ground.dropoffTime ?? '') || null,
        confirmationNumber: String(ground.reference ?? '') || null,
        location: String(ground.pickupLocation ?? '') || null,
        travellerHint: null,
        confidence: 93,
        rawSnippet: JSON.stringify(ground).slice(0, 160),
        selected: true,
      });
    }
    for (const booking of trip.bookings ?? []) {
      if (entities.some((e) => e.confirmationNumber && e.confirmationNumber === booking.confirmationNumber)) {
        continue;
      }
      const type = String(booking.type ?? 'activity');
      entities.push({
        id: nextId('bak-booking', index++),
        kind: /flight/i.test(type)
          ? 'flight'
          : /hotel/i.test(type)
            ? 'accommodation'
            : /transport/i.test(type)
              ? 'ground_transport'
              : 'activity',
        title: String(booking.title || 'Booking'),
        startDate: String(booking.startDate ?? '') || null,
        endDate: String(booking.endDate ?? '') || null,
        startTime: String(booking.startTime ?? '') || null,
        endTime: String(booking.endTime ?? '') || null,
        confirmationNumber: String(booking.confirmationNumber ?? '') || null,
        location: String(booking.location ?? '') || null,
        travellerHint: null,
        confidence: 90,
        rawSnippet: JSON.stringify(booking).slice(0, 160),
        selected: true,
      });
    }
    for (const traveller of trip.travellers ?? []) {
      entities.push({
        id: nextId('bak-traveller', index++),
        kind: 'traveller',
        title: String(traveller.name || 'Traveller'),
        startDate: null,
        endDate: null,
        startTime: null,
        endTime: null,
        confirmationNumber: null,
        location: null,
        travellerHint: String(traveller.name || ''),
        confidence: 92,
        rawSnippet: JSON.stringify(traveller).slice(0, 160),
        selected: true,
      });
    }
    return entities;
  } catch {
    return [];
  }
}

function parseFreeText(content: string, sourceKind: ImportSourceKind): ImportedEntity[] {
  const entities: ImportedEntity[] = [];
  let index = 0;
  const dates = extractDates(content);
  const times = extractTimes(content);
  const confidences = [...content.matchAll(CONF_RE)].map((m) => m[1] ?? null);

  for (const match of content.matchAll(FLIGHT_RE)) {
    const route =
      match[1] && match[2] ? `${match[1]}→${match[2]}` : match[3] ? String(match[3]) : 'Flight';
    entities.push({
      id: nextId('txt-flight', index++),
      kind: 'flight',
      title: `Flight ${route}`,
      startDate: dates[0] ?? null,
      endDate: dates[1] ?? dates[0] ?? null,
      startTime: times[0] ?? null,
      endTime: times[1] ?? null,
      confirmationNumber: confidences[0] ?? null,
      location: match[1] ?? null,
      travellerHint: null,
      confidence: sourceKind === 'email' ? 72 : 65,
      rawSnippet: match[0].slice(0, 160),
      selected: true,
    });
  }

  for (const match of content.matchAll(HOTEL_RE)) {
    entities.push({
      id: nextId('txt-stay', index++),
      kind: 'accommodation',
      title: match[1]?.trim().slice(0, 80) || 'Accommodation',
      startDate: dates[0] ?? null,
      endDate: dates[1] ?? null,
      startTime: null,
      endTime: null,
      confirmationNumber: confidences[0] ?? null,
      location: match[1]?.trim().slice(0, 80) || null,
      travellerHint: null,
      confidence: sourceKind === 'email' ? 70 : 60,
      rawSnippet: match[0].slice(0, 160),
      selected: true,
    });
  }

  for (const match of content.matchAll(TRANSFER_RE)) {
    entities.push({
      id: nextId('txt-ground', index++),
      kind: 'ground_transport',
      title: match[1]?.trim().slice(0, 80) || 'Ground transport',
      startDate: dates[0] ?? null,
      endDate: dates[0] ?? null,
      startTime: times[0] ?? null,
      endTime: times[1] ?? null,
      confirmationNumber: confidences[1] ?? confidences[0] ?? null,
      location: null,
      travellerHint: null,
      confidence: 58,
      rawSnippet: match[0].slice(0, 160),
      selected: true,
    });
  }

  for (const match of content.matchAll(ACTIVITY_RE)) {
    entities.push({
      id: nextId('txt-activity', index++),
      kind: 'activity',
      title: match[1]?.trim().slice(0, 80) || 'Activity',
      startDate: dates[0] ?? null,
      endDate: dates[0] ?? null,
      startTime: times[0] ?? null,
      endTime: null,
      confirmationNumber: null,
      location: null,
      travellerHint: null,
      confidence: 52,
      rawSnippet: match[0].slice(0, 160),
      selected: true,
    });
  }

  return entities;
}

export function parseImportContent(input: {
  fileName: string;
  content: string;
}): ImportReviewDraft {
  const sourceKind = detectSourceKind(input.fileName, input.content);
  const warnings: string[] = [];
  let entities: ImportedEntity[] = [];

  if (sourceKind === 'ics') {
    entities = parseIcs(input.content);
  } else if (sourceKind === 'csv') {
    entities = parseCsv(input.content);
  } else if (sourceKind === 'travel_buddy_backup') {
    entities = parseBackupJson(input.content);
    if (!entities.length) warnings.push('Backup JSON parsed but no trip entities were found.');
  } else {
    if (input.fileName.toLowerCase().endsWith('.pdf')) {
      warnings.push(
        'PDF binary parsing is not embedded; provide extracted PDF text (.txt) or paste itinerary text for best results.',
      );
    }
    entities = parseFreeText(input.content, sourceKind);
  }

  if (!entities.length) {
    warnings.push('No entities detected. Review the source format or paste clearer itinerary text.');
  }

  const overallConfidence = entities.length
    ? Math.round(entities.reduce((sum, entity) => sum + entity.confidence, 0) / entities.length)
    : 0;

  return {
    id: `import-${Date.now().toString(36)}`,
    sourceKind,
    fileName: input.fileName,
    importedAt: new Date().toISOString(),
    entities,
    warnings,
    overallConfidence,
  };
}

export function toggleImportEntity(
  draft: ImportReviewDraft,
  entityId: string,
  selected: boolean,
): ImportReviewDraft {
  return {
    ...draft,
    entities: draft.entities.map((entity) =>
      entity.id === entityId ? { ...entity, selected } : entity,
    ),
  };
}

export function selectedImportEntities(draft: ImportReviewDraft): ImportedEntity[] {
  return draft.entities.filter((entity) => entity.selected);
}
