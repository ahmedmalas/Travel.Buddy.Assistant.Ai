import { describe, expect, it } from 'vitest';
import {
  createDefaultAuthState,
  requestPasswordReset,
  resetPasswordLocal,
  signInLocal,
  signOutLocal,
  signUpLocal,
} from './authShell';

describe('authShell', () => {
  it('signs in and out locally', () => {
    const signedIn = signInLocal(createDefaultAuthState(), 'alex@example.com', 'secret1');
    expect(signedIn.mode).toBe('signed-in');
    expect(signedIn.user?.email).toBe('alex@example.com');
    const signedOut = signOutLocal(signedIn);
    expect(signedOut.mode).toBe('signed-out');
    expect(signedOut.user).toBeNull();
  });

  it('supports forgot/reset password demo flow', () => {
    const requested = requestPasswordReset(createDefaultAuthState(), 'alex@example.com');
    expect(requested.resetToken).toBeTruthy();
    const reset = resetPasswordLocal(requested, requested.resetToken!, 'new-password');
    expect(reset.screen).toBe('sign-in');
    expect(reset.resetToken).toBeNull();
  });

  it('rejects weak sign-up passwords', () => {
    const result = signUpLocal(createDefaultAuthState(), 'a@b.com', '123', 'A');
    expect(result.message).toMatch(/at least 6 characters/i);
  });
});
