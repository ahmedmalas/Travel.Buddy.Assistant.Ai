import type { DraftPlan } from '../../models/trip';

type DraftPlanViewProps = {
  plan: DraftPlan | null;
};

function toLabel(value: string): string {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

export function DraftPlanView({ plan }: DraftPlanViewProps) {
  if (!plan) {
    return (
      <div className="rounded-3xl border border-dashed border-white/20 bg-slate-900/40 p-6 text-sm text-slate-300">
        Submit a trip brief to generate your first draft plan.
      </div>
    );
  }

  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-slate-950/20">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">Draft plan</p>
      <h3 className="mt-4 text-2xl font-bold text-white">{plan.title}</h3>
      <p className="mt-2 text-sm text-slate-300">
        {plan.travelers} traveler{plan.travelers === 1 ? '' : 's'} • {toLabel(plan.budgetStyle)} budget • {toLabel(plan.dailyPace)} pace
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section>
          <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-200">Trip pillars</h4>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-200">
            {plan.tripPillars.map((pillar) => (
              <li key={pillar}>{pillar}</li>
            ))}
          </ul>
        </section>
        <section>
          <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-200">Next steps</h4>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-200">
            {plan.nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-6">
        <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-200">Assumptions</h4>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
          {plan.assumptions.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
