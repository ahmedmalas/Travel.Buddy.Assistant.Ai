import type { TravelBuddyClient } from '../../lib/supabase/client';
import { getSupabaseClient } from '../../lib/supabase/client';
import type { CollaborationMember, CollaborationRole, CollaborationState } from '../vaultDomain';
import { applyInvitationAction, normalizeMemberStatus } from './collaborationLifecycle';

export type CloudCollaborationResult<T> = { ok: true; value: T; provider: 'supabase' | 'local-demo' } | {
  ok: false;
  message: string;
  provider: 'supabase' | 'local-demo';
};

const normalizeStatus = (status: CollaborationMember['status']): 'pending' | 'accepted' | 'revoked' | 'expired' => {
  const normalized = normalizeMemberStatus(status);
  if (normalized === 'invited') return 'pending';
  if (normalized === 'active') return 'accepted';
  return normalized;
};

export async function persistInvitationToCloud(
  tripId: string,
  member: CollaborationMember,
  client: TravelBuddyClient | null = getSupabaseClient(),
): Promise<CloudCollaborationResult<CollaborationMember>> {
  if (!client) {
    return { ok: true, value: member, provider: 'local-demo' };
  }

  const { error } = await client.from('trip_collaborators').upsert({
    id: member.id,
    trip_id: tripId,
    email: member.email,
    name: member.name,
    role: member.role,
    status: normalizeStatus(member.status),
    invited_at: member.invitedAt,
  });

  if (error) return { ok: false, message: error.message, provider: 'supabase' };
  return { ok: true, value: member, provider: 'supabase' };
}

export async function applyCloudInvitationAction(
  collaboration: CollaborationState,
  memberId: string,
  action: 'accept' | 'revoke' | 'expire',
  tripId: string,
  client: TravelBuddyClient | null = getSupabaseClient(),
): Promise<CloudCollaborationResult<CollaborationState>> {
  const next = applyInvitationAction(collaboration, memberId, action, collaboration.ownerName);

  const member = next.members.find((entry) => entry.id === memberId);
  if (!member) return { ok: false, message: 'Member not found.', provider: 'local-demo' };

  if (!client) {
    return { ok: true, value: next, provider: 'local-demo' };
  }

  const { error } = await client
    .from('trip_collaborators')
    .update({
      status: normalizeStatus(member.status),
      accepted_at: action === 'accept' ? new Date().toISOString() : null,
    })
    .eq('id', memberId)
    .eq('trip_id', tripId);

  if (error) return { ok: false, message: error.message, provider: 'supabase' };

  await client.from('trip_activity').insert({
    trip_id: tripId,
    actor_name: collaboration.ownerName,
    action: `${action}_invitation`,
    details: `${action} ${member.email} (${member.role})`,
  });

  return { ok: true, value: next, provider: 'supabase' };
}

export function assertCanWrite(role: CollaborationRole | null, action: 'edit' | 'manage'): boolean {
  if (!role) return false;
  if (action === 'manage') return role === 'owner';
  return role === 'owner' || role === 'editor';
}

export async function fetchCloudActivity(
  tripId: string,
  client: TravelBuddyClient | null = getSupabaseClient(),
): Promise<CloudCollaborationResult<Array<{ id: string; action: string; details: string; at: string; actorName: string }>>> {
  if (!client) {
    return { ok: true, value: [], provider: 'local-demo' };
  }
  const { data, error } = await client
    .from('trip_activity')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return { ok: false, message: error.message, provider: 'supabase' };
  return {
    ok: true,
    provider: 'supabase',
    value: (data ?? []).map((row) => ({
      id: row.id,
      action: row.action,
      details: row.details,
      at: row.created_at,
      actorName: row.actor_name,
    })),
  };
}
