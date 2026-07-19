import type { TravelBuddyClient } from '../../lib/supabase/client';
import { getSupabaseClient } from '../../lib/supabase/client';
import { getAuthRedirectUrl, mapAuthDeliveryError } from './authEmail';
import {
  createDefaultAuthState,
  enterDemoMode,
  requestPasswordReset,
  resetPasswordLocal,
  setAuthScreen,
  signInLocal,
  signOutLocal,
  signUpLocal,
  type AuthShellState,
  type AuthUser,
} from './authShell';

export type LiveAuthResult = {
  state: AuthShellState;
  provider: 'supabase' | 'local-demo';
  emailVerified: boolean | null;
  error: string | null;
};

const mapUser = (id: string, email: string | undefined, displayName?: string | null): AuthUser => ({
  id,
  email: email ?? '',
  displayName: displayName?.trim() || (email ? email.split('@')[0] : 'Traveller') || 'Traveller',
});

const withMessage = (state: AuthShellState, message: string, mode?: AuthShellState['mode']): AuthShellState => ({
  ...state,
  mode: mode ?? state.mode,
  message,
  updatedAt: new Date().toISOString(),
});

const failAuth = (state: AuthShellState, message: string, mode?: AuthShellState['mode']): LiveAuthResult => {
  const mapped = mapAuthDeliveryError(message);
  return {
    state: withMessage(state, mapped, mode),
    provider: 'supabase',
    emailVerified: null,
    error: mapped,
  };
};

export const clearAuthError = (state: AuthShellState): AuthShellState => ({
  ...state,
  message: null,
  updatedAt: new Date().toISOString(),
});

export async function liveSignIn(
  state: AuthShellState,
  email: string,
  password: string,
  client: TravelBuddyClient | null = getSupabaseClient(),
): Promise<LiveAuthResult> {
  if (!client) {
    return {
      state: signInLocal(state, email, password),
      provider: 'local-demo',
      emailVerified: null,
      error: null,
    };
  }

  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.user) {
    return failAuth(state, error?.message ?? 'Sign in failed.', 'signed-out');
  }

  const verified = Boolean(data.user.email_confirmed_at);
  return {
    state: {
      ...state,
      mode: 'signed-in',
      user: mapUser(
        data.user.id,
        data.user.email,
        (data.user.user_metadata?.display_name as string | undefined) ?? null,
      ),
      screen: 'session',
      message: verified
        ? 'Signed in with Supabase Auth.'
        : 'Signed in — email verification is still pending.',
      resetToken: null,
      updatedAt: new Date().toISOString(),
    },
    provider: 'supabase',
    emailVerified: verified,
    error: null,
  };
}

export async function liveSignUp(
  state: AuthShellState,
  email: string,
  password: string,
  displayName: string,
  client: TravelBuddyClient | null = getSupabaseClient(),
): Promise<LiveAuthResult> {
  if (!client) {
    return {
      state: signUpLocal(state, email, password, displayName),
      provider: 'local-demo',
      emailVerified: null,
      error: null,
    };
  }

  if (password.length < 6) {
    return failAuth(state, 'Password must be at least 6 characters.');
  }

  const emailRedirectTo = getAuthRedirectUrl('/');
  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { display_name: displayName.trim() },
      emailRedirectTo,
    },
  });

  if (error) {
    return failAuth(state, error.message);
  }

  const user = data.user;
  const verified = Boolean(user?.email_confirmed_at);
  const hasSession = Boolean(data.session);

  return {
    state: {
      ...state,
      mode: hasSession ? 'signed-in' : 'signed-out',
      user: user ? mapUser(user.id, user.email, displayName) : null,
      screen: hasSession ? 'session' : 'sign-in',
      message: hasSession
        ? verified
          ? 'Account created and signed in.'
          : 'Account created. Please verify your email to complete setup.'
        : 'Account created. Check your email to verify, then sign in.',
      resetToken: null,
      updatedAt: new Date().toISOString(),
    },
    provider: 'supabase',
    emailVerified: user ? verified : false,
    error: null,
  };
}

