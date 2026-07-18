import { describe, expect, it, vi } from 'vitest';
import { createEmptySyncState, enqueueChange } from './syncEngine';
import {
  detectRevisionConflict,
  pullRemoteRevisions,
  pushQueuedChanges,
  resolveConflictDeterministically,
  runCloudSync,
} from './cloudSync';

describe('cloudSync', () => {
  it('falls back to local sync without a client', async () => {
    const queued = enqueueChange(createEmptySyncState(), {
      entityType: 'trip',
      entityId: 'trip-1',
      revision: 1,
      payload: { name: 'A' },
    });
    const result = await runCloudSync(queued, null);
    expect(result.provider).toBe('local-demo');
    expect(result.state.queue[0]?.status).toBe('synced');
  });

  it('detects and resolves conflicts deterministically by higher revision', () => {
    const state = enqueueChange(createEmptySyncState(), {
      entityType: 'trip',
      entityId: 'trip-1',
      revision: 2,
      payload: { name: 'local' },
    });
    const change = state.queue[0]!;
    expect(detectRevisionConflict(2, 5)).toBe(true);
    const resolved = resolveConflictDeterministically(state, change, {
      revision: 5,
      payloadDigest: 'dremote',
    });
    expect(resolved.queue[0]?.revision).toBe(5);
    expect(resolved.queue[0]?.status).toBe('synced');
    expect(resolved.conflicts.length).toBeGreaterThan(0);
  });

  it('pushes revisions through a mocked supabase client', async () => {
    const state = enqueueChange(createEmptySyncState(), {
      entityType: 'trip',
      entityId: '11111111-1111-1111-1111-111111111111',
      revision: 1,
      payload: { name: 'Cloud' },
    });

    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const client = {
      from: vi.fn((table: string) => {
        if (table === 'sync_revisions') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle,
                }),
              }),
            }),
            upsert,
          };
        }
        return {};
      }),
    } as never;

    const result = await pushQueuedChanges(state, client);
    expect(result.provider).toBe('supabase');
    expect(result.pushed).toBe(1);
    expect(upsert).toHaveBeenCalled();
  });

  it('pulls remote revisions and resolves conflicts', async () => {
    const state = enqueueChange(createEmptySyncState(), {
      entityType: 'trip',
      entityId: '11111111-1111-1111-1111-111111111111',
      revision: 1,
      payload: { name: 'local' },
    });
    const client = {
      from: vi.fn(() => ({
        select: () => ({
          order: () => ({
            limit: () =>
              Promise.resolve({
                data: [
                  {
                    entity_type: 'trip',
                    entity_id: '11111111-1111-1111-1111-111111111111',
                    revision: 4,
                    payload_digest: 'dother',
                  },
                ],
                error: null,
              }),
          }),
        }),
      })),
    } as never;

    const result = await pullRemoteRevisions(state, client);
    expect(result.provider).toBe('supabase');
    expect(result.conflicts).toBe(1);
  });
});
