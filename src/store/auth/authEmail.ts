/** Production auth email helpers — redirect URLs, error mapping, verification resend. */

export const AUTH_EMAIL_SENDER = {
  fromName: 'Travel Buddy',
  fromEmail: 'noreply@mail.travelbuddy.app',
  replyTo: 'support@travelbuddy.app',
  provider: 'resend',
  smtpHost: 'smtp.resend.com',
  smtpPort: 587,
} as const;

export function getAuthRedirectUrl(path = '/'): string {
  const configured = (import.meta.env.VITE_APP_URL as string | undefined)?.trim();
  if (configured) {
    return `${configured.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
  }
  return `http://127.0.0.1:5173${path.startsWith('/') ? path : `/${path}`}`;
}

export function mapAuthDeliveryError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many authentication emails were requested. Wait a few minutes, then try again.';
  }
  if (lower.includes('email not confirmed') || lower.includes('not confirmed')) {
    return 'Please verify your email before signing in. You can resend the verification email below.';
  }
  if (lower.includes('user already') || lower.includes('already registered')) {
    return 'An account with this email already exists. Sign in or reset your password.';
  }
  if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
    return 'Email or password is incorrect.';
  }
  if (lower.includes('smtp') || lower.includes('error sending confirmation email') || lower.includes('error sending recovery')) {
    return 'We could not deliver that email. Check the address, then retry. If it keeps failing, contact support.';
  }
  return message;
}
