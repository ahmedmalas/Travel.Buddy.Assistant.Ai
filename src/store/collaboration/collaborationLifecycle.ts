import type { CollaborationMember, CollaborationRole, CollaborationState } from '../vaultDomain';
import { canPerform, type PermissionMatrix } from '../vaultCalculations';

export type InvitationAction = 'accept' | 'revoke' | 'expire' | 'resend';

export const normalizeMemberStatus = (status: CollaborationMember['status']): CollaborationMember['status'] => {
  if (status === 'invited') return 'pending';
  if (status === 'active') return 'accepted';
  return status;
};

export const applyInvitationAction = (
  collaboration: CollaborationState,
  memberId: string,
  action: InvitationAction,
  actorName: string,
): CollaborationState => {
  const now = new Date().toISOString();
  const members = collaboration.members.map((member) => {
    if (member.id !== memberId || member.role === 'owner') {
      return { ...member, status: normalizeMemberStatus(member.status) };
    }
    if (action === 'accept') return { ...member, status: 'accepted' as const };
    if (action === 'revoke') return { ...member, status: 'revoked' as const };
    if (action === 'expire') return { ...member, status: 'expired' as const };
    return { ...member, status: 'pending' as const, invitedAt: now };
  });
  return {
    ...collaboration,
    members,
    auditHistory: [
      {
        id: crypto.randomUUID(),
        at: now,
        actorName,
        action: `invitation-${action}`,
        details: `Member ${memberId} marked ${action}.`,
      },
      ...collaboration.auditHistory,
    ].slice(0, 100),
  };
};

export const roleCan = (role: CollaborationRole, action: keyof PermissionMatrix['owner']): boolean =>
  canPerform(role, action);

export const assertCanEdit = (role: CollaborationRole): { ok: true } | { ok: false; message: string } =>
  roleCan(role, 'canEditTrip')
    ? { ok: true }
    : { ok: false, message: 'Viewer role cannot edit trip data.' };

export const assertCanManageMembers = (role: CollaborationRole): { ok: true } | { ok: false; message: string } =>
  roleCan(role, 'canManageMembers')
    ? { ok: true }
    : { ok: false, message: 'Only the owner can manage collaborators.' };
