import { describe, expect, it } from 'vitest';
import {
  createEmptySyncState,
  detectSyncConflict,
  digestPayload,
  enqueueChange,
  runManualSync,
} from './syncEngine';

describe('syncEngine', () => {
  it('enqueues stable entity changes and merges pending revisions', () => {
    let state = createEmptySyncState();
    state = enqueueChange(state, {
      entityType: 'trip',
      entityId: 'trip-1',
      revision: 1,
      payload: { name: 'A' },
    });
    state = enqueueChange(state, {
      entityType: 'trip',
      entityId: 'trip-1',
      revision: 2,
      payload: { name: 'B' },
    });
    expect(state.queue).toHaveLength(1);
    expect(state.queue[0]?.revision).toBe(2);
    expect(state.queue[0]?.payloadDigest).toBe(digestPayload({ name: 'B' }));
  });

  it('detects deterministic conflicts when remote revision is ahead with different digest', () => {
    const change = enqueueChange(createEmptySyncState(), {
      entityType: 'booking',
      entityId: 'b1',
      revision: 3,
      payload: { title: 'Local' },
    }).queue[0]!;
    const conflict = detectSyncConflict(change, {
      revision: 5,
      payloadDigest: digestPayload({ title: 'Remote' }),
    });
    expect(conflict?.localRevision).toBe(3);
    expect(conflict?.remoteRevision).toBe(5);
  });

  it('marks pending changes synced on local manual sync when online', () => {
    let state = enqueueChange(createEmptySyncState(), {
      entityType: 'expense',
      entityId: 'e1',
      revision: 1,
      payload: { amount: 10 },
    });
    state = { ...state, network: 'online' };
    const next = runManualSync(state);
    expect(next.queue[0]?.status).toBe('synced');
    expect(next.lastSyncAt).toBeTruthy();
  });

  it('blocks sync while offline', () => {
    let state = enqueueChange(createEmptySyncState(), {
      entityType: 'document',
      entityId: 'd1',
      revision: 1,
      payload: { title: 'Passport' },
    });
    state = { ...state, network: 'offline' };
    const next = runManualSync(state);
    expect(next.queue[0]?.status).toBe('pending');
    expect(next.lastSyncMessage).toMatch(/offline/i);
  });
});
