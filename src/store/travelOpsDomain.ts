/**
 * Slices 61–68 — Destination, flights, stays, transport, maps, checklists, emergency, journal.
 * Pure domain types + sanitizers; wired into TripData via tripDomain migration.
 */

const asString = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);
const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const asBoolean = (value: unknown, fallback = false): boolean => (typeof value === 'boolean' ? value : fallback);
const isIsoDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
const isTime = (value: string): boolean => value === '' || /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

export type DestinationProfile = {
  id: string;
  name: string;
  country: string;
  city: string;
  region: string;
  language: string;
  currency: string;
  timezone: string;
  entryRequirements: string;
  safetyNotes: string;
  emergencyInfo: string;
  customsNotes: string;
  practicalNotes: string;
  savedOffline: boolean;
};

export type FlightCheckInStatus = 'not-open' | 'open' | 'checked-in' | 'boarding' | 'completed' | 'cancelled';

export type FlightSegment = {
  id: string;
  airline: string;
  flightNumber: string;
  bookingReference: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTerminal: string;
  arrivalTerminal: string;
  departureGate: string;
  arrivalGate: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  layoverMinutes: number;
  cabin: string;
  seat: string;
  baggageAllowance: string;
  checkInStatus: FlightCheckInStatus;
  statusNotes: string;
  travellerIds: string[];
  cost: number;
  currency: string;
  notes: string;
};

export type StayType = 'hotel' | 'apartment' | 'hostel' | 'resort' | 'other';
export type PaymentStatus = 'unpaid' | 'deposit' | 'paid' | 'refunded';

export type AccommodationStay = {
  id: string;
  type: StayType;
  name: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  roomInfo: string;
  confirmationNumber: string;
  cost: number;
  currency: string;
  paymentStatus: PaymentStatus;
  amenities: string;
  notes: string;
  itineraryStopId: string | null;
  travellerIds: string[];
};

export type GroundTransportMode = 'car-hire' | 'train' | 'bus' | 'transfer' | 'ferry' | 'taxi' | 'rideshare' | 'other';

export type GroundTransport = {
  id: string;
  mode: GroundTransportMode;
  provider: string;
  reference: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  cost: number;
  currency: string;
  status: 'planned' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  travellerIds: string[];
};

export type SavedPlace = {
  id: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  category: string;
  notes: string;
  link: string;
};

export type DailyRouteStop = {
  id: string;
  placeId: string | null;
  label: string;
  order: number;
  travelMinutesFromPrevious: number;
  distanceKmFromPrevious: number;
  notes: string;
};

export type DailyRoute = {
  id: string;
  date: string;
  title: string;
  stops: DailyRouteStop[];
  notes: string;
};

export type ChecklistCategory =
  | 'visa'
  | 'passport'
  | 'insurance'
  | 'vaccinations'
  | 'currency'
  | 'sim'
  | 'accommodation'
  | 'transport'
  | 'custom';

export type ChecklistItem = {
  id: string;
  title: string;
  category: ChecklistCategory;
  deadline: string;
  ownerName: string;
  completed: boolean;
  notes: string;
};

export type ChecklistTemplate = {
  id: string;
  name: string;
  items: Array<{ title: string; category: ChecklistCategory }>;
};

export type EmergencyContact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  notes: string;
};

export type EmbassyRecord = {
  id: string;
  country: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

export type InsuranceContact = {
  id: string;
  provider: string;
  policyNumber: string;
  phone: string;
  email: string;
  notes: string;
};

export type MedicalInfo = {
  bloodType: string;
  allergies: string;
  medications: string;
  conditions: string;
  notes: string;
};

export type EmergencyWorkflow = {
  id: string;
  kind: 'lost-passport' | 'lost-luggage' | 'other';
  title: string;
  steps: string;
  status: 'open' | 'in-progress' | 'resolved';
  notes: string;
  updatedAt: string;
};

export type EmergencyCentre = {
  contacts: EmergencyContact[];
  embassies: EmbassyRecord[];
  insurance: InsuranceContact[];
  medical: MedicalInfo;
  workflows: EmergencyWorkflow[];
  notes: string;
};

export type JournalEntry = {
  id: string;
  date: string;
  title: string;
  notes: string;
  highlights: string;
  rating: number;
  locationName: string;
  latitude: string;
  longitude: string;
  photoAttachmentName: string;
  photoMimeType: string;
  favourite: boolean;
};

export type TravelOpsCollections = {
  destinations: DestinationProfile[];
  flights: FlightSegment[];
  stays: AccommodationStay[];
  groundTransport: GroundTransport[];
  savedPlaces: SavedPlace[];
  dailyRoutes: DailyRoute[];
  checklistItems: ChecklistItem[];
  emergency: EmergencyCentre;
  journalEntries: JournalEntry[];
};

export const FLIGHT_CHECK_IN_STATUSES: FlightCheckInStatus[] = [
  'not-open',
  'open',
  'checked-in',
  'boarding',
  'completed',
  'cancelled',
];
export const STAY_TYPES: StayType[] = ['hotel', 'apartment', 'hostel', 'resort', 'other'];
export const PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'deposit', 'paid', 'refunded'];
export const GROUND_TRANSPORT_MODES: GroundTransportMode[] = [
  'car-hire',
  'train',
  'bus',
  'transfer',
  'ferry',
  'taxi',
  'rideshare',
  'other',
];
export const CHECKLIST_CATEGORIES: ChecklistCategory[] = [
  'visa',
  'passport',
  'insurance',
  'vaccinations',
  'currency',
  'sim',
  'accommodation',
  'transport',
  'custom',
];

