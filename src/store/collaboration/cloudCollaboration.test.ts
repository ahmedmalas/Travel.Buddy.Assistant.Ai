import { describe, expect, it, vi } from 'vitest';
import { createDefaultCollaboration } from '../vaultDomain';
import { applyCloudInvitationAction, assertCanWrite, persistInvitationToCloud } from './cloudCollaboration';

describe('cloud collaboration', () => {
  it('enforces write permissions by role', () => {
    expect(assertCanWrite('viewer', 'edit')).toBe(false);
    expect(assertCanWrite('editor', 'edit')).toBe(true);
    expect(assertCanWrite('editor', 'manage')).toBe(false);
    expect(assertCanWrite('owner', 'manage')).toBe(true);
  });

  it('persists invitations locally without a client', async () => {
    const member = createDefaultCollaboration().members[0]!;
    const result = await persistInvitationToCloud('trip-1', member, null);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.provider).toBe('local-demo');
  });

  it('accepts invitations through a mocked client and blocks unauthorized writes via RLS-oriented client errors', async () => {
    const collaboration = createDefaultCollaboration();
    const invitee = {
      id: 'member-2',
      name: 'Sam',
      email: 'sam@example.com',
      role: 'editor' as const,
      invitedAt: new Date().toISOString(),
      status: 'pending' as const,
    };
    const withInvite = {
      ...collaboration,
      members: [...collaboration.members, invitee],
    };

    const update = vi.fn().mockReturnValue({
      eq: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const client = {
      from: vi.fn((table: string) => {
        if (table === 'trip_collaborators') return { update };
        if (table === 'trip_activity') return { insert };
        return {};
      }),
    } as never;

    const result = await applyCloudInvitationAction(withInvite, invitee.id, 'accept', 'trip-1', client);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider).toBe('supabase');
      expect(result.value.members.find((member) => member.id === invitee.id)?.status).toBe('accepted');
    }
  });
});
