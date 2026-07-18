import { useState } from 'react';
import { useSharedTripStore } from '../../store/TripStoreContext';
import { CHECKLIST_CATEGORIES, type ChecklistCategory, type ChecklistItem } from '../../store/travelOpsDomain';
import {
  EmptyState,
  Field,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatusBanner,
  StatusBadge,
  inputClassName,
} from './shared/ui';

const createChecklistItem = (): ChecklistItem => ({
  id: crypto.randomUUID(),
  title: '',
  category: 'custom',
  deadline: '',
  ownerName: '',
  completed: false,
  notes: '',
});

export function ChecklistCentrePanel() {
  const {
    activeVaultTrip,
    upsertChecklistItem,
    deleteChecklistItem,
    applyPreDepartureChecklistTemplate,
    canEditTrip,
  } = useSharedTripStore();
  const items = activeVaultTrip.checklistItems ?? [];
  const completedCount = items.filter((item) => item.completed).length;
  const progressPercent = items.length === 0 ? 0 : Math.round((completedCount / items.length) * 100);
  const [draft, setDraft] = useState<ChecklistItem>(createChecklistItem());
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSave = () => {
    if (!draft.title.trim()) {
      setFeedback('Checklist title is required.');
      return;
    }
    upsertChecklistItem(draft);
    setDraft(createChecklistItem());
    setFeedback('Checklist item saved.');
  };

  const toggleCompleted = (item: ChecklistItem) => {
    if (!canEditTrip) return;
    upsertChecklistItem({ ...item, completed: !item.completed });
  };

  return (
    <Panel
      title="Checklist centre"
      description="Pre-departure tasks with categories, deadlines, and owners. Apply the template to seed visa, passport, and transport essentials."
      actions={
        <PrimaryButton
          type="button"
          disabled={!canEditTrip}
          onClick={() => {
            applyPreDepartureChecklistTemplate();
            setFeedback('Pre-departure template applied.');
          }}
        >
          Apply pre-departure template
        </PrimaryButton>
      }
    >
      {feedback ? <StatusBanner kind="info" message={feedback} /> : null}

      <div className="mt-2 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <p className="text-sm text-slate-300">
          Progress: <span className="font-semibold text-white">{progressPercent}%</span> ({completedCount}/{items.length} complete)
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-sky-400 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Title" htmlFor="checklist-title">
          <input id="checklist-title" className={inputClassName} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </Field>
        <Field label="Category" htmlFor="checklist-category">
          <select
            id="checklist-category"
            className={inputClassName}
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value as ChecklistCategory })}
          >
            {CHECKLIST_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Deadline" htmlFor="checklist-deadline">
          <input id="checklist-deadline" type="date" className={inputClassName} value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} />
        </Field>
        <Field label="Owner" htmlFor="checklist-owner">
          <input id="checklist-owner" className={inputClassName} value={draft.ownerName} onChange={(e) => setDraft({ ...draft, ownerName: e.target.value })} />
        </Field>
        <Field label="Completed" htmlFor="checklist-completed">
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              id="checklist-completed"
              type="checkbox"
              checked={draft.completed}
              onChange={(e) => setDraft({ ...draft, completed: e.target.checked })}
            />
            Mark complete
          </label>
        </Field>
        <div className="md:col-span-2 xl:col-span-3">
          <Field label="Notes" htmlFor="checklist-notes">
            <textarea id="checklist-notes" rows={2} className={inputClassName} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </Field>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <PrimaryButton type="button" disabled={!canEditTrip} onClick={handleSave}>
          Save item
        </PrimaryButton>
        <SecondaryButton type="button" onClick={() => setDraft(createChecklistItem())}>
          Reset form
        </SecondaryButton>
      </div>

      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <EmptyState title="No checklist items" body="Add tasks manually or apply the pre-departure template to get started." />
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className={`rounded-2xl border p-4 ${item.completed ? 'border-emerald-300/20 bg-emerald-500/5' : 'border-white/10 bg-slate-950/40'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={item.completed}
                    disabled={!canEditTrip}
                    onChange={() => toggleCompleted(item)}
                    aria-label={`Mark ${item.title} complete`}
                  />
                  <div>
                    <p className={`font-medium ${item.completed ? 'text-emerald-100 line-through' : 'text-white'}`}>{item.title}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <StatusBadge label={item.category} tone="info" />
                      {item.deadline ? <StatusBadge label={item.deadline} tone="warning" /> : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      {item.ownerName ? `Owner: ${item.ownerName}` : 'Unassigned'}
                      {item.notes ? ` · ${item.notes}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <SecondaryButton type="button" onClick={() => setDraft(item)}>
                    Edit
                  </SecondaryButton>
                  <SecondaryButton type="button" disabled={!canEditTrip} onClick={() => deleteChecklistItem(item.id)}>
                    Delete
                  </SecondaryButton>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </Panel>
  );
}
