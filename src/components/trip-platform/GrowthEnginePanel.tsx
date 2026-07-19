import { useMemo, useState } from 'react';
import {
  buildDestinationLandingPage,
  buildSavingsReport,
  getReferralProgrammeFoundation,
  listAnonymousDemandInsights,
  shareableLiveDealPath,
} from '../../deal-engine';
import { Field, Panel, PrimaryButton, StatusBadge, inputClassName } from './shared/ui';

export function GrowthEnginePanel() {
  const [destination, setDestination] = useState('BCN');
  const [chosenTotal, setChosenTotal] = useState(900);
  const [alternativeTotal, setAlternativeTotal] = useState(1050);
  const referral = getReferralProgrammeFoundation();
  const insights = listAnonymousDemandInsights();
  const landing = useMemo(() => buildDestinationLandingPage({ destinationCode: destination }), [destination]);
  const savings = useMemo(
    () =>
      buildSavingsReport({
        chosenTotal,
        alternativeTotal,
        currency: 'GBP',
      }),
    [chosenTotal, alternativeTotal],
  );

  return (
    <Panel
      title="Growth & recommendation engine"
      description="Foundations for shareable deals, referrals, savings reports, and co-marketing — without fabricated testimonials or traffic."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge label={referral.enabled ? 'Referrals on' : 'Referrals foundation only'} tone="info" />
        <StatusBadge label="No fabricated savings claims" tone="warning" />
      </div>

      <section className="mb-6 space-y-3">
        <h4 className="font-semibold text-white">Destination landing page</h4>
        <Field label="Destination code" htmlFor="growth-dest">
          <input
            id="growth-dest"
            className={inputClassName}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </Field>
        <div className="rounded-xl border border-white/10 p-4 text-sm text-slate-300">
          <p className="text-lg font-semibold text-white">{landing.title}</p>
          <p className="mt-1">{landing.summary}</p>
          <p className="mt-2 text-sky-200">Path: {landing.liveDealPagePath}</p>
          <p className="text-sky-200">Shareable deal path sample: {shareableLiveDealPath('demo-deal-1')}</p>
        </div>
      </section>

      <section className="mb-6 space-y-3">
        <h4 className="font-semibold text-white">In-session savings report</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Chosen package total" htmlFor="growth-chosen">
            <input
              id="growth-chosen"
              type="number"
              className={inputClassName}
              value={chosenTotal}
              onChange={(e) => setChosenTotal(Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Alternative package total" htmlFor="growth-alt">
            <input
              id="growth-alt"
              type="number"
              className={inputClassName}
              value={alternativeTotal}
              onChange={(e) => setAlternativeTotal(Number(e.target.value) || 0)}
            />
          </Field>
        </div>
        <p className="text-sm text-slate-300">
          Estimated savings:{' '}
          {savings.estimatedSavings == null
            ? 'n/a (chosen is not cheaper)'
            : `${savings.currency} ${savings.estimatedSavings.toFixed(2)}`}
        </p>
        <p className="text-xs text-slate-500">{savings.methodology}</p>
      </section>

      <section className="mb-6 space-y-2 text-sm text-slate-300">
        <h4 className="font-semibold text-white">Referral programme</h4>
        <p>
          Prefix {referral.codePrefix} — {referral.notes}
        </p>
        <h4 className="font-semibold text-white">Post-booking trip management</h4>
        <p>
          Confirmed booking metadata from the deal-engine handoff checklist can seed itinerary items in the existing
          trip platform — no automatic payment or booking execution.
        </p>
        <h4 className="font-semibold text-white">Co-marketing / tourism-board support</h4>
        <p>
          Partner-branded landing pages are supported via optional partnerId on destination landings after approval.
          Campaign creatives stay out of product until legal review.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="font-semibold text-white">Anonymous aggregated demand insights</h4>
        <ul className="space-y-2 text-sm text-slate-300">
          {insights.map((insight) => (
            <li key={insight.routeOrDestination} className="rounded-xl border border-white/10 p-3">
              {insight.routeOrDestination}: {insight.searches ?? 'n/a'} searches — {insight.note}
            </li>
          ))}
        </ul>
        <PrimaryButton
          onClick={() => {
            /* Insights remain empty until telemetry exists — button documents the readiness surface. */
          }}
        >
          Demand insights require live telemetry
        </PrimaryButton>
      </section>
    </Panel>
  );
}
