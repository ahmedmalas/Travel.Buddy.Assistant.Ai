import { useSharedTripStore } from '../../store/TripStoreContext';
import {
  buildAccessibilityAudit,
  buildCompatibilityReport,
  buildMigrationReport,
  buildSecurityReviewChecklist,
  getVersionInfo,
} from '../../finalisation';
import { Panel, SecondaryButton, StatusBadge } from './shared/ui';

export function ReleaseCentrePanel() {
  const { finalisationState, setFeatureFlagEnabled } = useSharedTripStore();
  const version = getVersionInfo();
  const compatibility = buildCompatibilityReport();
  const migrations = buildMigrationReport();
  const security = buildSecurityReviewChecklist();
  const a11y = buildAccessibilityAudit();

  return (
    <Panel
      title="Release centre"
      description="Version information, release notes, feature flags, migration and compatibility reporting."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge label={`App ${version.applicationVersion}`} tone="info" />
        <StatusBadge label={`Backup v${compatibility.backupVersion}`} tone="info" />
        <StatusBadge label="Live providers off" tone="warning" />
      </div>

      <section className="mb-5 space-y-2 text-sm text-slate-300">
        <h4 className="font-medium text-white">Release notes</h4>
        {version.releaseNotes.map((note) => (
          <div key={note.version} className="rounded-xl border border-white/10 p-3">
            <p className="font-medium text-white">
              v{note.version} · {note.date}
            </p>
            <ul className="mt-2 list-disc pl-5">
              {note.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mb-5">
        <h4 className="mb-2 font-medium text-white">Feature flags</h4>
        <ul className="space-y-2">
          {finalisationState.featureFlags.map((flag) => (
            <li key={flag.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 p-3 text-sm">
              <div>
                <p className="font-medium text-white">
                  {flag.label} {flag.experimental ? <span className="text-amber-200">(experimental)</span> : null}
                </p>
                <p className="text-slate-400">{flag.description}</p>
              </div>
              <SecondaryButton onClick={() => setFeatureFlagEnabled(flag.id, !flag.enabled)}>
                {flag.enabled ? 'Disable' : 'Enable'}
              </SecondaryButton>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-5 grid gap-4 md:grid-cols-2 text-sm text-slate-300">
        <div className="rounded-xl border border-white/10 p-3">
          <h4 className="font-medium text-white">Compatibility</h4>
          <p className="mt-1">Supports backups {compatibility.supportsBackupRange}</p>
          <ul className="mt-2 list-disc pl-5 text-xs text-slate-400">
            {compatibility.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <h4 className="font-medium text-white">Migrations</h4>
          <ul className="mt-2 space-y-1 text-xs text-slate-400">
            {migrations.map((row) => (
              <li key={`${row.fromVersion}-${row.toVersion}`}>
                v{row.fromVersion}→v{row.toVersion}: {row.description} ({row.status})
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 text-sm text-slate-300">
        <div className="rounded-xl border border-white/10 p-3">
          <h4 className="font-medium text-white">Security review</h4>
          <ul className="mt-2 space-y-1 text-xs">
            {security.map((item) => (
              <li key={item.id}>
                <span className="text-white">{item.area}</span> — {item.status}: {item.notes}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <h4 className="font-medium text-white">Accessibility audit</h4>
          <ul className="mt-2 space-y-1 text-xs">
            {a11y.map((item) => (
              <li key={item.id}>
                <span className="text-white">{item.area}</span> — {item.status}: {item.notes}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Panel>
  );
}
