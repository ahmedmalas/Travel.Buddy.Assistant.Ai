import { AUTH_STORAGE_KEY } from '../storeConstants';

export type AuthMode = 'demo-local' | 'signed-out' | 'signed-in';
export type AuthScreen = 'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password' | 'session';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

export type AuthSession = {
  mode: AuthMode;
  user: AuthUser | null;
  screen: AuthScreen;
  message: string | null;
  resetToken: string | null;
  updatedAt: string;
};

export type AuthShellState = AuthSession;

const DEMO_USER: AuthUser = {
  id: 'local-demo-user',
  email: 'demo@travelbuddy.local',
  displayName: 'Demo Traveller',
};

export const createDefaultAuthState = (): AuthShellState => ({
  mode: 'demo-local',
  user: { ...DEMO_USER },
  screen: 'session',
  message: 'Running in demo/local mode (no live auth provider).',
  resetToken: null,
  updatedAt: new Date().toISOString(),
});

export const loadAuthState = (): AuthShellState => {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return createDefaultAuthState();
    const parsed = JSON.parse(raw) as Partial<AuthShellState>;
    return {
      ...createDefaultAuthState(),
      ...parsed,
      user: parsed.user ? { ...DEMO_USER, ...parsed.user } : parsed.mode === 'signed-out' ? null : { ...DEMO_USER },
    };
  } catch {
    return createDefaultAuthState();
  }
};

export const persistAuthState = (state: AuthShellState): void => {
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors; auth shell remains in memory.
  }
};

export const signInLocal = (state: AuthShellState, email: string, _password: string): AuthShellState => {
  const normalized = email.trim().toLowerCase() || DEMO_USER.email;
  return {
    ...state,
    mode: 'signed-in',
    user: {
      id: `local-${normalized}`,
      email: normalized,
      displayName: normalized.split('@')[0] || 'Traveller',
    },
    screen: 'session',
    message: 'Signed in locally (demo auth shell — no live provider).',
    resetToken: null,
    updatedAt: new Date().toISOString(),
  };
};

export const signUpLocal = (state: AuthShellState, email: string, password: string, displayName: string): AuthShellState => {
  if (!email.trim() || password.length < 6) {
    return {
      ...state,
      message: 'Sign up requires an email and a password of at least 6 characters.',
      updatedAt: new Date().toISOString(),
    };
  }
  return signInLocal(
    {
      ...state,
      message: null,
    },
    email,
    password,
  ).user
    ? {
        ...signInLocal(state, email, password),
        user: {
          id: `local-${email.trim().toLowerCase()}`,
          email: email.trim().toLowerCase(),
          displayName: displayName.trim() || email.trim().split('@')[0] || 'Traveller',
        },
        message: 'Account created in local/demo mode.',
      }
    : signInLocal(state, email, password);
};

export const signOutLocal = (state: AuthShellState): AuthShellState => ({
  ...state,
  mode: 'signed-out',
  user: null,
  screen: 'sign-in',
  message: 'Signed out of local session.',
  resetToken: null,
  updatedAt: new Date().toISOString(),
});

export const requestPasswordReset = (state: AuthShellState, email: string): AuthShellState => {
  const token = `reset-${crypto.randomUUID()}`;
  return {
    ...state,
    screen: 'reset-password',
    resetToken: token,
    message: `Password reset token issued locally for ${email.trim() || 'your account'} (demo only).`,
    updatedAt: new Date().toISOString(),
  };
};

export const resetPasswordLocal = (state: AuthShellState, token: string, password: string): AuthShellState => {
  if (!state.resetToken || token !== state.resetToken) {
    return {
      ...state,
      message: 'Reset token is invalid or expired.',
      updatedAt: new Date().toISOString(),
    };
  }
  if (password.length < 6) {
    return {
      ...state,
      message: 'Password must be at least 6 characters.',
      updatedAt: new Date().toISOString(),
    };
  }
  return {
    ...state,
    screen: 'sign-in',
    resetToken: null,
    message: 'Password updated in local/demo mode. Sign in to continue.',
    updatedAt: new Date().toISOString(),
  };
};

export const enterDemoMode = (): AuthShellState => createDefaultAuthState();

export const setAuthScreen = (state: AuthShellState, screen: AuthScreen): AuthShellState => ({
  ...state,
  screen,
  updatedAt: new Date().toISOString(),
});
