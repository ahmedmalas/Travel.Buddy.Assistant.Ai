import { useEffect, useState } from 'react';
import { itineraryItemTypes, itineraryStatuses, type ItineraryItem } from '../model/types';

type ItineraryFormValues = {
  type: ItineraryItem['type'];
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  timezone: string;
  location: string;
  supplier: string;
  confirmationNumber: string;
  status: ItineraryItem['status'];
  notes: string;
  tagsText: string;
  linkedVaultItemIds: string[];
};

type VaultOption = {
  id: string;
  label: string;
};

type ItineraryFormProps = {
  mode: 'create' | 'edit';
  item?: ItineraryItem | null;
  vaultOptions: VaultOption[];
  onSubmit: (values: Omit<ItineraryItem, 'id' | 'tripId' | 'createdAt' | 'updatedAt' | 'tags'> & { tags: string[] }) => void;
  onCancelEdit: () => void;
};

const defaultFormValues: ItineraryFormValues = {
  type: 'activity',
  title: '',
  description: '',
  startDateTime: '',
  endDateTime: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  location: '',
  supplier: '',
  confirmationNumber: '',
  status: 'planned',
  notes: '',
  tagsText: '',
  linkedVaultItemIds: [],
};

function toInputDateTime(isoValue: string): string {
  if (!isoValue) return '';
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function fromInputDateTime(value: string): string {
  if (!value) return '';
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

export function ItineraryForm({ mode, item, vaultOptions, onSubmit, onCancelEdit }: ItineraryFormProps) {
  const [formValues, setFormValues] = useState<ItineraryFormValues>(defaultFormValues);

  useEffect(() => {
    if (mode === 'edit' && item) {
      setFormValues({
        type: item.type,
        title: item.title,
        description: item.description,
        startDateTime: toInputDateTime(item.startDateTime),
        endDateTime: toInputDateTime(item.endDateTime),
        timezone: item.timezone,
        location: item.location,
        supplier: item.supplier,
        confirmationNumber: item.confirmationNumber,
        status: item.status,
        notes: item.notes,
        tagsText: item.tags.join(', '),
        linkedVaultItemIds: [...item.linkedVaultItemIds],
      });
      return;
    }

    if (mode === 'create') {
      setFormValues(defaultFormValues);
    }
  }, [mode, item]);

  const startIso = fromInputDateTime(formValues.startDateTime);
  const endIso = fromInputDateTime(formValues.endDateTime);
  const isValid = Boolean(formValues.title.trim() && startIso && endIso);

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-sky-300">
        {mode === 'create' ? 'Create item' : 'Edit item'}
      </h3>
      <form
        className="grid gap-3 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!isValid) return;

          onSubmit({
            type: formValues.type,
            title: formValues.title.trim(),
            description: formValues.description.trim(),
            startDateTime: startIso,
            endDateTime: endIso,
            timezone: formValues.timezone.trim() || 'UTC',
            location: formValues.location.trim(),
            supplier: formValues.supplier.trim(),
            confirmationNumber: formValues.confirmationNumber.trim(),
            status: formValues.status,
            notes: formValues.notes.trim(),
            linkedVaultItemIds: [...formValues.linkedVaultItemIds],
            tags: formValues.tagsText
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean),
          });
          if (mode === 'create') {
            setFormValues(defaultFormValues);
          }
        }}
      >
        <label className="text-xs text-slate-300">
          Type
          <select
            value={formValues.type}
            onChange={(event) => setFormValues((prev) => ({ ...prev, type: event.target.value as ItineraryItem['type'] }))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
          >
            {itineraryItemTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-slate-300">
          Status
          <select
            value={formValues.status}
            onChange={(event) =>
              setFormValues((prev) => ({ ...prev, status: event.target.value as ItineraryItem['status'] }))
            }
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
          >
            {itineraryStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-slate-300 md:col-span-2">
          Title
          <input
            value={formValues.title}
            onChange={(event) => setFormValues((prev) => ({ ...prev, title: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            required
          />
        </label>

        <label className="text-xs text-slate-300 md:col-span-2">
          Description
          <textarea
            value={formValues.description}
            onChange={(event) => setFormValues((prev) => ({ ...prev, description: event.target.value }))}
            className="mt-1 h-20 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-xs text-slate-300">
          Start
          <input
            type="text"
            value={formValues.startDateTime}
            onChange={(event) => setFormValues((prev) => ({ ...prev, startDateTime: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            placeholder="YYYY-MM-DDTHH:mm"
            required
          />
        </label>

        <label className="text-xs text-slate-300">
          End
          <input
            type="text"
            value={formValues.endDateTime}
            onChange={(event) => setFormValues((prev) => ({ ...prev, endDateTime: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            placeholder="YYYY-MM-DDTHH:mm"
            required
          />
        </label>

        <label className="text-xs text-slate-300">
          Timezone
          <input
            value={formValues.timezone}
            onChange={(event) => setFormValues((prev) => ({ ...prev, timezone: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-xs text-slate-300">
          Location
          <input
            value={formValues.location}
            onChange={(event) => setFormValues((prev) => ({ ...prev, location: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-xs text-slate-300">
          Supplier
          <input
            value={formValues.supplier}
            onChange={(event) => setFormValues((prev) => ({ ...prev, supplier: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-xs text-slate-300">
          Confirmation number
          <input
            value={formValues.confirmationNumber}
            onChange={(event) => setFormValues((prev) => ({ ...prev, confirmationNumber: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-xs text-slate-300 md:col-span-2">
          Tags (comma-separated)
          <input
            value={formValues.tagsText}
            onChange={(event) => setFormValues((prev) => ({ ...prev, tagsText: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-xs text-slate-300 md:col-span-2">
          Notes
          <textarea
            value={formValues.notes}
            onChange={(event) => setFormValues((prev) => ({ ...prev, notes: event.target.value }))}
            className="mt-1 h-20 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
          />
        </label>

        <fieldset className="md:col-span-2 rounded-2xl border border-white/10 p-3">
          <legend className="px-2 text-xs text-slate-300">Linked Travel Vault docs</legend>
          <div className="grid gap-2 md:grid-cols-2">
            {vaultOptions.map((option) => {
              const checked = formValues.linkedVaultItemIds.includes(option.id);
              return (
                <label key={option.id} className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      setFormValues((prev) => ({
                        ...prev,
                        linkedVaultItemIds: event.target.checked
                          ? [...prev.linkedVaultItemIds, option.id]
                          : prev.linkedVaultItemIds.filter((id) => id !== option.id),
                      }));
                    }}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="md:col-span-2 flex gap-2">
          <button
            type="submit"
            className="rounded-full bg-sky-400 px-5 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
            disabled={!isValid}
          >
            {mode === 'create' ? 'Create itinerary item' : 'Save changes'}
          </button>
          {mode === 'edit' ? (
            <button
              type="button"
              className="rounded-full border border-white/20 px-5 py-2 text-sm text-slate-200"
              onClick={onCancelEdit}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
