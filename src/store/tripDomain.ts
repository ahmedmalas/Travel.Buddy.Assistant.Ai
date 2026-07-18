export type TripPurpose = 'leisure' | 'business' | 'family' | 'adventure' | 'other';
export type TripStatus = 'draft' | 'active' | 'archived';

export type ItineraryCategory =
  | 'travel'
  | 'lodging'
  | 'food'
  | 'activity'
  | 'sightseeing'
  | 'transport'
  | 'other';

export type BookingType = 'flight' | 'hotel' | 'transport' | 'activity' | 'restaurant' | 'other';
export type BookingStatus = 'planned' | 'confirmed' | 'cancelled' | 'completed';

export type ExpenseCategory =
  | 'flights'
  | 'lodging'
  | 'food'
  | 'activities'
  | 'transport'
  | 'shopping'
  | 'other';

export type PackingCategory =
  | 'clothing'
  | 'toiletries'
  | 'documents'
  | 'electronics'
  | 'health'
  | 'misc'
  | 'custom';

export type TripStop = {
  id: string;
  title: string;
  day: number;
  order: number;
  notes: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  category: ItineraryCategory;
  cost: number;
  currency: string;
  bookingReference: string;
};

export type Booking = {
  id: string;
  type: BookingType;
  title: string;
  provider: string;
  confirmationNumber: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  cost: number;
  currency: string;
  status: BookingStatus;
  notes: string;
  link: string;
  attachmentName: string;
  attachmentMimeType: string;
};

export type Expense = {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: string;
  paid: boolean;
  notes: string;
};

export type PackingItem = {
  id: string;
  name: string;
  category: PackingCategory;
  customCategory: string;
  quantity: number;
  packed: boolean;
  assignedTravellerId: string | null;
};

export type PackingList = {
  id: string;
  name: string;
  templateKey: string | null;
  items: PackingItem[];
};

export type Traveller = {
  id: string;
  name: string;
  dateOfBirth: string;
  nationality: string;
  dietaryRequirements: string;
  accessibilityNeeds: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  loyaltyPrograms: string;
  passportNumberLast4: string;
  passportExpiry: string;
  passportCountry: string;
};

export type ActivityLogEntry = {
  id: string;
  at: string;
  message: string;
};

export type TripDocumentType = 'passport' | 'visa' | 'insurance' | 'ticket' | 'reservation' | 'other';

export type TripDocument = {
  id: string;
  type: TripDocumentType;
  title: string;
  holderName: string;
  documentNumberLast4: string;
  issuingCountry: string;
  issueDate: string;
  expiryDate: string;
  notes: string;
  attachmentName: string;
  attachmentMimeType: string;
};

export type CollaborationRole = 'owner' | 'editor' | 'viewer';
export type CollaborationMemberStatus = 'active' | 'invited' | 'revoked';

export type CollaborationMember = {
  id: string;
  name: string;
  email: string;
  role: CollaborationRole;
  invitedAt: string;
  status: CollaborationMemberStatus;
};

export type CollaborationAuditEntry = {
  id: string;
  at: string;
  actorName: string;
  action: string;
  details: string;
};

export type CollaborationState = {
  ownerName: string;
  ownerEmail: string;
  members: CollaborationMember[];
  auditHistory: CollaborationAuditEntry[];
};

export type TripData = {
  id?: string;
  favourite?: boolean;
  lastOpenedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  tripName: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  travellerCount: number;
  purpose: TripPurpose;
  budget: number;
  currency: string;
  notes: string;
  status: TripStatus;
  stops: TripStop[];
  bookings: Booking[];
  expenses: Expense[];
  packingLists: PackingList[];
  travellers: Traveller[];
  activityLog: ActivityLogEntry[];
  documents?: TripDocument[];
  collaboration?: CollaborationState;
};

export type TripSetupInput = {
  tripName: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  travellerCount: number;
  purpose: TripPurpose;
  budget: number;
  currency: string;
  notes: string;
  status?: TripStatus;
};

