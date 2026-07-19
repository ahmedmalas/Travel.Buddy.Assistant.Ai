import type { TravelBuddyClient } from '../../lib/supabase/client';
import { getSupabaseClient } from '../../lib/supabase/client';
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
    return {
      state: withMessage(state, error?.message ?? 'Sign in failed.', 'signed-out'),
      provider: 'supabase',
      emailVerified: null,
      error: error?.message ?? 'Sign in failed.',
    };
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
    return {
      state: withMessage(state, 'Password must be at least 6 characters.'),
      provider: 'supabase',
      emailVerified: null,
      error: 'Password must be at least 6 characters.',
    };
  }

  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { display_name: displayName.trim() } },
  });

  if (error) {
    return {
      state: withMessage(state, error.message),
      provider: 'supabase',
      emailVerified: null,
      error: error.message,
    };
  }

  const user = data.user;
  const verified = Boolean(user?.email_confirmed_at);
  const hasSession = Boolean(data.session);

  return {
    state: {
      ...state,
      mode: hasSession ? 'signed-in' : 'signed-out',
      user: user
        ? mapUser(user.id, user.email, displayName)
        : null,
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

  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/#/trip-platform` : undefined;
  const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo });
  if (error) {
    return {
      state: withMessage(state, error.message),
      provider: 'supabase',
      emailVerified: null,
      error: error.message,
    };
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
    return {
      state: withMessage(state, 'Password must be at least 6 characters.'),
      provider: 'supabase',
      emailVerified: null,
      error: 'Password must be at least 6 characters.',
    };
  }

  const { error } = await client.auth.updateUser({ password });
  if (error) {
    return {
      state: withMessage(state, error.message),
      provider: 'supabase',
      emailVerified: null,
      error: error.message,
    };
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
    return {
      state: withMessage(state, error.message),
      provider: 'supabase',
      emailVerified: null,
      error: error.message,
    };
  }

  const user = data.session?.user;
  if (!user) {
    // Cloud Auth is configured — never remain in demo-local once the client is live.
    return {
      state: {
        ...signOutLocal(state),
        message: 'Cloud Auth ready. Sign in to sync trips.',
      },
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
