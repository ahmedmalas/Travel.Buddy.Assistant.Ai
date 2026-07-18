import type { TravelBuddyClient } from '../../lib/supabase/client';
import { getSupabaseClient } from '../../lib/supabase/client';
import type { Booking, Expense, Traveller, TripDocument } from '../tripDomain';
import type { CollaborationMember, CollaborationState, TripTemplate, VaultTrip, TripVaultState } from '../vaultDomain';
import { createDefaultVaultState, migrateVaultState } from '../vaultDomain';
import type {
  BookingRepository,
  CollaborationRepository,
  DataRepositories,
  DocumentRepository,
  ExpenseRepository,
  RepositoryResult,
  TemplateRepository,
  TravellerRepository,
  TripRepository,
} from './types';
import { createLocalDataRepositories } from './localStorageProvider';

type NestedEntityKey = 'bookings' | 'expenses' | 'travellers' | 'documents';

const asVaultTrip = (row: {
  id: string;
  payload: Record<string, unknown>;
  favourite: boolean;
  last_opened_at: string | null;
  created_at: string;
  updated_at: string;
  revision: number;
}): VaultTrip => {
  const payload = row.payload as Partial<VaultTrip>;
  return {
    ...(payload as VaultTrip),
    id: row.id,
    favourite: row.favourite,
    lastOpenedAt: row.last_opened_at ?? row.updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    revision: row.revision,
  } as VaultTrip & { revision?: number };
};

const tripRowFromVault = (trip: VaultTrip, ownerId: string) => ({
  id: trip.id,
  owner_id: ownerId,
  name: trip.tripName || 'Untitled trip',
  status: trip.status || 'draft',
  payload: trip as unknown as Record<string, unknown>,
  revision: typeof (trip as VaultTrip & { revision?: number }).revision === 'number'
    ? ((trip as VaultTrip & { revision?: number }).revision as number)
    : 1,
  favourite: Boolean(trip.favourite),
  archived: trip.status === 'archived',
  last_opened_at: trip.lastOpenedAt ?? null,
  updated_at: new Date().toISOString(),
});

