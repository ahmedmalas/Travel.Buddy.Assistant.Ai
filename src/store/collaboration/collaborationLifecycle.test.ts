import { describe, expect, it } from 'vitest';
import { createDefaultCollaboration } from '../vaultDomain';
import { applyInvitationAction, assertCanEdit, assertCanManageMembers } from './collaborationLifecycle';

describe('collaborationLifecycle', () => {
  it('transitions invitation states through accept revoke expire and resend', () => {
    let collaboration = createDefaultCollaboration();
    collaboration = {
      ...collaboration,
      members: [
        ...collaboration.members,
        {
          id: 'm2',
          name: 'Jamie',
          email: 'jamie@example.com',
          role: 'editor',
          invitedAt: new Date().toISOString(),
          status: 'pending',
        },
      ],
    };
    collaboration = applyInvitationAction(collaboration, 'm2', 'accept', 'Owner');
    expect(collaboration.members.find((member) => member.id === 'm2')?.status).toBe('accepted');
    collaboration = applyInvitationAction(collaboration, 'm2', 'expire', 'Owner');
    expect(collaboration.members.find((member) => member.id === 'm2')?.status).toBe('expired');
    collaboration = applyInvitationAction(collaboration, 'm2', 'resend', 'Owner');
    expect(collaboration.members.find((member) => member.id === 'm2')?.status).toBe('pending');
    collaboration = applyInvitationAction(collaboration, 'm2', 'revoke', 'Owner');
    expect(collaboration.members.find((member) => member.id === 'm2')?.status).toBe('revoked');
  });

  it('enforces permission helpers', () => {
    expect(assertCanEdit('viewer').ok).toBe(false);
    expect(assertCanEdit('editor').ok).toBe(true);
    expect(assertCanManageMembers('editor').ok).toBe(false);
    expect(assertCanManageMembers('owner').ok).toBe(true);
  });
});
