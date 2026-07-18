import { useState } from 'react';
import { useSharedTripStore } from '../../store/TripStoreContext';
import { Field, Panel, PrimaryButton, SecondaryButton, StatusBanner, inputClassName } from './shared/ui';

export function AuthShellPanel() {
  const {
    authState,
    authSignIn,
    authSignUp,
    authSignOut,
    authForgotPassword,
    authResetPassword,
    authEnterDemoMode,
    authSetScreen,
  } = useSharedTripStore();
  const [email, setEmail] = useState('demo@travelbuddy.local');
  const [password, setPassword] = useState('demo-demo');
  const [displayName, setDisplayName] = useState('Demo Traveller');
  const [resetToken, setResetToken] = useState('');

  return (
    <Panel
      title="Authentication shell"
      description="Local/demo auth screens only — no live auth provider is connected."
    >
      {authState.message ? <StatusBanner kind="info" message={authState.message} /> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {(['sign-in', 'sign-up', 'forgot-password', 'reset-password', 'session'] as const).map((screen) => (
          <SecondaryButton key={screen} type="button" onClick={() => authSetScreen(screen)} aria-pressed={authState.screen === screen}>
            {screen}
          </SecondaryButton>
        ))}
        <SecondaryButton type="button" onClick={() => authEnterDemoMode()}>
          Demo/local mode
        </SecondaryButton>
      </div>

      <p className="mt-4 text-sm text-slate-300">
        Mode: <span className="text-white">{authState.mode}</span>
        {authState.user ? ` · ${authState.user.displayName} (${authState.user.email})` : ' · no session user'}
      </p>

      {(authState.screen === 'sign-in' || authState.screen === 'sign-up' || authState.screen === 'forgot-password') && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Email" htmlFor="auth-email">
            <input id="auth-email" className={inputClassName} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          {authState.screen !== 'forgot-password' ? (
            <Field label="Password" htmlFor="auth-password">
              <input
                id="auth-password"
                type="password"
                className={inputClassName}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          ) : null}
          {authState.screen === 'sign-up' ? (
            <Field label="Display name" htmlFor="auth-name">
              <input id="auth-name" className={inputClassName} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </Field>
          ) : null}
        </div>
      )}

      {authState.screen === 'reset-password' ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Reset token" htmlFor="auth-token">
            <input
              id="auth-token"
              className={inputClassName}
              value={resetToken || authState.resetToken || ''}
              onChange={(e) => setResetToken(e.target.value)}
            />
          </Field>
          <Field label="New password" htmlFor="auth-new-password">
            <input
              id="auth-new-password"
              type="password"
              className={inputClassName}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {authState.screen === 'sign-in' ? (
          <PrimaryButton type="button" onClick={() => authSignIn(email, password)}>
            Sign in
          </PrimaryButton>
        ) : null}
        {authState.screen === 'sign-up' ? (
          <PrimaryButton type="button" onClick={() => authSignUp(email, password, displayName)}>
            Sign up
          </PrimaryButton>
        ) : null}
        {authState.screen === 'forgot-password' ? (
          <PrimaryButton type="button" onClick={() => authForgotPassword(email)}>
            Send reset token
          </PrimaryButton>
        ) : null}
        {authState.screen === 'reset-password' ? (
          <PrimaryButton type="button" onClick={() => authResetPassword(resetToken || authState.resetToken || '', password)}>
            Reset password
          </PrimaryButton>
        ) : null}
        {authState.screen === 'session' ? (
          <SecondaryButton type="button" onClick={() => authSignOut()}>
            Sign out
          </SecondaryButton>
        ) : null}
      </div>
    </Panel>
  );
}
