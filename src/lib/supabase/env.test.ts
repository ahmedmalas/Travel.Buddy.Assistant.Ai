import { describe, expect, it } from 'vitest';
import {
  FORBIDDEN_SUPABASE_PROJECTS,
  SUPABASE_TARGET_VERIFICATION,
  TRAVEL_BUDDY_SUPABASE_ORG,
  validateSupabaseEnv,
} from './env';

describe('validateSupabaseEnv', () => {
  it('falls back to local-demo when env is missing', () => {
    const result = validateSupabaseEnv({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.mode).toBe('local-demo');
      expect(result.missing).toContain('VITE_SUPABASE_URL');
      expect(result.missing).toContain('VITE_SUPABASE_PUBLISHABLE_KEY');
    }
  });

  it('accepts publishable key alias and a non-forbidden supabase URL while target is pending', () => {
    const result = validateSupabaseEnv({
      VITE_SUPABASE_URL: 'https://abcdefghijklmnop.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_key_123',
      VITE_SUPABASE_PROJECT_REF: 'abcdefghijklmnop',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mode).toBe('cloud-ready');
      expect(result.config.projectRef).toBe('abcdefghijklmnop');
    }
  });

  it('rejects the retired travel-buddy-production project ref', () => {
    const result = validateSupabaseEnv({
      VITE_SUPABASE_URL: 'https://farnjmgwcayvkzuaoifk.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_key_123',
    });
    expect(result.ok).toBe(false);
  });

  it('records approved org and pending project verification', () => {
    expect(SUPABASE_TARGET_VERIFICATION.verified).toBe(false);
    expect(SUPABASE_TARGET_VERIFICATION.remoteMigrationsApplied).toBe(false);
    expect(SUPABASE_TARGET_VERIFICATION.projectRef).toBeNull();
    expect(TRAVEL_BUDDY_SUPABASE_ORG.id).toBe('tasqkbrzxjralyelioyv');
    expect(TRAVEL_BUDDY_SUPABASE_ORG.expectedProjectName).toBe('aleya travel assistant');
    expect(FORBIDDEN_SUPABASE_PROJECTS.map((p) => p.id)).toContain('farnjmgwcayvkzuaoifk');
    expect(SUPABASE_TARGET_VERIFICATION.vercel.project).toBe('travel-buddy-assistant-ai');
  });
});
