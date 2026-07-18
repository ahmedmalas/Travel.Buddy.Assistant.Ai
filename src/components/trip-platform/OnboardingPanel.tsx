import { useSharedTripStore } from '../../store/TripStoreContext';
import { ONBOARDING_STEPS, type OnboardingStepId } from '../../store/onboarding';
import { EmptyState, Panel, PrimaryButton, SecondaryButton, StatusBanner, StatusBadge } from './shared/ui';

type OnboardingPanelProps = {
  onNavigate?: (tab: string) => void;
};

export function OnboardingPanel({ onNavigate }: OnboardingPanelProps) {
  const {
    onboardingState,
    completeOnboardingStep,
    dismissOnboarding,
    resetOnboarding,
    onboardingProgress,
  } = useSharedTripStore();

  const progress = onboardingProgress ?? { total: ONBOARDING_STEPS.length, completed: 0, percent: 0, remaining: ONBOARDING_STEPS.length };
  const activeStep = ONBOARDING_STEPS.find((step) => step.id === onboardingState.activeStep) ?? ONBOARDING_STEPS[0];

  const isStepComplete = (stepId: OnboardingStepId) => onboardingState.completedSteps.includes(stepId);

  if (onboardingState.dismissed) {
    return (
      <Panel title="Product onboarding" description="Getting started guide for Travel Buddy.">
        <EmptyState title="Onboarding dismissed" body="Reset onboarding to walk through setup steps again." />
        <PrimaryButton type="button" className="mt-4" onClick={() => resetOnboarding()}>
          Reset onboarding
        </PrimaryButton>
      </Panel>
    );
  }

  return (
    <Panel
      title="Product onboarding"
      description="Step through Travel Buddy setup — demo trip, privacy basics, and optional backup import."
      actions={
        <SecondaryButton type="button" onClick={() => dismissOnboarding()}>
          Dismiss
        </SecondaryButton>
      }
    >
      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <p className="text-sm text-slate-300">
          Progress: <span className="font-semibold text-white">{progress.percent}%</span> ({progress.completed}/{progress.total} steps)
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-sky-400 transition-all" style={{ width: `${progress.percent}%` }} />
        </div>
      </div>

      <article className="mt-4 rounded-2xl border border-sky-300/30 bg-sky-500/10 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-sky-200">Active step</p>
        <p className="mt-1 text-lg font-medium text-white">{activeStep.title}</p>
        <p className="mt-2 text-sm text-slate-200">{activeStep.body}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <PrimaryButton
            type="button"
            disabled={isStepComplete(activeStep.id)}
            onClick={() => completeOnboardingStep(activeStep.id)}
          >
            Complete step
          </PrimaryButton>
          {activeStep.id === 'import-backup' && onNavigate ? (
            <SecondaryButton type="button" onClick={() => onNavigate('import')}>
              Jump to Import
            </SecondaryButton>
          ) : null}
        </div>
      </article>

      <div className="mt-6 space-y-2">
        {ONBOARDING_STEPS.map((step) => (
          <div
            key={step.id}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
              step.id === onboardingState.activeStep ? 'border-sky-300/30 bg-sky-500/5' : 'border-white/10 bg-slate-950/30'
            }`}
          >
            <div>
              <p className="text-sm font-medium text-white">{step.title}</p>
              <p className="text-xs text-slate-400">{step.body}</p>
            </div>
            <StatusBadge label={isStepComplete(step.id) ? 'done' : step.id === onboardingState.activeStep ? 'active' : 'pending'} tone={isStepComplete(step.id) ? 'success' : 'neutral'} />
          </div>
        ))}
      </div>

      {progress.remaining === 0 ? (
        <div className="mt-4">
          <StatusBanner kind="success" message="All onboarding steps complete. You can dismiss this guide any time." />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <SecondaryButton type="button" onClick={() => resetOnboarding()}>
          Reset onboarding
        </SecondaryButton>
      </div>
    </Panel>
  );
}
