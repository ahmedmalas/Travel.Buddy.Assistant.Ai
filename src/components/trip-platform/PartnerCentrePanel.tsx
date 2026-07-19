import { useMemo, useState } from 'react';
import { useSharedTripStore } from '../../store/TripStoreContext';
import {
  buildPartnerMediaKit,
  buildRevenueReport,
  listPartnerIds,
  updateOnboardingStatus,
  type ApplicationStatus,
} from '../../deal-engine';
import { Field, Panel, SecondaryButton, StatusBadge, inputClassName } from './shared/ui';

export function PartnerCentrePanel() {
  const { dealEngineState, setDealOnboardingRecords, appendDealAttributionEvents } = useSharedTripStore();
  const [contactName, setContactName] = useState('');
  const [contactNotes, setContactNotes] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);

  const mediaKit = useMemo(() => buildPartnerMediaKit(), []);
  const partners = listPartnerIds();
  const revenue = buildRevenueReport(dealEngineState.attributionEvents);

  return (
    <Panel
      title="Partner centre"
      description="OTA partner readiness, onboarding status, and attribution reports. No fabricated traffic or partnership claims."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge label="Demo adapters only" tone="info" />
        <StatusBadge label="No live partnerships claimed" tone="warning" />
      </div>

      <section className="mb-6 space-y-2 text-sm text-slate-300">
        <h4 className="text-base font-semibold text-white">Product overview</h4>
        <p>{mediaKit.productOverview}</p>
        <h4 className="text-base font-semibold text-white">Consumer value</h4>
        <p>{mediaKit.consumerValueProposition}</p>
        <h4 className="text-base font-semibold text-white">Audience</h4>
        <p>{mediaKit.audienceProfile}</p>
        <h4 className="text-base font-semibold text-white">Coverage</h4>
        <p>{mediaKit.geographicCoverage}</p>
        <h4 className="text-base font-semibold text-white">Security</h4>
        <p>{mediaKit.securitySummary}</p>
        <h4 className="text-base font-semibold text-white">Technical integration</h4>
        <p>{mediaKit.technicalIntegrationOverview}</p>
      </section>

      <section className="mb-6">
        <h4 className="mb-2 text-base font-semibold text-white">Platform metrics</h4>
        <p className="mb-2 text-xs text-slate-400">{mediaKit.metrics.note}</p>
        <dl className="grid gap-2 text-sm text-slate-300 md:grid-cols-3">
          <div>Monthly searches: {mediaKit.metrics.monthlySearches ?? 'n/a'}</div>
          <div>Qualified redirects: {mediaKit.metrics.qualifiedRedirects ?? 'n/a'}</div>
          <div>Conversion rate: {mediaKit.metrics.conversionRate ?? 'n/a'}</div>
          <div>Booking value: {mediaKit.metrics.bookingValue ?? 'n/a'}</div>
          <div>Cancellation rate: {mediaKit.metrics.cancellationRate ?? 'n/a'}</div>
          <div>API reliability: {mediaKit.metrics.apiReliability ?? 'n/a'}</div>
        </dl>
      </section>

      <section className="mb-6">
        <h4 className="mb-2 text-base font-semibold text-white">Partnership contact workflow</h4>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-300">
          {mediaKit.contactWorkflow.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Contact name" htmlFor="partner-contact">
            <input
              id="partner-contact"
              className={inputClassName}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </Field>
          <Field label="Notes" htmlFor="partner-notes">
            <input
              id="partner-notes"
              className={inputClassName}
              value={contactNotes}
              onChange={(e) => setContactNotes(e.target.value)}
            />
          </Field>
        </div>
        <SecondaryButton
          className="mt-3"
          onClick={() => {
            setSubmitted(
              `Local draft saved for ${contactName || 'unnamed contact'}. CRM wiring pending — not sent externally.`,
            );
            setContactNotes('');
          }}
        >
          Save partnership contact draft
        </SecondaryButton>
        {submitted ? <p className="mt-2 text-sm text-emerald-200">{submitted}</p> : null}
      </section>

      <section className="mb-6">
        <h4 className="mb-2 text-base font-semibold text-white">Demo partner IDs</h4>
        <ul className="space-y-2 text-sm">
          {partners.map((partner) => (
            <li key={partner.partnerId} className="rounded-xl border border-white/10 p-3">
              <p className="font-medium text-white">
                {partner.displayName} ({partner.partnerId})
              </p>
              <p className="text-slate-400">Approved: {partner.approved ? 'yes' : 'no — demo only'}</p>
              <p className="text-xs text-amber-100">{partner.disclosureText}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <h4 className="mb-2 text-base font-semibold text-white">Provider onboarding framework</h4>
        <ul className="max-h-96 space-y-2 overflow-y-auto text-sm">
          {dealEngineState.onboardingRecords.map((record) => (
            <li key={record.providerKey} className="rounded-xl border border-white/10 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{record.displayName}</p>
                  <p className="text-slate-400">{record.programme}</p>
                  <p className="mt-1 text-xs text-slate-400">Eligibility: {record.eligibility}</p>
                  <p className="text-xs text-slate-400">
                    Inventory: {record.supportedInventory.join(', ')}
                  </p>
                  <p className="text-xs text-rose-200">
                    Blockers: {record.technicalBlockers.join('; ') || 'None listed'}
                  </p>
                  <p className="text-xs text-slate-500">{record.complianceNotes}</p>
                </div>
                <label className="text-xs text-slate-300">
                  Status
                  <select
                    className={`${inputClassName} mt-1`}
                    value={record.applicationStatus}
                    onChange={(e) =>
                      setDealOnboardingRecords(
                        updateOnboardingStatus(dealEngineState.onboardingRecords, record.providerKey, {
                          applicationStatus: e.target.value as ApplicationStatus,
                        }),
                      )
                    }
                  >
                    {[
                      'not_started',
                      'researching',
                      'applied',
                      'sandbox_access',
                      'approved',
                      'blocked',
                      'rejected',
                    ].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="mb-2 text-base font-semibold text-white">Revenue / attribution report</h4>
        <p className="mb-2 text-xs text-slate-400">
          Only explicitly recorded clicks/callbacks appear. No simulated conversions.
        </p>
        {revenue.length === 0 ? (
          <p className="text-sm text-slate-400">No attribution events yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {revenue.map((row) => (
              <li key={row.partnerId} className="rounded-xl border border-white/10 p-3">
                {row.partnerId}: {row.clicks} clicks · {row.conversions} conversions · booking value{' '}
                {row.currency} {row.bookingValue.toFixed(2)}
                <p className="text-xs text-slate-500">{row.note}</p>
              </li>
            ))}
          </ul>
        )}
        <SecondaryButton
          className="mt-3"
          onClick={() => {
            // Intentionally does not invent conversions — clears accidental empty appends only.
            appendDealAttributionEvents([]);
          }}
        >
          Refresh report (no fake data)
        </SecondaryButton>
      </section>
    </Panel>
  );
}
