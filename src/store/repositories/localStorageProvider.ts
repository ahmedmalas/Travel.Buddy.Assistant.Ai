import { TEMPLATE_STORAGE_KEY, VAULT_STORAGE_KEY, migrateTemplates, migrateVaultState, toVaultTrip, type TripTemplate, type TripVaultState, type VaultTrip } from '../vaultDomain';
import type {
  BookingRepository,
  CollaborationRepository,
  DataRepositories,
  DocumentRepository,
  ExpenseRepository,
  TemplateRepository,
  TravellerRepository,
  TripRepository,
} from './types';

const readJson = (key: string): unknown => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeJson = (key: string, value: unknown): boolean => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

const loadVault = (): TripVaultState => {
  const existing = readJson(VAULT_STORAGE_KEY);
  const vault = migrateVaultState(existing);
  if (!existing) {
    writeJson(VAULT_STORAGE_KEY, vault);
  }
  return vault;
};
const saveVault = (vault: TripVaultState): boolean => writeJson(VAULT_STORAGE_KEY, vault);

const updateTripInVault = (
  tripId: string,
  updater: (trip: VaultTrip) => VaultTrip,
): { ok: true; trip: VaultTrip; vault: TripVaultState } | { ok: false; message: string } => {
  const vault = loadVault();
  const current = vault.trips.find((trip) => trip.id === tripId);
  if (!current) {
    return { ok: false, message: `Trip ${tripId} not found.` };
  }
  const nextTrip = updater(current);
  const nextVault: TripVaultState = {
    ...vault,
    trips: vault.trips.map((trip) => (trip.id === tripId ? nextTrip : trip)),
  };
  if (!saveVault(nextVault)) {
    return { ok: false, message: 'Failed to persist vault.' };
  }
  return { ok: true, trip: nextTrip, vault: nextVault };
};

export const createLocalTripRepository = (): TripRepository => ({
  async list() {
    return loadVault().trips;
  },
  async getById(id) {
    return loadVault().trips.find((trip) => trip.id === id) ?? null;
  },
  async save(trip) {
    const vault = loadVault();
    const normalized = toVaultTrip(trip, trip.id);
    const exists = vault.trips.some((entry) => entry.id === normalized.id);
    const next: TripVaultState = {
      ...vault,
      trips: exists
        ? vault.trips.map((entry) => (entry.id === normalized.id ? normalized : entry))
        : [...vault.trips, normalized],
    };
    if (!saveVault(next)) {
      return { ok: false, message: 'Failed to save trip.' };
    }
    return { ok: true, value: normalized };
  },
  async delete(id) {
    const vault = loadVault();
    if (vault.trips.length <= 1) {
      return { ok: false, message: 'Cannot delete the last trip.' };
    }
    const nextTrips = vault.trips.filter((trip) => trip.id !== id);
    const next: TripVaultState = {
      ...vault,
      activeTripId: vault.activeTripId === id ? nextTrips[0]!.id : vault.activeTripId,
      trips: nextTrips,
    };
    if (!saveVault(next)) {
      return { ok: false, message: 'Failed to delete trip.' };
    }
    return { ok: true, value: true };
  },
  async getVault() {
    return loadVault();
  },
  async saveVault(vault) {
    if (!saveVault(vault)) {
      return { ok: false, message: 'Failed to save vault.' };
    }
    return { ok: true, value: vault };
  },
});

export const createLocalBookingRepository = (): BookingRepository => ({
  async listByTrip(tripId) {
    return (await createLocalTripRepository().getById(tripId))?.bookings ?? [];
  },
  async upsert(tripId, booking) {
    const result = updateTripInVault(tripId, (trip) => {
      const exists = trip.bookings.some((entry) => entry.id === booking.id);
      return {
        ...trip,
        bookings: exists
          ? trip.bookings.map((entry) => (entry.id === booking.id ? booking : entry))
          : [...trip.bookings, booking],
      };
    });
    return result.ok ? { ok: true, value: booking } : result;
  },
  async delete(tripId, bookingId) {
    const result = updateTripInVault(tripId, (trip) => ({
      ...trip,
      bookings: trip.bookings.filter((entry) => entry.id !== bookingId),
    }));
    return result.ok ? { ok: true, value: true } : result;
  },
});

export const createLocalExpenseRepository = (): ExpenseRepository => ({
  async listByTrip(tripId) {
    return (await createLocalTripRepository().getById(tripId))?.expenses ?? [];
  },
  async upsert(tripId, expense) {
    const result = updateTripInVault(tripId, (trip) => {
      const exists = trip.expenses.some((entry) => entry.id === expense.id);
      return {
        ...trip,
        expenses: exists
          ? trip.expenses.map((entry) => (entry.id === expense.id ? expense : entry))
          : [...trip.expenses, expense],
      };
    });
    return result.ok ? { ok: true, value: expense } : result;
  },
  async delete(tripId, expenseId) {
    const result = updateTripInVault(tripId, (trip) => ({
      ...trip,
      expenses: trip.expenses.filter((entry) => entry.id !== expenseId),
    }));
    return result.ok ? { ok: true, value: true } : result;
  },
});

