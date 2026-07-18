export type SupabaseEnvConfig = {
  url: string;
  anonKey: string;
  projectRef: string | null;
};

export type SupabaseEnvValidation =
  | { ok: true; config: SupabaseEnvConfig; mode: 'cloud-ready' }
  | { ok: false; mode: 'local-demo'; reason: string; missing: string[] };

const readEnv = (key: string): string => {
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return typeof value === 'string' ? value.trim() : '';
};

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

  return {
    ok: true,
    mode: 'cloud-ready',
    config: { url: url.replace(/\/$/, ''), anonKey, projectRef },
  };
};

/**
 * Accessible Supabase projects observed via MCP during Slice 53 verification.
 * None match Travel Buddy — remote migrations must not be applied to these.
 */
export const ACCESSIBLE_SUPABASE_PROJECTS = [
  { id: 'iwmloenntlzyzvguwfsn', name: 'aboss-production' },
  { id: 'bmfpclozzmeekazmoaxw', name: 'ai-invoicing-app-production' },
  { id: 'wrmwthsfbpkjsxsqigpw', name: 'aleya-logo-creator' },
] as const;

export const SUPABASE_TARGET_VERIFICATION = {
  verified: false as const,
  organization: 'The Peptides Guy (axqrjaxwqjiqphdhzbcr)',
  reason:
    'No approved Travel Buddy Supabase project was found among accessible projects. Remote migrations, live Auth, Storage, and RLS were not applied to any remote database.',
  accessibleProjects: ACCESSIBLE_SUPABASE_PROJECTS.map((project) => project.name),
  localMigrationsPath: 'supabase/migrations/',
  fallbackMode: 'local-demo',
  remoteMigrationsApplied: false as const,
} as const;
