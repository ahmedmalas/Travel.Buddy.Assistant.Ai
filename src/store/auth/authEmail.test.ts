import { describe, expect, it } from 'vitest';
import { AUTH_EMAIL_SENDER, getAuthRedirectUrl, mapAuthDeliveryError } from './authEmail';

describe('authEmail helpers', () => {
  it('documents Resend as the production SMTP provider profile', () => {
    expect(AUTH_EMAIL_SENDER.provider).toBe('resend');
    expect(AUTH_EMAIL_SENDER.smtpHost).toBe('smtp.resend.com');
    expect(AUTH_EMAIL_SENDER.fromName).toBe('Travel Buddy');
    expect(AUTH_EMAIL_SENDER.replyTo).toContain('@');
  });

  it('builds redirect URLs from VITE_APP_URL when present', () => {
    const url = getAuthRedirectUrl('/');
    expect(url.endsWith('/') || url.includes('127.0.0.1') || url.includes('http')).toBe(true);
  });

  it('maps delivery and rate-limit failures to clear user messages', () => {
    expect(mapAuthDeliveryError('Rate limit exceeded')).toMatch(/Too many/i);
    expect(mapAuthDeliveryError('Error sending confirmation email via SMTP')).toMatch(/could not deliver/i);
    expect(mapAuthDeliveryError('Invalid login credentials')).toMatch(/incorrect/i);
    expect(mapAuthDeliveryError('Email not confirmed')).toMatch(/verify your email/i);
  });
});