export const DEFAULT_CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
  {
    id: 'pre-departure',
    name: 'Pre-departure essentials',
    items: [
      { title: 'Confirm passport validity (6+ months)', category: 'passport' },
      { title: 'Check visa / ETA requirements', category: 'visa' },
      { title: 'Buy travel insurance', category: 'insurance' },
      { title: 'Review vaccination advice', category: 'vaccinations' },
      { title: 'Arrange local currency / cards', category: 'currency' },
      { title: 'Set up SIM / eSIM', category: 'sim' },
      { title: 'Confirm accommodation', category: 'accommodation' },
      { title: 'Confirm outbound transport', category: 'transport' },
    ],
  },
];

export const createEmptyEmergencyCentre = (): EmergencyCentre => ({
  contacts: [],
  embassies: [],
  insurance: [],
  medical: { bloodType: '', allergies: '', medications: '', conditions: '', notes: '' },
  workflows: [],
  notes: '',
});

export const createEmptyTravelOps = (): TravelOpsCollections => ({
  destinations: [],
  flights: [],
  stays: [],
  groundTransport: [],
  savedPlaces: [],
  dailyRoutes: [],
  checklistItems: [],
  emergency: createEmptyEmergencyCentre(),
  journalEntries: [],
});

export const sanitizeDestination = (value: Partial<DestinationProfile> | undefined): DestinationProfile => ({
  id: asString(value?.id) || crypto.randomUUID(),
  name: asString(value?.name).trim() || 'Destination',
  country: asString(value?.country).trim(),
  city: asString(value?.city).trim(),
  region: asString(value?.region).trim(),
  language: asString(value?.language).trim(),
  currency: asString(value?.currency, 'USD').toUpperCase() || 'USD',
  timezone: asString(value?.timezone, 'UTC') || 'UTC',
  entryRequirements: asString(value?.entryRequirements),
  safetyNotes: asString(value?.safetyNotes),
  emergencyInfo: asString(value?.emergencyInfo),
  customsNotes: asString(value?.customsNotes),
  practicalNotes: asString(value?.practicalNotes),
  savedOffline: asBoolean(value?.savedOffline, true),
});

export const sanitizeFlight = (value: Partial<FlightSegment> | undefined): FlightSegment => ({
  id: asString(value?.id) || crypto.randomUUID(),
  airline: asString(value?.airline).trim(),
  flightNumber: asString(value?.flightNumber).trim(),
  bookingReference: asString(value?.bookingReference).trim(),
  departureAirport: asString(value?.departureAirport).trim().toUpperCase(),
  arrivalAirport: asString(value?.arrivalAirport).trim().toUpperCase(),
  departureTerminal: asString(value?.departureTerminal),
  arrivalTerminal: asString(value?.arrivalTerminal),
  departureGate: asString(value?.departureGate),
  arrivalGate: asString(value?.arrivalGate),
  departureDate: isIsoDate(asString(value?.departureDate)) ? asString(value?.departureDate) : '',
  departureTime: isTime(asString(value?.departureTime)) ? asString(value?.departureTime) : '',
  arrivalDate: isIsoDate(asString(value?.arrivalDate)) ? asString(value?.arrivalDate) : '',
  arrivalTime: isTime(asString(value?.arrivalTime)) ? asString(value?.arrivalTime) : '',
  layoverMinutes: Math.max(0, Math.floor(asNumber(value?.layoverMinutes, 0))),
  cabin: asString(value?.cabin),
  seat: asString(value?.seat),
  baggageAllowance: asString(value?.baggageAllowance),
  checkInStatus: FLIGHT_CHECK_IN_STATUSES.includes(value?.checkInStatus as FlightCheckInStatus)
    ? (value?.checkInStatus as FlightCheckInStatus)
    : 'not-open',
  statusNotes: asString(value?.statusNotes),
  travellerIds: Array.isArray(value?.travellerIds) ? value!.travellerIds.filter((id): id is string => typeof id === 'string') : [],
  cost: Math.max(0, asNumber(value?.cost, 0)),
  currency: asString(value?.currency, 'USD').toUpperCase() || 'USD',
  notes: asString(value?.notes),
});