export async function liveResendVerification(
  state: AuthShellState,
  email: string,
  client: TravelBuddyClient | null = getSupabaseClient(),
): Promise<LiveAuthResult> {
  if (!client) {
    return {
      state: withMessage(state, 'Verification email is only available when cloud Auth is configured.'),
      provider: 'local-demo',
      emailVerified: null,
      error: 'Cloud Auth is not configured.',
    };
  }

  const trimmed = email.trim();
  if (!trimmed) {
    return failAuth(state, 'Enter the email address to resend verification.');
  }

  const { error } = await client.auth.resend({
    type: 'signup',
    email: trimmed,
    options: { emailRedirectTo: getAuthRedirectUrl('/') },
  });

  if (error) {
    return failAuth(state, error.message);
  }

  return {
    state: withMessage(state, `Verification email resent to ${trimmed}.`),
    provider: 'supabase',
    emailVerified: false,
    error: null,
  };
}

export async function liveSignOut(
  state: AuthShellState,
  client: TravelBuddyClient | null = getSupabaseClient(),
): Promise<LiveAuthResult> {
  if (client) {
    const { error } = await client.auth.signOut();
    if (error) {
      return {
        state: withMessage(signOutLocal(state), `Signed out locally; remote sign-out reported: ${error.message}`),
        provider: 'supabase',
        emailVerified: null,
        error: error.message,
      };
    }
  }
  return {
    state: signOutLocal(state),
    provider: client ? 'supabase' : 'local-demo',
    emailVerified: null,
    error: null,
  };
}

export async function liveForgotPassword(
  state: AuthShellState,
  email: string,
  client: TravelBuddyClient | null = getSupabaseClient(),
): Promise<LiveAuthResult> {
  if (!client) {
    return {
      state: requestPasswordReset(state, email),
      provider: 'local-demo',
      emailVerified: null,
      error: null,
    };
  }

  const redirectTo = getAuthRedirectUrl('/');
  const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo });
  if (error) {
    return failAuth(state, error.message);
  }

  return {
    state: {
      ...state,
      screen: 'reset-password',
      message: `Password reset email sent to ${email.trim()}.`,
      updatedAt: new Date().toISOString(),
    },
    provider: 'supabase',
    emailVerified: null,
    error: null,
  };
}

export async function liveResetPassword(
  state: AuthShellState,
  token: string,
  password: string,
  client: TravelBuddyClient | null = getSupabaseClient(),
): Promise<LiveAuthResult> {
  if (!client) {
    return {
      state: resetPasswordLocal(state, token, password),
      provider: 'local-demo',
      emailVerified: null,
      error: null,
    };
  }

  if (password.length < 6) {
    return failAuth(state, 'Password must be at least 6 characters.');
  }

  const { error } = await client.auth.updateUser({ password });
  if (error) {
    return failAuth(state, error.message);
  }

  return {
    state: {
      ...state,
      screen: 'sign-in',
      resetToken: null,
      message: 'Password updated. Sign in with your new password.',
      updatedAt: new Date().toISOString(),
    },
    provider: 'supabase',
    emailVerified: null,
    error: null,
  };
}

export async function hydrateAuthFromSession(
  state: AuthShellState,
  client: TravelBuddyClient | null = getSupabaseClient(),
): Promise<LiveAuthResult> {
  if (!client) {
    return { state, provider: 'local-demo', emailVerified: null, error: null };
  }

  const { data, error } = await client.auth.getSession();
  if (error) {
    return failAuth(state, error.message);
  }

  const user = data.session?.user;
  if (!user) {
    return {
      state: state.mode === 'demo-local' ? state : signOutLocal(state),
      provider: 'supabase',
      emailVerified: null,
      error: null,
    };
  }

  const verified = Boolean(user.email_confirmed_at);
  return {
    state: {
      ...state,
      mode: 'signed-in',
      user: mapUser(
        user.id,
        user.email,
        (user.user_metadata?.display_name as string | undefined) ?? null,
      ),
      screen: 'session',
      message: verified ? 'Session restored from Supabase.' : 'Session restored — email verification pending.',
      updatedAt: new Date().toISOString(),
    },
    provider: 'supabase',
    emailVerified: verified,
    error: null,
  };
}

export { enterDemoMode, setAuthScreen, createDefaultAuthState };
export { AUTH_EMAIL_SENDER, getAuthRedirectUrl, mapAuthDeliveryError } from './authEmail';