export type TripSetupErrors = Partial<Record<keyof TripSetupInput, string>>;

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'SGD'] as const;
export const TRIP_PURPOSES: TripPurpose[] = ['leisure', 'business', 'family', 'adventure', 'other'];
export const ITINERARY_CATEGORIES: ItineraryCategory[] = [
  'travel',
  'lodging',
  'food',
  'activity',
  'sightseeing',
  'transport',
  'other',
];
export const BOOKING_TYPES: BookingType[] = ['flight', 'hotel', 'transport', 'activity', 'restaurant', 'other'];
export const BOOKING_STATUSES: BookingStatus[] = ['planned', 'confirmed', 'cancelled', 'completed'];
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'flights',
  'lodging',
  'food',
  'activities',
  'transport',
  'shopping',
  'other',
];
export const PACKING_CATEGORIES: PackingCategory[] = [
  'clothing',
  'toiletries',
  'documents',
  'electronics',
  'health',
  'misc',
  'custom',
];

export const DEFAULT_PACKING_TEMPLATES: Array<{ key: string; name: string; items: Array<{ name: string; category: PackingCategory; quantity: number }> }> =
  [
    {
      key: 'weekend-getaway',
      name: 'Weekend getaway',
      items: [
        { name: 'T-shirts', category: 'clothing', quantity: 2 },
        { name: 'Toothbrush', category: 'toiletries', quantity: 1 },
        { name: 'Phone charger', category: 'electronics', quantity: 1 },
        { name: 'Passport / ID', category: 'documents', quantity: 1 },
      ],
    },
    {
      key: 'business-trip',
      name: 'Business trip',
      items: [
        { name: 'Dress shirt', category: 'clothing', quantity: 2 },
        { name: 'Laptop', category: 'electronics', quantity: 1 },
        { name: 'Business cards', category: 'documents', quantity: 1 },
        { name: 'Adapters', category: 'electronics', quantity: 1 },
      ],
    },
  ];

const isIsoDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
const isTime = (value: string): boolean => value === '' || /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

export const createActivityLogEntry = (message: string): ActivityLogEntry => ({
  id: crypto.randomUUID(),
  at: new Date().toISOString(),
  message,
});

export const createDefaultPackingList = (
  name = 'Main packing list',
  templateKey: string | null = null,
  stableId = 'packing-default',
): PackingList => ({
  id: stableId,
  name,
  templateKey,
  items: [],
});

export const createEmptyTrip = (overrides: Partial<TripData> = {}): TripData => ({
  tripName: 'Untitled Trip',
  destination: '',
  departureDate: '',
  returnDate: '',
  travellerCount: 1,
  purpose: 'leisure',
  budget: 0,
  currency: 'USD',
  notes: '',
  status: 'draft',
  stops: [],
  bookings: [],
  expenses: [],
  packingLists: [createDefaultPackingList()],
  travellers: [],
  activityLog: [],
  ...overrides,
});

export const createSeededTrip = (): TripData =>
  createEmptyTrip({
    tripName: 'Japan Discovery',
    destination: 'Tokyo, Japan',
    departureDate: '2026-09-01',
    returnDate: '2026-09-10',
    travellerCount: 2,
    purpose: 'leisure',
    budget: 4500,
    currency: 'USD',
    notes: 'Food, culture, shopping, and value.',
    status: 'active',
    stops: [
      {
        id: 's1',
        title: 'Arrive in Tokyo',
        day: 1,
        order: 1,
        notes: 'Narita transfer and hotel check-in',
        date: '2026-09-01',
        startTime: '14:00',
        endTime: '16:00',
        location: 'Narita Airport',
        category: 'travel',
        cost: 40,
        currency: 'USD',
        bookingReference: '',
      },
      {
        id: 's2',
        title: 'Asakusa and Senso-ji',
        day: 1,
        order: 2,
        notes: 'Evening street food walk',
        date: '2026-09-01',
        startTime: '17:30',
        endTime: '20:00',
        location: 'Asakusa',
        category: 'sightseeing',
        cost: 25,
        currency: 'USD',
        bookingReference: '',
      },
      {
        id: 's3',
        title: 'Kyoto day trip',
        day: 2,
        order: 1,
        notes: 'Shinkansen + temple route',
        date: '2026-09-02',
        startTime: '08:00',
        endTime: '21:00',
        location: 'Kyoto',
        category: 'activity',
        cost: 180,
        currency: 'USD',
        bookingReference: '',
      },
    ],
    bookings: [
      {
        id: 'b1',
        type: 'flight',
        title: 'Outbound flight',
        provider: 'Example Air',
        confirmationNumber: 'EX123',
        startDate: '2026-09-01',
        endDate: '2026-09-01',
        startTime: '08:00',
        endTime: '13:30',
        location: 'HND',
        cost: 900,
        currency: 'USD',
        status: 'confirmed',
        notes: '',
        link: '',
        attachmentName: '',
        attachmentMimeType: '',
      },
    ],
    travellers: [
      {
        id: 't1',
        name: 'Alex Traveller',
        dateOfBirth: '1990-01-15',
        nationality: 'US',
        dietaryRequirements: '',
        accessibilityNeeds: '',
        emergencyContactName: 'Sam Traveller',
        emergencyContactPhone: '+1-555-0100',
        loyaltyPrograms: '',
        passportNumberLast4: '',
        passportExpiry: '',
        passportCountry: '',
      },
    ],
    activityLog: [createActivityLogEntry('Seeded Japan Discovery trip loaded.')],
  });