export const sanitizeStay = (value: Partial<AccommodationStay> | undefined): AccommodationStay => ({
  id: asString(value?.id) || crypto.randomUUID(),
  type: STAY_TYPES.includes(value?.type as StayType) ? (value?.type as StayType) : 'hotel',
  name: asString(value?.name).trim() || 'Stay',
  address: asString(value?.address),
  contactPhone: asString(value?.contactPhone),
  contactEmail: asString(value?.contactEmail),
  checkInDate: isIsoDate(asString(value?.checkInDate)) ? asString(value?.checkInDate) : '',
  checkInTime: isTime(asString(value?.checkInTime)) ? asString(value?.checkInTime) : '',
  checkOutDate: isIsoDate(asString(value?.checkOutDate)) ? asString(value?.checkOutDate) : '',
  checkOutTime: isTime(asString(value?.checkOutTime)) ? asString(value?.checkOutTime) : '',
  roomInfo: asString(value?.roomInfo),
  confirmationNumber: asString(value?.confirmationNumber),
  cost: Math.max(0, asNumber(value?.cost, 0)),
  currency: asString(value?.currency, 'USD').toUpperCase() || 'USD',
  paymentStatus: PAYMENT_STATUSES.includes(value?.paymentStatus as PaymentStatus)
    ? (value?.paymentStatus as PaymentStatus)
    : 'unpaid',
  amenities: asString(value?.amenities),
  notes: asString(value?.notes),
  itineraryStopId: typeof value?.itineraryStopId === 'string' ? value.itineraryStopId : null,
  travellerIds: Array.isArray(value?.travellerIds) ? value!.travellerIds.filter((id): id is string => typeof id === 'string') : [],
});

export const sanitizeGroundTransport = (value: Partial<GroundTransport> | undefined): GroundTransport => ({
  id: asString(value?.id) || crypto.randomUUID(),
  mode: GROUND_TRANSPORT_MODES.includes(value?.mode as GroundTransportMode)
    ? (value?.mode as GroundTransportMode)
    : 'transfer',
  provider: asString(value?.provider),
  reference: asString(value?.reference),
  pickupLocation: asString(value?.pickupLocation),
  dropoffLocation: asString(value?.dropoffLocation),
  pickupDate: isIsoDate(asString(value?.pickupDate)) ? asString(value?.pickupDate) : '',
  pickupTime: isTime(asString(value?.pickupTime)) ? asString(value?.pickupTime) : '',
  dropoffDate: isIsoDate(asString(value?.dropoffDate)) ? asString(value?.dropoffDate) : '',
  dropoffTime: isTime(asString(value?.dropoffTime)) ? asString(value?.dropoffTime) : '',
  cost: Math.max(0, asNumber(value?.cost, 0)),
  currency: asString(value?.currency, 'USD').toUpperCase() || 'USD',
  status:
    value?.status === 'confirmed' || value?.status === 'completed' || value?.status === 'cancelled'
      ? value.status
      : 'planned',
  notes: asString(value?.notes),
  travellerIds: Array.isArray(value?.travellerIds) ? value!.travellerIds.filter((id): id is string => typeof id === 'string') : [],
});

export const sanitizeSavedPlace = (value: Partial<SavedPlace> | undefined): SavedPlace => ({
  id: asString(value?.id) || crypto.randomUUID(),
  name: asString(value?.name).trim() || 'Place',
  address: asString(value?.address),
  latitude: asString(value?.latitude),
  longitude: asString(value?.longitude),
  category: asString(value?.category),
  notes: asString(value?.notes),
  link: asString(value?.link),
});

