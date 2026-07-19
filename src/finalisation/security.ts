/**
 * Slice 94 — Security hardening helpers (client-side).
 */

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const SCRIPTISH = /<\s*script|javascript:|onerror\s*=|onload\s*=|data:text\/html/i;

export function sanitizePlainText(input: string, maxLength = 5000): string {
  return input
    .replace(CONTROL_CHARS, '')
    .replace(/<[^>]*>/g, '')
    .replace(SCRIPTISH, '')
    .slice(0, maxLength);
}

export function assertNoUnsafeHtml(input: string): { ok: boolean; reason: string | null } {
  if (SCRIPTISH.test(input)) {
    return { ok: false, reason: 'Potentially unsafe HTML/script content detected.' };
  }
  if (/<iframe|<object|<embed/i.test(input)) {
    return { ok: false, reason: 'Embedded HTML objects are not allowed.' };
  }
  return { ok: true, reason: null };
}

export function validateBackupIntegrity(raw: string): { ok: boolean; message: string } {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed.schema !== 'travel-buddy-backup' && parsed.schema !== 'travel-buddy-vault-backup') {
      return { ok: false, message: 'Unsupported backup schema.' };
    }
    if (typeof parsed.backupVersion !== 'number') {
      return { ok: false, message: 'Backup version missing.' };
    }
    const htmlCheck = assertNoUnsafeHtml(raw.slice(0, 20000));
    if (!htmlCheck.ok) return { ok: false, message: htmlCheck.reason ?? 'Unsafe content' };
    return { ok: true, message: 'Backup structure looks valid for local import review.' };
  } catch {
    return { ok: false, message: 'Backup is not valid JSON.' };
  }
}

export function redactSecrets(value: string): string {
  return value
    .replace(/(api[_-]?key|secret|token|password)\s*[:=]\s*['"]?([^\s'"]+)/gi, '$1=[REDACTED]')
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[REDACTED_JWT]');
}

export function isPublicEnvKey(key: string): boolean {
  return key.startsWith('VITE_') && !/SECRET|PRIVATE|SERVICE_ROLE/i.test(key);
}

export interface SecurityReviewItem {
  id: string;
  area: string;
  status: 'pass' | 'watch' | 'fail';
  notes: string;
}

export function buildSecurityReviewChecklist(): SecurityReviewItem[] {
  return [
    {
      id: 'input-validation',
      area: 'Input validation',
      status: 'pass',
      notes: 'Plain-text sanitizers strip control chars and script-like patterns before persistence helpers.',
    },
    {
      id: 'file-validation',
      area: 'File validation',
      status: 'pass',
      notes: 'Import engine enforces extension allow-list and 2MB size cap.',
    },
    {
      id: 'xss',
      area: 'XSS protection',
      status: 'pass',
      notes: 'React text rendering by default; no dangerouSetInnerHTML in finalisation surfaces.',
    },
    {
      id: 'secrets',
      area: 'Secret protection',
      status: 'pass',
      notes: 'Only VITE_ public keys allowed in frontend env helpers; service-role keys rejected by convention.',
    },
    {
      id: 'backup-integrity',
      area: 'Backup integrity',
      status: 'pass',
      notes: 'Schema/version checks plus unsafe HTML scan on import payloads.',
    },
    {
      id: 'deps',
      area: 'Dependency audit',
      status: 'watch',
      notes: 'Run `npm audit` in CI/release; no auto-fix applied in this slice.',
    },
  ];
}
