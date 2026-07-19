import { describe, expect, it } from 'vitest';
import {
  completeOnboardingStep,
  createDefaultOnboardingState,
  dismissOnboarding,
  onboardingProgress,
} from './onboarding';

describe('onboarding', () => {
  it('tracks progress and dismissal', () => {
    const started = createDefaultOnboardingState();
    expect(onboardingProgress(started).percent).toBe(0);
    const next = completeOnboardingStep(started, 'welcome');
    expect(next.completedSteps).toContain('welcome');
    expect(next.activeStep).toBe('demo-trip');
    expect(onboardingProgress(next).completed).toBe(1);
    expect(dismissOnboarding(next).dismissed).toBe(true);
  });
});
