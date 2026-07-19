/**
 * Slice 71 — Product onboarding (dismissible, local-only progress).
 */

export const ONBOARDING_STORAGE_KEY = 'travel-buddy:onboarding:v1';

export type OnboardingStepId =
  | 'welcome'
  | 'demo-trip'
  | 'create-trip'
  | 'feature-tour'
  | 'local-vs-cloud'
  | 'privacy'
  | 'import-backup';

export type OnboardingState = {
  dismissed: boolean;
  completedSteps: OnboardingStepId[];
  activeStep: OnboardingStepId;
  updatedAt: string;
};

export const ONBOARDING_STEPS: Array<{ id: OnboardingStepId; title: string; body: string }> = [
  {
    id: 'welcome',
    title: 'Welcome to Travel Buddy',
    body: 'Plan trips, organise bookings, and keep emergency details offline-first — with optional cloud when configured.',
  },
  {
    id: 'demo-trip',
    title: 'Explore the demo trip',
    body: 'Open the vault and sample itinerary to see how destinations, flights, stays, and checklists fit together.',
  },
  {
    id: 'create-trip',
    title: 'Create your first trip',
    body: 'Use Trip setup to name a trip, set dates, and save a draft. You can refine details any time.',
  },
  {
    id: 'feature-tour',
    title: 'Feature tour',
    body: 'Command centre summarises alerts; Flights/Stays/Transport cover logistics; Assistance offers rule-based tips (no external AI).',
  },
  {
    id: 'local-vs-cloud',
    title: 'Local versus cloud',
    body: 'Local/demo mode stores data in this browser. Cloud mode activates only when a verified Travel Buddy Supabase project is linked.',
  },
  {
    id: 'privacy',
    title: 'Privacy basics',
    body: 'Keep passport scans out of the app. Store metadata and private document placeholders only. Export backups before clearing data.',
  },
  {
    id: 'import-backup',
    title: 'Import an existing backup',
    body: 'Have a Travel Buddy backup? Use Import to restore vault/trip JSON without losing local drafts.',
  },
];

export const createDefaultOnboardingState = (): OnboardingState => ({
  dismissed: false,
  completedSteps: [],
  activeStep: 'welcome',
  updatedAt: new Date().toISOString(),
});

export const loadOnboardingState = (): OnboardingState => {
  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return createDefaultOnboardingState();
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      ...createDefaultOnboardingState(),
      ...parsed,
      completedSteps: Array.isArray(parsed.completedSteps)
        ? parsed.completedSteps.filter((step): step is OnboardingStepId =>
            ONBOARDING_STEPS.some((entry) => entry.id === step),
          )
        : [],
      activeStep: ONBOARDING_STEPS.some((entry) => entry.id === parsed.activeStep)
        ? (parsed.activeStep as OnboardingStepId)
        : 'welcome',
    };
  } catch {
    return createDefaultOnboardingState();
  }
};

export const persistOnboardingState = (state: OnboardingState): void => {
  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors.
  }
};

export const completeOnboardingStep = (state: OnboardingState, step: OnboardingStepId): OnboardingState => {
  const completedSteps = state.completedSteps.includes(step)
    ? state.completedSteps
    : [...state.completedSteps, step];
  const currentIndex = ONBOARDING_STEPS.findIndex((entry) => entry.id === step);
  const next = ONBOARDING_STEPS[currentIndex + 1]?.id ?? step;
  return {
    ...state,
    completedSteps,
    activeStep: next,
    updatedAt: new Date().toISOString(),
  };
};

export const dismissOnboarding = (state: OnboardingState): OnboardingState => ({
  ...state,
  dismissed: true,
  updatedAt: new Date().toISOString(),
});

export const resetOnboarding = (): OnboardingState => createDefaultOnboardingState();

export const onboardingProgress = (state: OnboardingState) => {
  const total = ONBOARDING_STEPS.length;
  const completed = state.completedSteps.length;
  return {
    total,
    completed,
    percent: Math.round((completed / total) * 100),
    remaining: Math.max(0, total - completed),
  };
};
