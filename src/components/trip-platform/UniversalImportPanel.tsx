import { useState } from 'react';
import { useSharedTripStore } from '../../store/TripStoreContext';
import {
  parseImportContent,
  toggleImportEntity,
  validateImportFile,
  type ImportReviewDraft,
} from '../../finalisation';
import { Field, Panel, PrimaryButton, SecondaryButton, StatusBadge, inputClassName } from './shared/ui';

export function UniversalImportPanel() {
  const { finalisationState, setPendingImportReview, commitImportReview, trackAnalyticsEvent } =
    useSharedTripStore();
  const [error, setError] = useState<string | null>(null);
  const draft = finalisationState.pendingImportReview;

  const onFile = async (file: File | null) => {
    if (!file) return;
    const validation = validateImportFile({
      fileName: file.name,
      sizeBytes: file.size,
      mimeType: file.type,
    });
    if (!validation.ok) {
      setError(validation.message);
      return;
    }
    try {
      const content = await file.text();
      const parsed = parseImportContent({ fileName: file.name, content });
      setPendingImportReview(parsed);
      trackAnalyticsEvent('import_completed', { source: parsed.sourceKind, entities: parsed.entities.length });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
    }
  };

  const updateDraft = (next: ImportReviewDraft) => setPendingImportReview(next);

  return (
    <Panel
      title="Universal import"
      description="Import PDF text, booking emails, ICS, CSV, or Travel Buddy backups. Review confidence scores before saving."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge label="Manual upload only" tone="info" />
        <StatusBadge label="Review before save" tone="warning" />
      </div>

      <Field label="Upload itinerary / confirmation file" htmlFor="universal-import-file">
        <input
          id="universal-import-file"
          type="file"
          accept=".pdf,.txt,.eml,.ics,.csv,.json"
          className={inputClassName}
          onChange={(event) => void onFile(event.target.files?.[0] ?? null)}
        />
      </Field>

      {error ? (
        <p className="mt-3 text-sm text-rose-300" role="alert">
          {error}
        </p>
      ) : null}

      {draft ? (
        <div className="mt-5 space-y-3">
          <p className="text-sm text-slate-300">
            Source: {draft.sourceKind} · Overall confidence {draft.overallConfidence}% · {draft.entities.length}{' '}
            entities
          </p>
          {draft.warnings.map((warning) => (
            <p key={warning} className="text-sm text-amber-200" role="status">
              {warning}
            </p>
          ))}
          <ul className="max-h-96 space-y-2 overflow-y-auto">
            {draft.entities.map((entity) => (
              <li key={entity.id} className="rounded-xl border border-white/10 p-3 text-sm">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={entity.selected}
                    onChange={(event) =>
                      updateDraft(toggleImportEntity(draft, entity.id, event.target.checked))
                    }
                  />
                  <span>
                    <span className="font-medium text-white">
                      {entity.kind}: {entity.title}
                    </span>
                    <span className="mt-1 block text-slate-400">
                      {entity.startDate ?? '—'} {entity.startTime ?? ''} · conf {entity.confidence}% ·{' '}
                      {entity.confirmationNumber ?? 'no confirmation'}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <PrimaryButton onClick={() => commitImportReview()}>Save selected to trip</PrimaryButton>
            <SecondaryButton onClick={() => setPendingImportReview(null)}>Discard review</SecondaryButton>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-400">No pending import review.</p>
      )}

      {finalisationState.importHistory.length > 0 ? (
        <div className="mt-6">
          <h4 className="mb-2 text-sm font-medium text-slate-200">Recent imports</h4>
          <ul className="space-y-1 text-xs text-slate-400">
            {finalisationState.importHistory
              .slice()
              .reverse()
              .slice(0, 5)
              .map((item) => (
                <li key={item.id}>
                  {item.fileName} · {item.entities.length} entities · {item.overallConfidence}%
                </li>
              ))}
          </ul>
        </div>
      ) : null}
    </Panel>
  );
}
