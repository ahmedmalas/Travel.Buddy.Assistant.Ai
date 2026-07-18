import { useState } from 'react';
import { useSharedTripStore } from '../../store/TripStoreContext';
import { EmptyState, Field, Panel, PrimaryButton, SecondaryButton, StatusBanner, inputClassName } from './shared/ui';

export function TripTemplatesPanel() {
  const {
    templates,
    visibleTemplates,
    saveTripAsTemplate,
    createTripFromTemplate,
    deleteTripTemplate,
    vaultQuery,
    setVaultQuery,
  } = useSharedTripStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <Panel title="Trip templates" description="Save reusable trip scaffolds or start from defaults.">
      {feedback ? <StatusBanner kind="info" message={feedback} /> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field label="Template name" htmlFor="template-name">
          <input id="template-name" className={inputClassName} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Description" htmlFor="template-description">
          <input
            id="template-description"
            className={inputClassName}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <PrimaryButton
          type="button"
          onClick={() => {
            const template = saveTripAsTemplate(name || 'Saved trip template', description);
            setFeedback(`Saved template: ${template.name}`);
            setName('');
            setDescription('');
          }}
        >
          Save current trip as template
        </PrimaryButton>
      </div>

      <div className="mt-6">
        <Field label="Filter templates" htmlFor="template-filter">
          <input
            id="template-filter"
            className={inputClassName}
            value={vaultQuery}
            onChange={(e) => setVaultQuery(e.target.value)}
            placeholder="Search templates…"
          />
        </Field>
      </div>

      <div className="mt-4 space-y-3">
        {visibleTemplates.length === 0 ? (
          <EmptyState title="No templates" body="Save the current trip or clear the filter." />
        ) : (
          visibleTemplates.map((template) => (
            <article key={template.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">
                    {template.name}
                    {template.isDefault ? ' · default' : ''}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">{template.description || 'No description'}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {template.snapshot.stops.length} itinerary item(s) · budget {template.snapshot.budget}{' '}
                    {template.snapshot.currency}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <PrimaryButton
                    type="button"
                    onClick={() => {
                      const result = createTripFromTemplate(template.id);
                      setFeedback(result.message);
                    }}
                  >
                    Create trip
                  </PrimaryButton>
                  {!template.isDefault ? (
                    <SecondaryButton
                      type="button"
                      onClick={() => {
                        const result = deleteTripTemplate(template.id);
                        setFeedback(result.message);
                      }}
                    >
                      Delete
                    </SecondaryButton>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
      <p className="mt-3 text-xs text-slate-500">{templates.length} template(s) available</p>
    </Panel>
  );
}