const asString = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);
const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const asBoolean = (value: unknown, fallback = false): boolean => (typeof value === 'boolean' ? value : fallback);

const sanitizeStop = (stop: Partial<TripStop>, index: number): TripStop => ({
  id: asString(stop.id, crypto.randomUUID()),
  title: asString(stop.title).trim() || `Stop ${index + 1}`,
  day: Math.max(1, Math.floor(asNumber(stop.day, 1))),
  order: Math.max(1, Math.floor(asNumber(stop.order, index + 1))),
  notes: asString(stop.notes).trim(),
  date: isIsoDate(asString(stop.date)) ? asString(stop.date) : '',
  startTime: isTime(asString(stop.startTime)) ? asString(stop.startTime) : '',
  endTime: isTime(asString(stop.endTime)) ? asString(stop.endTime) : '',
  location: asString(stop.location).trim(),
  category: ITINERARY_CATEGORIES.includes(stop.category as ItineraryCategory)
    ? (stop.category as ItineraryCategory)
    : 'other',
  cost: Math.max(0, asNumber(stop.cost, 0)),
  currency: asString(stop.currency, 'USD').toUpperCase() || 'USD',
  bookingReference: asString(stop.bookingReference).trim(),
});

const sanitizeBooking = (booking: Partial<Booking>): Booking => ({
  id: asString(booking.id, crypto.randomUUID()),
  type: BOOKING_TYPES.includes(booking.type as BookingType) ? (booking.type as BookingType) : 'other',
  title: asString(booking.title).trim() || 'Untitled booking',
  provider: asString(booking.provider).trim(),
  confirmationNumber: asString(booking.confirmationNumber).trim(),
  startDate: isIsoDate(asString(booking.startDate)) ? asString(booking.startDate) : '',
  endDate: isIsoDate(asString(booking.endDate)) ? asString(booking.endDate) : '',
  startTime: isTime(asString(booking.startTime)) ? asString(booking.startTime) : '',
  endTime: isTime(asString(booking.endTime)) ? asString(booking.endTime) : '',
  location: asString(booking.location).trim(),
  cost: Math.max(0, asNumber(booking.cost, 0)),
  currency: asString(booking.currency, 'USD').toUpperCase() || 'USD',
  status: BOOKING_STATUSES.includes(booking.status as BookingStatus)
    ? (booking.status as BookingStatus)
    : 'planned',
  notes: asString(booking.notes).trim(),
  link: asString(booking.link).trim(),
  attachmentName: asString(booking.attachmentName).trim(),
  attachmentMimeType: asString(booking.attachmentMimeType).trim(),
});