async function requireUserId(client: TravelBuddyClient): Promise<string | null> {
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

function createCloudTripRepository(client: TravelBuddyClient, local: TripRepository): TripRepository {
  return {
    async list() {
      const { data, error } = await client.from('trips').select('*').order('updated_at', { ascending: false });
      if (error || !data) return local.list();
      return data.map((row) => asVaultTrip(row));
    },
    async getById(id) {
      const { data, error } = await client.from('trips').select('*').eq('id', id).maybeSingle();
      if (error || !data) return local.getById(id);
      return asVaultTrip(data);
    },
    async save(trip) {
      const ownerId = await requireUserId(client);
      if (!ownerId) return { ok: false, message: 'Cloud save requires an authenticated session.' };
      const row = tripRowFromVault(trip, ownerId);
      const { data, error } = await client.from('trips').upsert(row).select('*').single();
      if (error || !data) {
        const localResult = await local.save(trip);
        return localResult.ok
          ? { ok: true, value: trip }
          : { ok: false, message: error?.message ?? localResult.message };
      }
      await local.save(trip);
      return { ok: true, value: asVaultTrip(data) };
    },
    async delete(id) {
      const { error } = await client.from('trips').delete().eq('id', id);
      const localResult = await local.delete(id);
      if (error && !localResult.ok) return { ok: false, message: error.message };
      return { ok: true, value: true };
    },
    async getVault() {
      const trips = await this.list();
      if (trips.length === 0) return local.getVault();
      const localVault = await local.getVault();
      return migrateVaultState({
        version: 1,
        activeTripId: localVault.activeTripId || trips[0]?.id || '',
        trips,
      });
    },
    async saveVault(vault: TripVaultState) {
      const ownerId = await requireUserId(client);
      if (!ownerId) {
        await local.saveVault(vault);
        return { ok: false, message: 'Cloud vault save requires auth; local copy preserved.' };
      }
      for (const trip of vault.trips) {
        const result = await this.save(trip);
        if (!result.ok) {
          await local.saveVault(vault);
          return { ok: false, message: result.message };
        }
      }
      await local.saveVault(vault);
      return { ok: true, value: vault };
    },
  };
}

function nestedRepo<T extends { id: string }>(
  client: TravelBuddyClient,
  local: { listByTrip(tripId: string): Promise<T[]>; upsert(tripId: string, item: T): Promise<RepositoryResult<T>>; delete(tripId: string, id: string): Promise<RepositoryResult<true>> },
  key: NestedEntityKey,
): typeof local {
  return {
    async listByTrip(tripId) {
      const { data, error } = await client.from('trips').select('payload').eq('id', tripId).maybeSingle();
      if (error || !data) return local.listByTrip(tripId);
      const payload = data.payload as Partial<Record<NestedEntityKey, T[]>>;
      return Array.isArray(payload[key]) ? (payload[key] as T[]) : local.listByTrip(tripId);
    },
    async upsert(tripId, item) {
      const localResult = await local.upsert(tripId, item);
      const { data } = await client.from('trips').select('payload,revision,owner_id,name,status,favourite,archived,last_opened_at').eq('id', tripId).maybeSingle();
      if (!data) return localResult;
      const payload = { ...(data.payload as Record<string, unknown>) };
      const list = Array.isArray(payload[key]) ? [...(payload[key] as T[])] : [];
      const index = list.findIndex((entry) => entry.id === item.id);
      if (index >= 0) list[index] = item;
      else list.push(item);
      payload[key] = list;
      const { error } = await client
        .from('trips')
        .update({ payload, revision: (data.revision ?? 1) + 1, updated_at: new Date().toISOString() })
        .eq('id', tripId);
      if (error) return localResult.ok ? localResult : { ok: false, message: error.message };
      return { ok: true, value: item };
    },
    async delete(tripId, id) {
      const localResult = await local.delete(tripId, id);
      const { data } = await client.from('trips').select('payload,revision').eq('id', tripId).maybeSingle();
      if (!data) return localResult;
      const payload = { ...(data.payload as Record<string, unknown>) };
      const list = Array.isArray(payload[key]) ? (payload[key] as T[]).filter((entry) => entry.id !== id) : [];
      payload[key] = list;
      await client
        .from('trips')
        .update({ payload, revision: (data.revision ?? 1) + 1, updated_at: new Date().toISOString() })
        .eq('id', tripId);
      return { ok: true, value: true };
    },
  };
}

function createCloudTemplateRepository(client: TravelBuddyClient, local: TemplateRepository): TemplateRepository {
  return {
    async list() {
      const { data, error } = await client.from('trip_templates').select('*').order('created_at', { ascending: false });
      if (error || !data) return local.list();
      return data.map((row) => row.payload as unknown as TripTemplate);
    },
    async save(template) {
      const ownerId = await requireUserId(client);
      if (!ownerId) return local.save(template);
      const { error } = await client.from('trip_templates').upsert({
        id: template.id,
        owner_id: ownerId,
        name: template.name,
        description: template.description,
        is_default: template.isDefault,
        payload: template as unknown as Record<string, unknown>,
        revision: 1,
      });
      await local.save(template);
      if (error) return { ok: false, message: error.message };
      return { ok: true, value: template };
    },
    async delete(templateId) {
      const { error } = await client.from('trip_templates').delete().eq('id', templateId);
      await local.delete(templateId);
      if (error) return { ok: false, message: error.message };
      return { ok: true, value: true };
    },
  };
}

function createCloudCollaborationRepository(
  client: TravelBuddyClient,
  local: CollaborationRepository,
): CollaborationRepository {
  return {
    async get(tripId) {
      const { data: trip } = await client.from('trips').select('payload').eq('id', tripId).maybeSingle();
      const { data: members } = await client.from('trip_collaborators').select('*').eq('trip_id', tripId);
      if (!trip && !members) return local.get(tripId);
      const payloadCollab = (trip?.payload as { collaboration?: CollaborationState } | undefined)?.collaboration;
      if (!members || members.length === 0) return payloadCollab ?? local.get(tripId);
      const collaboration: CollaborationState = {
        ownerName: payloadCollab?.ownerName ?? 'Owner',
        ownerEmail: payloadCollab?.ownerEmail ?? '',
        members: members.map(
          (member): CollaborationMember => ({
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
            invitedAt: member.invited_at,
            status: member.status,
          }),
        ),
        auditHistory: payloadCollab?.auditHistory ?? [],
      };
      return collaboration;
    },
    async save(tripId, collaboration) {
      await local.save(tripId, collaboration);
      for (const member of collaboration.members) {
        const { error } = await client.from('trip_collaborators').upsert({
          id: member.id,
          trip_id: tripId,
          email: member.email,
          name: member.name,
          role: member.role,
          status: member.status === 'invited' || member.status === 'active' ? 'pending' : member.status,
          invited_at: member.invitedAt,
        });
        if (error) return { ok: false, message: error.message };
      }
      return { ok: true, value: collaboration };
    },
    async upsertMember(tripId, member) {
      await local.upsertMember(tripId, member);
      const { error } = await client.from('trip_collaborators').upsert({
        id: member.id,
        trip_id: tripId,
        email: member.email,
        name: member.name,
        role: member.role,
        status: member.status === 'invited' || member.status === 'active' ? 'pending' : member.status,
        invited_at: member.invitedAt,
      });
      if (error) return { ok: false, message: error.message };
      return { ok: true, value: member };
    },
  };
}

export function createSupabaseDataRepositories(
  client: TravelBuddyClient | null = getSupabaseClient(),
): DataRepositories {
  const local = createLocalDataRepositories();
  if (!client) return local;

  const trips = createCloudTripRepository(client, local.trips);
  return {
    trips,
    bookings: nestedRepo<Booking>(client, local.bookings, 'bookings'),
    expenses: nestedRepo<Expense>(client, local.expenses, 'expenses'),
    travellers: nestedRepo<Traveller>(client, local.travellers, 'travellers'),
    documents: nestedRepo<TripDocument>(client, local.documents, 'documents'),
    templates: createCloudTemplateRepository(client, local.templates),
    collaboration: createCloudCollaborationRepository(client, local.collaboration),
  };
}

export async function migrateLocalVaultToCloud(
  vault: TripVaultState,
  client: TravelBuddyClient | null = getSupabaseClient(),
): Promise<RepositoryResult<{ migrated: number; message: string }>> {
  if (!client) {
    return {
      ok: false,
      message: 'Supabase is not configured. Local vault left unchanged.',
    };
  }
  const ownerId = await requireUserId(client);
  if (!ownerId) {
    return { ok: false, message: 'Sign in required before local-to-cloud migration.' };
  }

  let migrated = 0;
  for (const trip of vault.trips) {
    const row = tripRowFromVault(trip, ownerId);
    const { error } = await client.from('trips').upsert(row);
    if (error) {
      return {
        ok: false,
        message: `Migration stopped after ${migrated} trip(s): ${error.message}. Local data preserved.`,
      };
    }
    migrated += 1;
  }

  return {
    ok: true,
    value: {
      migrated,
      message: `Migrated ${migrated} trip(s) to cloud. Local vault retained as offline fallback.`,
    },
  };
}

export { createDefaultVaultState };
