import { describe, expect, it } from 'vitest';
import { SUPABASE_TARGET_VERIFICATION, validateSupabaseEnv } from './env';

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

  it('accepts publishable anon keys and supabase URLs', () => {
    const result = validateSupabaseEnv({
      VITE_SUPABASE_URL: 'https://abcd.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'sb_publishable_test_key_123',
      VITE_SUPABASE_PROJECT_REF: 'abcd',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mode).toBe('cloud-ready');
      expect(result.config.projectRef).toBe('abcd');
    }
  });

  it('records that the Travel Buddy target is unverified', () => {
    expect(SUPABASE_TARGET_VERIFICATION.verified).toBe(false);
    expect(SUPABASE_TARGET_VERIFICATION.remoteMigrationsApplied ?? false).toBe(false);
    expect(SUPABASE_TARGET_VERIFICATION.accessibleProjects.length).toBeGreaterThan(0);
  });
});
