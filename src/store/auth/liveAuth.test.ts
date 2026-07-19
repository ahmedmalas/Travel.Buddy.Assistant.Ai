import { describe, expect, it, vi } from 'vitest';
import {
  clearAuthError,
  hydrateAuthFromSession,
  liveForgotPassword,
  liveResendVerification,
  liveSignIn,
  liveSignOut,
  liveSignUp,
} from './liveAuth';
import { createDefaultAuthState } from './authShell';

describe('liveAuth local/demo fallback', () => {
  it('signs in locally when supabase client is unavailable', async () => {
    const result = await liveSignIn(createDefaultAuthState(), 'alex@example.com', 'secret12', null);
    expect(result.provider).toBe('local-demo');
    expect(result.state.mode).toBe('signed-in');
    expect(result.state.user?.email).toBe('alex@example.com');
  });

  it('rejects short passwords on sign-up with a mock client', async () => {
    const client = {
      auth: {
        signUp: vi.fn(),
      },
    } as never;
    const result = await liveSignUp(createDefaultAuthState(), 'a@b.com', '123', 'Alex', client);
    expect(result.error).toMatch(/6 characters/i);
    expect((client as { auth: { signUp: ReturnType<typeof vi.fn> } }).auth.signUp).not.toHaveBeenCalled();
  });

  it('uses supabase sign-in when client is provided', async () => {
    const client = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-1',
              email: 'live@example.com',
              email_confirmed_at: '2026-01-01T00:00:00Z',
              user_metadata: { display_name: 'Live User' },
            },
            session: {},
          },
          error: null,
        }),
      },
    } as never;

    const result = await liveSignIn(createDefaultAuthState(), 'live@example.com', 'password1', client);
    expect(result.provider).toBe('supabase');
    expect(result.emailVerified).toBe(true);
    expect(result.state.user?.displayName).toBe('Live User');
  });

  it('issues local reset tokens in demo mode', async () => {
    const result = await liveForgotPassword(createDefaultAuthState(), 'demo@travelbuddy.local', null);
    expect(result.provider).toBe('local-demo');
    expect(result.state.resetToken).toBeTruthy();
  });

  it('signs out locally and clears errors', async () => {
    const signedIn = await liveSignIn(createDefaultAuthState(), 'a@b.com', 'password1', null);
    const signedOut = await liveSignOut(signedIn.state, null);
    expect(signedOut.state.mode).toBe('signed-out');
    expect(clearAuthError({ ...signedOut.state, message: 'boom' }).message).toBeNull();
  });

  it('maps rate-limit style failures on resend verification', async () => {
    const client = {
      auth: {
        resend: vi.fn().mockResolvedValue({ error: { message: 'Rate limit exceeded' } }),
      },
    } as never;
    const result = await liveResendVerification(createDefaultAuthState(), 'a@b.com', client);
    expect(result.error).toMatch(/Too many/i);
  });

  it('requires cloud auth for verification resend in local mode', async () => {
    const result = await liveResendVerification(createDefaultAuthState(), 'a@b.com', null);
    expect(result.provider).toBe('local-demo');
    expect(result.error).toMatch(/not configured/i);
  });

  it('leaves demo-local when a supabase client has no active session', async () => {
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      },
    } as never;
    const result = await hydrateAuthFromSession(createDefaultAuthState(), client);
    expect(result.provider).toBe('supabase');
    expect(result.state.mode).toBe('signed-out');
    expect(result.state.user).toBeNull();
  });
});