export const sanitizeDailyRoute = (value: Partial<DailyRoute> | undefined): DailyRoute => {
  const stops = Array.isArray(value?.stops)
    ? value!.stops
        .map((stop, index) => ({
          id: asString(stop?.id) || crypto.randomUUID(),
          placeId: typeof stop?.placeId === 'string' ? stop.placeId : null,
          label: asString(stop?.label).trim() || `Stop ${index + 1}`,
          order: Math.max(0, Math.floor(asNumber(stop?.order, index))),
          travelMinutesFromPrevious: Math.max(0, Math.floor(asNumber(stop?.travelMinutesFromPrevious, 0))),
          distanceKmFromPrevious: Math.max(0, asNumber(stop?.distanceKmFromPrevious, 0)),
          notes: asString(stop?.notes),
        }))
        .sort((a, b) => a.order - b.order)
        .map((stop, index) => ({ ...stop, order: index }))
    : [];
  return {
    id: asString(value?.id) || crypto.randomUUID(),
    date: isIsoDate(asString(value?.date)) ? asString(value?.date) : '',
    title: asString(value?.title).trim() || 'Daily route',
    stops,
    notes: asString(value?.notes),
  };
};

export const sanitizeChecklistItem = (value: Partial<ChecklistItem> | undefined): ChecklistItem => ({
  id: asString(value?.id) || crypto.randomUUID(),
  title: asString(value?.title).trim() || 'Checklist item',
  category: CHECKLIST_CATEGORIES.includes(value?.category as ChecklistCategory)
    ? (value?.category as ChecklistCategory)
    : 'custom',
  deadline: isIsoDate(asString(value?.deadline)) ? asString(value?.deadline) : '',
  ownerName: asString(value?.ownerName),
  completed: asBoolean(value?.completed, false),
  notes: asString(value?.notes),
});

export const sanitizeEmergencyCentre = (value: Partial<EmergencyCentre> | undefined): EmergencyCentre => ({
  contacts: Array.isArray(value?.contacts)
    ? value!.contacts.map((contact) => ({
        id: asString(contact?.id) || crypto.randomUUID(),
        name: asString(contact?.name).trim() || 'Contact',
        relationship: asString(contact?.relationship),
        phone: asString(contact?.phone),
        email: asString(contact?.email),
        notes: asString(contact?.notes),
      }))
    : [],
  embassies: Array.isArray(value?.embassies)
    ? value!.embassies.map((embassy) => ({
        id: asString(embassy?.id) || crypto.randomUUID(),
        country: asString(embassy?.country),
        name: asString(embassy?.name).trim() || 'Embassy',
        phone: asString(embassy?.phone),
        email: asString(embassy?.email),
        address: asString(embassy?.address),
        notes: asString(embassy?.notes),
      }))
    : [],
  insurance: Array.isArray(value?.insurance)
    ? value!.insurance.map((item) => ({
        id: asString(item?.id) || crypto.randomUUID(),
        provider: asString(item?.provider).trim() || 'Insurer',
        policyNumber: asString(item?.policyNumber),
        phone: asString(item?.phone),
        email: asString(item?.email),
        notes: asString(item?.notes),
      }))
    : [],
  medical: {
    bloodType: asString(value?.medical?.bloodType),
    allergies: asString(value?.medical?.allergies),
    medications: asString(value?.medical?.medications),
    conditions: asString(value?.medical?.conditions),
    notes: asString(value?.medical?.notes),
  },
  workflows: Array.isArray(value?.workflows)
    ? value!.workflows.map((workflow) => ({
        id: asString(workflow?.id) || crypto.randomUUID(),
        kind:
          workflow?.kind === 'lost-passport' || workflow?.kind === 'lost-luggage' || workflow?.kind === 'other'
            ? workflow.kind
            : 'other',
        title: asString(workflow?.title).trim() || 'Workflow',
        steps: asString(workflow?.steps),
        status:
          workflow?.status === 'in-progress' || workflow?.status === 'resolved' ? workflow.status : 'open',
        notes: asString(workflow?.notes),
        updatedAt: asString(workflow?.updatedAt) || new Date().toISOString(),
      }))
    : [],
  notes: asString(value?.notes),
});

