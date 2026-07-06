import { useMemo } from 'react';
import { BudgetStyleSelect } from './BudgetStyleSelect';
import { interestTags, type InterestTag, type TripBriefInput, type TripBriefValidationErrors } from '../../models/trip';

type TripBriefFormProps = {
  value: TripBriefInput;
  errors: TripBriefValidationErrors;
  onChange: (next: TripBriefInput) => void;
  onSubmit: () => void;
};

function toLabel(value: string): string {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

export function TripBriefForm({ value, errors, onChange, onSubmit }: TripBriefFormProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const updateInterest = (interest: InterestTag, checked: boolean) => {
    const nextInterests = checked ? [...value.interests, interest] : value.interests.filter((item) => item !== interest);

    onChange({
      ...value,
      interests: nextInterests,
    });
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-slate-200 md:col-span-2" htmlFor="destination">
          Destination
          <input
            id="destination"
            className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-400 focus:outline-none"
            placeholder="e.g. Tokyo, Japan"
            value={value.destination}
            onChange={(event) =>
              onChange({
                ...value,
                destination: event.target.value,
              })
            }
          />
          {errors.destination ? <span className="mt-1 block text-xs text-rose-300">{errors.destination}</span> : null}
        </label>

        <label className="block text-sm text-slate-200" htmlFor="startDate">
          Start date
          <input
            id="startDate"
            type="date"
            min={today}
            className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-400 focus:outline-none"
            value={value.startDate}
            onChange={(event) =>
              onChange({
                ...value,
                startDate: event.target.value,
              })
            }
          />
          {errors.startDate ? <span className="mt-1 block text-xs text-rose-300">{errors.startDate}</span> : null}
        </label>

        <label className="block text-sm text-slate-200" htmlFor="endDate">
          End date
          <input
            id="endDate"
            type="date"
            min={value.startDate || today}
            className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-400 focus:outline-none"
            value={value.endDate}
            onChange={(event) =>
              onChange({
                ...value,
                endDate: event.target.value,
              })
            }
          />
          {errors.endDate ? <span className="mt-1 block text-xs text-rose-300">{errors.endDate}</span> : null}
        </label>

        <label className="block text-sm text-slate-200" htmlFor="travelers">
          Travelers
          <input
            id="travelers"
            type="number"
            min={1}
            className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-400 focus:outline-none"
            value={value.travelers}
            onChange={(event) =>
              onChange({
                ...value,
                travelers: Number(event.target.value),
              })
            }
          />
          {errors.travelers ? <span className="mt-1 block text-xs text-rose-300">{errors.travelers}</span> : null}
        </label>

        <label className="block text-sm text-slate-200" htmlFor="budgetStyle">
          Budget style
          <BudgetStyleSelect
            id="budgetStyle"
            value={value.budgetStyle}
            onChange={(budgetStyle) =>
              onChange({
                ...value,
                budgetStyle,
              })
            }
          />
        </label>
      </div>

      <fieldset>
        <legend className="text-sm text-slate-200">Interests</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {interestTags.map((tag) => (
            <label key={tag} className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-100">
              <input
                type="checkbox"
                checked={value.interests.includes(tag)}
                onChange={(event) => updateInterest(tag, event.target.checked)}
              />
              <span>{toLabel(tag)}</span>
            </label>
          ))}
        </div>
        {errors.interests ? <span className="mt-1 block text-xs text-rose-300">{errors.interests}</span> : null}
      </fieldset>

      <label className="block text-sm text-slate-200" htmlFor="notes">
        Extra notes (optional)
        <textarea
          id="notes"
          rows={4}
          className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-400 focus:outline-none"
          placeholder="Any must-dos, mobility needs, or travel constraints..."
          value={value.notes}
          onChange={(event) =>
            onChange({
              ...value,
              notes: event.target.value,
            })
          }
        />
      </label>

      <button
        type="submit"
        className="rounded-full border border-sky-300/60 bg-sky-400/10 px-5 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-300/20"
      >
        Generate draft plan
      </button>
    </form>
  );
}
