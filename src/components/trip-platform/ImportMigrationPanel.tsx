import { useState } from 'react';
import { useSharedTripStore } from '../../store/TripStoreContext';
import { Field, Panel, PrimaryButton, SecondaryButton, StatusBanner, inputClassName } from './shared/ui';

export function ImportMigrationPanel() {
  const { importVaultBackup, importTemplatesBackup, toVaultBackupJson, toBackupJson, parseTripBackupPreview } =
    useSharedTripStore();
  const [vaultRaw, setVaultRaw] = useState('');
  const [templateRaw, setTemplateRaw] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [kind, setKind] = useState<'success' | 'error' | 'info'>('info');

  return (
    <Panel
      title="Import & migration"
      description="Import previous backups and templates, validate payloads, and export vault-aware backups (v4)."
    >
      {feedback ? <StatusBanner kind={kind} message={feedback} /> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <SecondaryButton
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(toVaultBackupJson());
            setKind('success');
            setFeedback('Vault backup JSON copied to clipboard.');
          }}
        >
          Copy vault backup
        </SecondaryButton>
        <SecondaryButton
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(toBackupJson());
            setKind('success');
            setFeedback('Active-trip backup JSON (v4, includes vault) copied.');
          }}
        >
          Copy trip backup
        </SecondaryButton>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div>
          <Field label="Vault / trip backup JSON" htmlFor="vault-import">
            <textarea
              id="vault-import"
              rows={10}
              className={inputClassName}
              value={vaultRaw}
              onChange={(e) => setVaultRaw(e.target.value)}
              placeholder='Paste travel-buddy-vault-backup or travel-buddy-backup JSON'
            />
          </Field>
          <div className="mt-3 flex flex-wrap gap-2">
            <PrimaryButton
              type="button"
              onClick={() => {
                try {
                  const preview = parseTripBackupPreview(vaultRaw);
                  setKind('info');
                  setFeedback(
                    `Validated backup for "${preview.preview.tripTitle}" (${preview.preview.backupVersion}, ${preview.preview.itineraryItemCount} itinerary items).`,
                  );
                } catch (error) {
                  setKind('error');
                  setFeedback(error instanceof Error ? error.message : 'Validation failed.');
                }
              }}
            >
              Validate
            </PrimaryButton>
            <SecondaryButton
              type="button"
              onClick={() => {
                const result = importVaultBackup(vaultRaw, 'merge');
                setKind(result.ok ? 'success' : 'error');
                setFeedback(result.message);
              }}
            >
              Merge into vault
            </SecondaryButton>
            <SecondaryButton
              type="button"
              onClick={() => {
                const result = importVaultBackup(vaultRaw, 'replace');
                setKind(result.ok ? 'success' : 'error');
                setFeedback(result.message);
              }}
            >
              Replace vault
            </SecondaryButton>
          </div>
        </div>

        <div>
          <Field label="Templates JSON" htmlFor="template-import">
            <textarea
              id="template-import"
              rows={10}
              className={inputClassName}
              value={templateRaw}
              onChange={(e) => setTemplateRaw(e.target.value)}
              placeholder='Paste {"templates":[...]} or a templates array'
            />
          </Field>
          <div className="mt-3">
            <PrimaryButton
              type="button"
              onClick={() => {
                const result = importTemplatesBackup(templateRaw);
                setKind(result.ok ? 'success' : 'error');
                setFeedback(result.message);
              }}
            >
              Import templates
            </PrimaryButton>
          </div>
        </div>
      </div>
    </Panel>
  );
}