export const sanitizeJournalEntry = (value: Partial<JournalEntry> | undefined): JournalEntry => ({
  id: asString(value?.id) || crypto.randomUUID(),
  date: isIsoDate(asString(value?.date)) ? asString(value?.date) : '',
  title: asString(value?.title).trim() || 'Journal entry',
  notes: asString(value?.notes),
  highlights: asString(value?.highlights),
  rating: Math.min(5, Math.max(0, Math.round(asNumber(value?.rating, 0)))),
  locationName: asString(value?.locationName),
  latitude: asString(value?.latitude),
  longitude: asString(value?.longitude),
  photoAttachmentName: asString(value?.photoAttachmentName),
  photoMimeType: asString(value?.photoMimeType),
  favourite: asBoolean(value?.favourite, false),
});

export const migrateTravelOps = (raw: Partial<TravelOpsCollections> | undefined): TravelOpsCollections => ({
  destinations: Array.isArray(raw?.destinations) ? raw!.destinations.map((item) => sanitizeDestination(item)) : [],
  flights: Array.isArray(raw?.flights) ? raw!.flights.map((item) => sanitizeFlight(item)) : [],
  stays: Array.isArray(raw?.stays) ? raw!.stays.map((item) => sanitizeStay(item)) : [],
  groundTransport: Array.isArray(raw?.groundTransport)
    ? raw!.groundTransport.map((item) => sanitizeGroundTransport(item))
    : [],
  savedPlaces: Array.isArray(raw?.savedPlaces) ? raw!.savedPlaces.map((item) => sanitizeSavedPlace(item)) : [],
  dailyRoutes: Array.isArray(raw?.dailyRoutes) ? raw!.dailyRoutes.map((item) => sanitizeDailyRoute(item)) : [],
  checklistItems: Array.isArray(raw?.checklistItems)
    ? raw!.checklistItems.map((item) => sanitizeChecklistItem(item))
    : [],
  emergency: sanitizeEmergencyCentre(raw?.emergency),
  journalEntries: Array.isArray(raw?.journalEntries)
    ? raw!.journalEntries.map((item) => sanitizeJournalEntry(item))
    : [],
});

export const checklistProgress = (items: ChecklistItem[]) => {
  const total = items.length;
  const completed = items.filter((item) => item.completed).length;
  return {
    total,
    completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
};

export const applyChecklistTemplate = (
  existing: ChecklistItem[],
  template: ChecklistTemplate,
  departureDate = '',
): ChecklistItem[] => {
  const seeded = template.items.map((item, index) =>
    sanitizeChecklistItem({
      id: crypto.randomUUID(),
      title: item.title,
      category: item.category,
      deadline: departureDate,
      ownerName: '',
      completed: false,
      notes: `From template: ${template.name}`,
    }),
  );
  // Keep order: template items first for new adds when empty, else append
  return existing.length === 0 ? seeded : [...existing, ...seeded.map((item, index) => ({ ...item, title: `${item.title}` }))];
};

export const exportJournalSummary = (
  tripName: string,
  destination: string,
  entries: JournalEntry[],
): string => {
  const favourites = entries.filter((entry) => entry.favourite);
  const lines = [
    `# ${tripName} — Travel journal`,
    `Destination: ${destination || 'n/a'}`,
    `Entries: ${entries.length} · Favourites: ${favourites.length}`,
    '',
    ...entries
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(
        (entry) =>
          `## ${entry.date || 'undated'} — ${entry.title}${entry.favourite ? ' ★' : ''}\nRating: ${entry.rating}/5\nLocation: ${entry.locationName || 'n/a'}\nHighlights: ${entry.highlights || '—'}\n${entry.notes || ''}`,
      ),
  ];
  return lines.join('\n\n');
};

export const createLostPassportWorkflow = (): EmergencyWorkflow => ({
  id: crypto.randomUUID(),
  kind: 'lost-passport',
  title: 'Lost passport',
  steps:
    '1. Report to local police and keep the report.\n2. Contact your embassy/consulate.\n3. Gather ID copies and photos.\n4. Apply for emergency travel document.\n5. Notify airline and insurer.',
  status: 'open',
  notes: '',
  updatedAt: new Date().toISOString(),
});

export const createLostLuggageWorkflow = (): EmergencyWorkflow => ({
  id: crypto.randomUUID(),
  kind: 'lost-luggage',
  title: 'Lost luggage',
  steps:
    '1. File a Property Irregularity Report (PIR) at the airport desk.\n2. Keep boarding pass and baggage tags.\n3. List essential items for interim reimbursement.\n4. Contact airline tracking and insurer.\n5. Update delivery address for recovered bags.',
  status: 'open',
  notes: '',
  updatedAt: new Date().toISOString(),
});