const sanitizeExpense = (expense: Partial<Expense>): Expense => ({
  id: asString(expense.id, crypto.randomUUID()),
  title: asString(expense.title).trim() || 'Untitled expense',
  category: EXPENSE_CATEGORIES.includes(expense.category as ExpenseCategory)
    ? (expense.category as ExpenseCategory)
    : 'other',
  amount: Math.max(0, asNumber(expense.amount, 0)),
  currency: asString(expense.currency, 'USD').toUpperCase() || 'USD',
  date: isIsoDate(asString(expense.date)) ? asString(expense.date) : '',
  paid: asBoolean(expense.paid, false),
  notes: asString(expense.notes).trim(),
});

const sanitizePackingItem = (item: Partial<PackingItem>): PackingItem => ({
  id: asString(item.id, crypto.randomUUID()),
  name: asString(item.name).trim() || 'Item',
  category: PACKING_CATEGORIES.includes(item.category as PackingCategory)
    ? (item.category as PackingCategory)
    : 'misc',
  customCategory: asString(item.customCategory).trim(),
  quantity: Math.max(1, Math.floor(asNumber(item.quantity, 1))),
  packed: asBoolean(item.packed, false),
  assignedTravellerId: typeof item.assignedTravellerId === 'string' ? item.assignedTravellerId : null,
});

const sanitizePackingList = (list: Partial<PackingList>): PackingList => ({
  id: asString(list.id, crypto.randomUUID()),
  name: asString(list.name).trim() || 'Packing list',
  templateKey: typeof list.templateKey === 'string' ? list.templateKey : null,
  items: Array.isArray(list.items) ? list.items.map((item) => sanitizePackingItem(item as Partial<PackingItem>)) : [],
});

const sanitizeTraveller = (traveller: Partial<Traveller>): Traveller => ({
  id: asString(traveller.id, crypto.randomUUID()),
  name: asString(traveller.name).trim() || 'Traveller',
  dateOfBirth: isIsoDate(asString(traveller.dateOfBirth)) ? asString(traveller.dateOfBirth) : '',
  nationality: asString(traveller.nationality).trim(),
  dietaryRequirements: asString(traveller.dietaryRequirements).trim(),
  accessibilityNeeds: asString(traveller.accessibilityNeeds).trim(),
  emergencyContactName: asString(traveller.emergencyContactName).trim(),
  emergencyContactPhone: asString(traveller.emergencyContactPhone).trim(),
  loyaltyPrograms: asString(traveller.loyaltyPrograms).trim(),
  passportNumberLast4: asString(traveller.passportNumberLast4).replace(/\D/g, '').slice(-4),
  passportExpiry: isIsoDate(asString(traveller.passportExpiry)) ? asString(traveller.passportExpiry) : '',
  passportCountry: asString(traveller.passportCountry).trim(),
});

const sanitizeActivity = (entry: Partial<ActivityLogEntry>): ActivityLogEntry => ({
  id: asString(entry.id, crypto.randomUUID()),
  at: asString(entry.at, new Date().toISOString()),
  message: asString(entry.message).trim() || 'Activity',
});

export const isLegacyTripShape = (value: unknown): boolean => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const trip = value as Partial<TripData>;
  if (typeof trip.tripName !== 'string' || !Array.isArray(trip.stops)) {
    return false;
  }
  return trip.stops.every((stop) => {
    if (!stop || typeof stop !== 'object') {
      return false;
    }
    const item = stop as Partial<TripStop>;
    return (
      typeof item.id === 'string' &&
      typeof item.title === 'string' &&
      typeof item.notes === 'string' &&
      typeof item.day === 'number' &&
      typeof item.order === 'number'
    );
  });
};

const DOCUMENT_TYPES: TripDocumentType[] = ['passport', 'visa', 'insurance', 'ticket', 'reservation', 'other'];
const COLLABORATION_ROLES: CollaborationRole[] = ['owner', 'editor', 'viewer'];

const sanitizeDocument = (doc: Partial<TripDocument>): TripDocument => ({
  id: asString(doc.id, crypto.randomUUID()),
  type: DOCUMENT_TYPES.includes(doc.type as TripDocumentType) ? (doc.type as TripDocumentType) : 'other',
  title: asString(doc.title).trim() || 'Untitled document',
  holderName: asString(doc.holderName).trim(),
  documentNumberLast4: asString(doc.documentNumberLast4).replace(/\D/g, '').slice(-4),
  issuingCountry: asString(doc.issuingCountry).trim(),
  issueDate: isIsoDate(asString(doc.issueDate)) ? asString(doc.issueDate) : '',
  expiryDate: isIsoDate(asString(doc.expiryDate)) ? asString(doc.expiryDate) : '',
  notes: asString(doc.notes).trim(),
  attachmentName: asString(doc.attachmentName).trim(),
  attachmentMimeType: asString(doc.attachmentMimeType).trim(),
});

