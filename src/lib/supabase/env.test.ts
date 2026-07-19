import { describe, expect, it } from 'vitest';
import {
  FORBIDDEN_SUPABASE_PROJECTS,
  SUPABASE_TARGET_VERIFICATION,
  TRAVEL_BUDDY_SUPABASE_PROJECT,
  validateSupabaseEnv,
} from './env';

describe('validateSupabaseEnv', () => {
  it('falls back to local-demo when env is missing', () => {
    const result = validateSupabaseEnv({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.mode).toBe('local-demo');
      expect(result.missing).toContain('VITE_SUPABASE_URL');
      expect(result.missing).toContain('VITE_SUPABASE_ANON_KEY');
    }
  });

  it('accepts Travel Buddy project URL and publishable keys', () => {
    const result = validateSupabaseEnv({
      VITE_SUPABASE_URL: TRAVEL_BUDDY_SUPABASE_PROJECT.url,
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_test_key_123',
      VITE_SUPABASE_PROJECT_REF: TRAVEL_BUDDY_SUPABASE_PROJECT.ref,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mode).toBe('cloud-ready');
      expect(result.config.projectRef).toBe(TRAVEL_BUDDY_SUPABASE_PROJECT.ref);
    }
  });

  it('rejects non-Travel-Buddy Supabase project URLs', () => {
    const result = validateSupabaseEnv({
      VITE_SUPABASE_URL: 'https://iwmloenntlzyzvguwfsn.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_test_key_123',
    });
    expect(result.ok).toBe(false);
  });

  it('records the verified Travel Buddy production target', () => {
    expect(SUPABASE_TARGET_VERIFICATION.verified).toBe(true);
    expect(SUPABASE_TARGET_VERIFICATION.remoteMigrationsApplied).toBe(true);
    expect(SUPABASE_TARGET_VERIFICATION.projectRef).toBe(TRAVEL_BUDDY_SUPABASE_PROJECT.ref);
    expect(SUPABASE_TARGET_VERIFICATION.isolationProof.passed).toBe(true);
    expect(FORBIDDEN_SUPABASE_PROJECTS.map((p) => p.name)).toEqual([
      'aboss-production',
      'ai-invoicing-app-production',
      'aleya-logo-creator',
    ]);
  });
});