export const createLocalTravellerRepository = (): TravellerRepository => ({
  async listByTrip(tripId) {
    return (await createLocalTripRepository().getById(tripId))?.travellers ?? [];
  },
  async upsert(tripId, traveller) {
    const result = updateTripInVault(tripId, (trip) => {
      const exists = trip.travellers.some((entry) => entry.id === traveller.id);
      return {
        ...trip,
        travellers: exists
          ? trip.travellers.map((entry) => (entry.id === traveller.id ? traveller : entry))
          : [...trip.travellers, traveller],
      };
    });
    return result.ok ? { ok: true, value: traveller } : result;
  },
  async delete(tripId, travellerId) {
    const result = updateTripInVault(tripId, (trip) => ({
      ...trip,
      travellers: trip.travellers.filter((entry) => entry.id !== travellerId),
    }));
    return result.ok ? { ok: true, value: true } : result;
  },
});

export const createLocalDocumentRepository = (): DocumentRepository => ({
  async listByTrip(tripId) {
    return (await createLocalTripRepository().getById(tripId))?.documents ?? [];
  },
  async upsert(tripId, document) {
    const result = updateTripInVault(tripId, (trip) => {
      const exists = trip.documents.some((entry) => entry.id === document.id);
      return {
        ...trip,
        documents: exists
          ? trip.documents.map((entry) => (entry.id === document.id ? document : entry))
          : [...trip.documents, document],
      };
    });
    return result.ok ? { ok: true, value: document } : result;
  },
  async delete(tripId, documentId) {
    const result = updateTripInVault(tripId, (trip) => ({
      ...trip,
      documents: trip.documents.filter((entry) => entry.id !== documentId),
    }));
    return result.ok ? { ok: true, value: true } : result;
  },
});

export const createLocalTemplateRepository = (): TemplateRepository => ({
  async list() {
    return migrateTemplates(readJson(TEMPLATE_STORAGE_KEY));
  },
  async save(template) {
    const current = migrateTemplates(readJson(TEMPLATE_STORAGE_KEY));
    const exists = current.some((entry) => entry.id === template.id);
    const next = exists
      ? current.map((entry) => (entry.id === template.id ? template : entry))
      : [...current, template];
    if (!writeJson(TEMPLATE_STORAGE_KEY, next)) {
      return { ok: false, message: 'Failed to save template.' };
    }
    return { ok: true, value: template };
  },
  async delete(templateId) {
    const current = migrateTemplates(readJson(TEMPLATE_STORAGE_KEY));
    const target = current.find((entry) => entry.id === templateId);
    if (!target) {
      return { ok: false, message: 'Template not found.' };
    }
    if (target.isDefault) {
      return { ok: false, message: 'Default templates cannot be deleted.' };
    }
    if (!writeJson(TEMPLATE_STORAGE_KEY, current.filter((entry) => entry.id !== templateId))) {
      return { ok: false, message: 'Failed to delete template.' };
    }
    return { ok: true, value: true };
  },
});

export const createLocalCollaborationRepository = (): CollaborationRepository => ({
  async get(tripId) {
    return (await createLocalTripRepository().getById(tripId))?.collaboration ?? null;
  },
  async save(tripId, collaboration) {
    const result = updateTripInVault(tripId, (trip) => ({ ...trip, collaboration }));
    return result.ok ? { ok: true, value: collaboration } : result;
  },
  async upsertMember(tripId, member) {
    const result = updateTripInVault(tripId, (trip) => {
      const exists = trip.collaboration.members.some((entry) => entry.id === member.id);
      return {
        ...trip,
        collaboration: {
          ...trip.collaboration,
          members: exists
            ? trip.collaboration.members.map((entry) => (entry.id === member.id ? member : entry))
            : [...trip.collaboration.members, member],
        },
      };
    });
    return result.ok ? { ok: true, value: member } : result;
  },
});

export const createLocalDataRepositories = (): DataRepositories => ({
  trips: createLocalTripRepository(),
  bookings: createLocalBookingRepository(),
  expenses: createLocalExpenseRepository(),
  travellers: createLocalTravellerRepository(),
  documents: createLocalDocumentRepository(),
  templates: createLocalTemplateRepository(),
  collaboration: createLocalCollaborationRepository(),
});

export type { TripTemplate };