const sanitizeCollaborationState = (value: unknown): CollaborationState => {
  const fallback: CollaborationState = {
    ownerName: 'Local Owner',
    ownerEmail: 'owner@local',
    members: [
      {
        id: 'member-owner',
        name: 'Local Owner',
        email: 'owner@local',
        role: 'owner',
        invitedAt: new Date().toISOString(),
        status: 'active',
      },
    ],
    auditHistory: [],
  };
  if (!value || typeof value !== 'object') {
    return fallback;
  }
  const raw = value as Partial<CollaborationState>;
  const ownerName = asString(raw.ownerName, fallback.ownerName) || fallback.ownerName;
  const ownerEmail = asString(raw.ownerEmail, fallback.ownerEmail) || fallback.ownerEmail;
  return {
    ownerName,
    ownerEmail,
    members: Array.isArray(raw.members)
      ? raw.members.map((member) => {
          const item = member as Partial<CollaborationMember>;
          return {
            id: asString(item.id, crypto.randomUUID()),
            name: asString(item.name).trim() || 'Member',
            email: asString(item.email).trim(),
            role: COLLABORATION_ROLES.includes(item.role as CollaborationRole)
              ? (item.role as CollaborationRole)
              : 'viewer',
            invitedAt: asString(item.invitedAt, new Date().toISOString()),
            status:
              item.status === 'active' || item.status === 'invited' || item.status === 'revoked'
                ? item.status
                : 'invited',
          };
        })
      : fallback.members,
    auditHistory: Array.isArray(raw.auditHistory)
      ? raw.auditHistory
          .map((entry) => {
            const item = entry as Partial<CollaborationAuditEntry>;
            return {
              id: asString(item.id, crypto.randomUUID()),
              at: asString(item.at, new Date().toISOString()),
              actorName: asString(item.actorName, ownerName),
              action: asString(item.action, 'event'),
              details: asString(item.details),
            };
          })
          .slice(0, 100)
      : [],
  };
};

export const migrateTrip = (value: unknown): TripData => {
  if (!isLegacyTripShape(value)) {
    return createEmptyTrip();
  }
  const raw = value as Partial<TripData> & { stops: Partial<TripStop>[] };
  const base = createEmptyTrip();
  return {
    ...base,
    id: typeof raw.id === 'string' && raw.id ? raw.id : undefined,
    favourite: typeof raw.favourite === 'boolean' ? raw.favourite : undefined,
    lastOpenedAt: typeof raw.lastOpenedAt === 'string' ? raw.lastOpenedAt : undefined,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
    tripName: asString(raw.tripName, base.tripName),
    destination: asString(raw.destination, base.destination),
    departureDate: isIsoDate(asString(raw.departureDate)) ? asString(raw.departureDate) : base.departureDate,
    returnDate: isIsoDate(asString(raw.returnDate)) ? asString(raw.returnDate) : base.returnDate,
    travellerCount: Math.max(1, Math.floor(asNumber(raw.travellerCount, 1))),
    purpose: TRIP_PURPOSES.includes(raw.purpose as TripPurpose) ? (raw.purpose as TripPurpose) : 'leisure',
    budget: Math.max(0, asNumber(raw.budget, 0)),
    currency: asString(raw.currency, 'USD').toUpperCase() || 'USD',
    notes: asString(raw.notes),
    status: raw.status === 'active' || raw.status === 'archived' || raw.status === 'draft' ? raw.status : 'draft',
    stops: raw.stops.map((stop, index) => sanitizeStop(stop, index)),
    bookings: Array.isArray(raw.bookings) ? raw.bookings.map((booking) => sanitizeBooking(booking as Partial<Booking>)) : [],
    expenses: Array.isArray(raw.expenses) ? raw.expenses.map((expense) => sanitizeExpense(expense as Partial<Expense>)) : [],
    packingLists:
      Array.isArray(raw.packingLists) && raw.packingLists.length > 0
        ? raw.packingLists.map((list) => sanitizePackingList(list as Partial<PackingList>))
        : [createDefaultPackingList('Main packing list', null, 'packing-default')],
    travellers: Array.isArray(raw.travellers)
      ? raw.travellers.map((traveller) => sanitizeTraveller(traveller as Partial<Traveller>))
      : [],
    activityLog: Array.isArray(raw.activityLog)
      ? raw.activityLog.map((entry) => sanitizeActivity(entry as Partial<ActivityLogEntry>)).slice(0, 50)
      : [],
    documents: Array.isArray(raw.documents)
      ? raw.documents.map((doc) => sanitizeDocument(doc as Partial<TripDocument>))
      : [],
    collaboration: sanitizeCollaborationState(raw.collaboration),
  };
};

