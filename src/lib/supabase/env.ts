export type SupabaseEnvConfig = {
  url: string;
  anonKey: string;
  projectRef: string | null;
};

export type SupabaseEnvValidation =
  | { ok: true; config: SupabaseEnvConfig; mode: 'cloud-ready' }
  | { ok: false; mode: 'local-demo'; reason: string; missing: string[] };

export const validateSupabaseEnv = (
  env: Record<string, string | undefined> = import.meta.env as Record<string, string | undefined>,
): SupabaseEnvValidation => {
  const url = (env.VITE_SUPABASE_URL ?? '').trim();
  const anonKey = (env.VITE_SUPABASE_ANON_KEY ?? '').trim();
  const projectRef = (env.VITE_SUPABASE_PROJECT_REF ?? '').trim() || null;
  const missing: string[] = [];
  if (!url) missing.push('VITE_SUPABASE_URL');
  if (!anonKey) missing.push('VITE_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    return {
      ok: false,
      mode: 'local-demo',
      reason: 'Supabase env is incomplete; local/demo mode remains active.',
      missing,
    };
  }

  if (!/^https:\/\/.+\.supabase\.co\/?$/.test(url) && !url.includes('127.0.0.1') && !url.includes('localhost')) {
    return {
      ok: false,
      mode: 'local-demo',
      reason: 'VITE_SUPABASE_URL must be an https://*.supabase.co URL (or local Supabase).',
      missing: ['VITE_SUPABASE_URL'],
    };
  }

  if (anonKey.startsWith('eyJ') === false && anonKey.startsWith('sb_publishable_') === false) {
    return {
      ok: false,
      mode: 'local-demo',
      reason: 'VITE_SUPABASE_ANON_KEY does not look like a publishable/anon key.',
      missing: ['VITE_SUPABASE_ANON_KEY'],
    };
  }

  if (projectRef && projectRef !== TRAVEL_BUDDY_SUPABASE_PROJECT.ref) {
    return {
      ok: false,
      mode: 'local-demo',
      reason: `VITE_SUPABASE_PROJECT_REF must be ${TRAVEL_BUDDY_SUPABASE_PROJECT.ref} (Travel Buddy production).`,
      missing: ['VITE_SUPABASE_PROJECT_REF'],
    };
  }

  if (url.includes('.supabase.co') && !url.includes(TRAVEL_BUDDY_SUPABASE_PROJECT.ref)) {
    return {
      ok: false,
      mode: 'local-demo',
      reason: 'VITE_SUPABASE_URL must point at the verified Travel Buddy project.',
      missing: ['VITE_SUPABASE_URL'],
    };
  }

  return {
    ok: true,
    mode: 'cloud-ready',
    config: { url: url.replace(/\/$/, ''), anonKey, projectRef },
  };
};

/** Dedicated Travel Buddy production project — verified 2026-07-19. */
export const TRAVEL_BUDDY_SUPABASE_PROJECT = {
  organization: 'The Peptides Guy',
  organizationId: 'axqrjaxwqjiqphdhzbcr',
  name: 'travel-buddy-production',
  ref: 'farnjmgwcayvkzuaoifk',
  region: 'ap-southeast-2',
  url: 'https://farnjmgwcayvkzuaoifk.supabase.co',
} as const;

/**
 * Forbidden projects — never apply Travel Buddy migrations or use these refs.
 */
export const FORBIDDEN_SUPABASE_PROJECTS = [
  { id: 'iwmloenntlzyzvguwfsn', name: 'aboss-production' },
  { id: 'bmfpclozzmeekazmoaxw', name: 'ai-invoicing-app-production' },
  { id: 'wrmwthsfbpkjsxsqigpw', name: 'aleya-logo-creator' },
] as const;

/** @deprecated Use FORBIDDEN_SUPABASE_PROJECTS + TRAVEL_BUDDY_SUPABASE_PROJECT */
export const ACCESSIBLE_SUPABASE_PROJECTS = [
  ...FORBIDDEN_SUPABASE_PROJECTS,
  { id: TRAVEL_BUDDY_SUPABASE_PROJECT.ref, name: TRAVEL_BUDDY_SUPABASE_PROJECT.name },
] as const;

export const SUPABASE_TARGET_VERIFICATION = {
  verified: true as const,
  organization: `${TRAVEL_BUDDY_SUPABASE_PROJECT.organization} (${TRAVEL_BUDDY_SUPABASE_PROJECT.organizationId})`,
  projectName: TRAVEL_BUDDY_SUPABASE_PROJECT.name,
  projectRef: TRAVEL_BUDDY_SUPABASE_PROJECT.ref,
  reason:
    'Dedicated Travel Buddy Supabase project travel-buddy-production (farnjmgwcayvkzuaoifk) verified. Foundation, storage, security hardening, and launch grant migrations applied. Forbidden sibling projects were not modified.',
  accessibleProjects: ACCESSIBLE_SUPABASE_PROJECTS.map((project) => project.name),
  forbiddenProjects: FORBIDDEN_SUPABASE_PROJECTS.map((project) => project.name),
  localMigrationsPath: 'supabase/migrations/',
  fallbackMode: 'local-demo',
  remoteMigrationsApplied: true as const,
  migrationsApplied: [
    'travel_buddy_foundation',
    'travel_buddy_storage',
    'travel_buddy_security_hardening',
    'travel_buddy_launch_grants',
  ] as const,
  isolationProof: {
    passed: true as const,
    checks: 9,
    summary:
      'Owner can select/update own trip+documents; stranger cannot select/update/insert; viewer collaborator can select but cannot update.',
  },
} as const;
