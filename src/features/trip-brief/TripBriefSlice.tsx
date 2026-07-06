import { useMemo, useState } from 'react';
import { DraftPlanView } from '../../components/trip/DraftPlanView';
import { TripBriefForm } from '../../components/trip/TripBriefForm';
import type { DraftPlan, TripBriefInput, TripBriefValidationErrors } from '../../models/trip';
import { mapTripBriefToDraftPlan } from './tripBrief.mapper';
import { hasTripBriefErrors, validateTripBrief } from './tripBrief.validation';

const defaultTripBrief: TripBriefInput = {
  destination: '',
  startDate: '',
  endDate: '',
  travelers: 1,
  budgetStyle: 'moderate',
  interests: [],
  notes: '',
};

export function TripBriefSlice() {
  const [tripBrief, setTripBrief] = useState<TripBriefInput>(defaultTripBrief);
  const [errors, setErrors] = useState<TripBriefValidationErrors>({});
  const [draftPlan, setDraftPlan] = useState<DraftPlan | null>(null);

  const hasResults = useMemo(() => draftPlan !== null, [draftPlan]);

  const handleSubmit = () => {
    const nextErrors = validateTripBrief(tripBrief);
    setErrors(nextErrors);

    if (hasTripBriefErrors(nextErrors)) {
      return;
    }

    setDraftPlan(mapTripBriefToDraftPlan(tripBrief));
  };

  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-sky-300">First functional slice</p>
        <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">Trip brief to draft plan</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Capture traveler intent, validate the brief, and generate a structured draft plan without claiming live provider inventory.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-slate-950/20">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">Trip brief form</p>
          <h3 className="mt-3 text-xl font-semibold text-white">Tell the assistant what you want from this trip</h3>
          <div className="mt-6">
            <TripBriefForm value={tripBrief} errors={errors} onChange={setTripBrief} onSubmit={handleSubmit} />
          </div>
        </div>
        <div>
          <DraftPlanView plan={draftPlan} />
          {hasResults ? (
            <p className="mt-3 text-xs text-slate-400">This draft plan is generated locally and meant as a planning baseline.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