export const sanitizeTrip = (trip: TripData): TripData => {
  const migrated = migrateTrip(trip);
  const sortedStops = [...migrated.stops].sort((a, b) => {
    if (a.date && b.date && a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    if (a.day !== b.day) {
      return a.day - b.day;
    }
    return a.order - b.order;
  });
  return {
    ...migrated,
    tripName: migrated.tripName.trim() || 'Untitled Trip',
    destination: migrated.destination.trim(),
    notes: migrated.notes.trim(),
    stops: sortedStops.map((stop, index) => sanitizeStop(stop, index)),
    activityLog: migrated.activityLog.slice(0, 50),
  };
};

export const cloneTrip = (trip: TripData): TripData => {
  const sanitized = sanitizeTrip(trip);
  return {
    ...sanitized,
    stops: sanitized.stops.map((stop) => ({ ...stop })),
    bookings: sanitized.bookings.map((booking) => ({ ...booking })),
    expenses: sanitized.expenses.map((expense) => ({ ...expense })),
    packingLists: sanitized.packingLists.map((list) => ({
      ...list,
      items: list.items.map((item) => ({ ...item })),
    })),
    travellers: sanitized.travellers.map((traveller) => ({ ...traveller })),
    activityLog: sanitized.activityLog.map((entry) => ({ ...entry })),
    documents: (sanitized.documents ?? []).map((doc) => ({ ...doc })),
    collaboration: sanitized.collaboration
      ? {
          ...sanitized.collaboration,
          members: sanitized.collaboration.members.map((member) => ({ ...member })),
          auditHistory: sanitized.collaboration.auditHistory.map((entry) => ({ ...entry })),
        }
      : undefined,
  };
};

export const validateTripSetup = (input: TripSetupInput): TripSetupErrors => {
  const errors: TripSetupErrors = {};
  if (!input.tripName.trim()) {
    errors.tripName = 'Trip name is required.';
  }
  if (!input.destination.trim()) {
    errors.destination = 'Destination is required.';
  }
  if (!isIsoDate(input.departureDate)) {
    errors.departureDate = 'Departure date must be YYYY-MM-DD.';
  }
  if (!isIsoDate(input.returnDate)) {
    errors.returnDate = 'Return date must be YYYY-MM-DD.';
  }
  if (isIsoDate(input.departureDate) && isIsoDate(input.returnDate) && input.returnDate < input.departureDate) {
    errors.returnDate = 'Return date must be on or after departure date.';
  }
  if (!Number.isInteger(input.travellerCount) || input.travellerCount < 1) {
    errors.travellerCount = 'Traveller count must be at least 1.';
  }
  if (!TRIP_PURPOSES.includes(input.purpose)) {
    errors.purpose = 'Select a valid trip purpose.';
  }
  if (!Number.isFinite(input.budget) || input.budget < 0) {
    errors.budget = 'Budget must be zero or greater.';
  }
  if (!input.currency.trim()) {
    errors.currency = 'Currency is required.';
  }
  return errors;
};

export const appendActivity = (trip: TripData, message: string): TripData => ({
  ...trip,
  activityLog: [createActivityLogEntry(message), ...trip.activityLog].slice(0, 50),
});
