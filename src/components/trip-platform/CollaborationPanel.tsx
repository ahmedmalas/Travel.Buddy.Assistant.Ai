import { useState } from 'react';
import { useSharedTripStore } from '../../store/TripStoreContext';
import { COLLABORATION_ROLES, type CollaborationRole } from '../../store/vaultDomain';
import { EmptyState, Field, Panel, PrimaryButton, SecondaryButton, StatusBanner, inputClassName } from './shared/ui';

export function CollaborationPanel() {
  const {
    activeVaultTrip,
    inviteCollaborator,
    updateCollaboratorRole,
    revokeCollaborator,
    applyCollaboratorInvitationAction,
    canPerform,
    currentUserRole,
    canManageMembers,
  } = useSharedTripStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CollaborationRole>('viewer');
  const [feedback, setFeedback] = useState<string | null>(null);
  const collaboration = activeVaultTrip.collaboration;

  return (
    <Panel
      title="Collaboration"
      description="Owner/editor/viewer permissions with pending, accepted, revoked, and expired invitation lifecycle. Local simulation only."
    >
      {feedback ? <StatusBanner kind="info" message={feedback} /> : null}
      <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
        <p>
          Owner: <span className="text-white">{collaboration.ownerName}</span> ({collaboration.ownerEmail})
        </p>
        <p className="mt-1">
          Your role: <span className="text-white">{currentUserRole}</span> · can edit trip:{' '}
          {canPerform(currentUserRole, 'canEditTrip') ? 'yes' : 'no'} · can manage members:{' '}
          {canManageMembers ? 'yes' : 'no'}
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Field label="Invitee name" htmlFor="collab-name">
          <input
            id="collab-name"
            className={inputClassName}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canManageMembers}
          />
        </Field>
        <Field label="Invitee email" htmlFor="collab-email">
          <input
            id="collab-email"
            className={inputClassName}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!canManageMembers}
          />
        </Field>
        <Field label="Role" htmlFor="collab-role">
          <select
            id="collab-role"
            className={inputClassName}
            value={role}
            onChange={(e) => setRole(e.target.value as CollaborationRole)}
            disabled={!canManageMembers}
          >
            {COLLABORATION_ROLES.filter((entry) => entry !== 'owner').map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-3">
        <PrimaryButton
          type="button"
          disabled={!canManageMembers}
          onClick={() => {
            const result = inviteCollaborator({ name, email, role });
            setFeedback(result.message);
            if (result.ok) {
              setName('');
              setEmail('');
            }
          }}
        >
          Invite traveller
        </PrimaryButton>
      </div>

      <div className="mt-6 space-y-3">
        <h4 className="font-medium text-white">Members</h4>
        {collaboration.members.length === 0 ? (
          <EmptyState title="No members" body="Invite editors or viewers to this local trip." />
        ) : (
          collaboration.members.map((member) => (
            <article key={member.id} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-300">
                  <p className="font-medium text-white">{member.name}</p>
                  <p className="mt-1">
                    {member.email || 'No email'} · {member.role} · {member.status}
                  </p>
                </div>
                {member.role !== 'owner' ? (
                  <div className="flex flex-wrap gap-2">
                    <select
                      className={inputClassName}
                      value={member.role}
                      disabled={!canManageMembers}
                      onChange={(e) => updateCollaboratorRole(member.id, e.target.value as CollaborationRole)}
                      aria-label={`Role for ${member.name}`}
                    >
                      {COLLABORATION_ROLES.filter((entry) => entry !== 'owner').map((entry) => (
                        <option key={entry} value={entry}>
                          {entry}
                        </option>
                      ))}
                    </select>
                    <SecondaryButton
                      type="button"
                      disabled={!canManageMembers}
                      onClick={() => {
                        const result = applyCollaboratorInvitationAction(member.id, 'accept');
                        setFeedback(result.message);
                      }}
                    >
                      Accept
                    </SecondaryButton>
                    <SecondaryButton
                      type="button"
                      disabled={!canManageMembers}
                      onClick={() => {
                        const result = applyCollaboratorInvitationAction(member.id, 'expire');
                        setFeedback(result.message);
                      }}
                    >
                      Expire
                    </SecondaryButton>
                    <SecondaryButton
                      type="button"
                      disabled={!canManageMembers}
                      onClick={() => {
                        revokeCollaborator(member.id);
                        setFeedback('Invitation revoked.');
                      }}
                    >
                      Revoke
                    </SecondaryButton>
                  </div>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>

      <div className="mt-6">
        <h4 className="font-medium text-white">Activity history</h4>
        <ul className="mt-3 space-y-2">
          {collaboration.auditHistory.slice(0, 12).map((entry) => (
            <li key={entry.id} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300">
              <p className="text-white">
                {entry.action} · {entry.actorName}
              </p>
              <p className="mt-1">{entry.details}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(entry.at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}
