import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createVaultTrip } from '../vaultDomain';
import { createSupabaseDataRepositories, migrateLocalVaultToCloud } from './supabaseProvider';

describe('supabase repositories', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('falls back to local repositories when client is null', async () => {
    const repos = createSupabaseDataRepositories(null);
    const trip = createVaultTrip({ tripName: 'Local fallback' });
    const saved = await repos.trips.save(trip);
    expect(saved.ok).toBe(true);
    const listed = await repos.trips.list();
    expect(listed.some((entry) => entry.tripName === 'Local fallback')).toBe(true);
  });

  it('migrates local vault when authenticated against a mock client', async () => {
    const trip = createVaultTrip({ tripName: 'Migrate me' });
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
      from: vi.fn(() => ({
        upsert,
      })),
    } as never;

    const result = await migrateLocalVaultToCloud(
      { version: 1, activeTripId: trip.id, trips: [trip] },
      client,
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.migrated).toBe(1);
    expect(upsert).toHaveBeenCalled();
  });

  it('refuses migration without auth and preserves local data intent', async () => {
    const result = await migrateLocalVaultToCloud(
      { version: 1, activeTripId: 'x', trips: [] },
      {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
        from: vi.fn(),
      } as never,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/Sign in required/i);
  });
});
