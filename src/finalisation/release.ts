/**
 * Slice 96 — Release management: version info, notes, feature flags, compatibility.
 */

import { APPLICATION_VERSION, BACKUP_VERSION, MIN_SUPPORTED_BACKUP_VERSION } from '../store/storeConstants';

export type FeatureFlagId =
  | 'dealEngine'
  | 'universalImport'
  | 'tripHealth'
  | 'offlineDegraded'
  | 'opsDashboard'
  | 'experimentalDiscoveryBoost'
  | 'experimentalVirtualVault';

export interface FeatureFlag {
  id: FeatureFlagId;
  label: string;
  description: string;
  enabled: boolean;
  experimental: boolean;
}

export interface ReleaseNote {
  version: string;
  date: string;
  highlights: string[];
}

export interface CompatibilityReport {
  applicationVersion: string;
  backupVersion: number;
  minSupportedBackupVersion: number;
  supportsBackupRange: string;
  cloudOptional: boolean;
  liveProvidersEnabled: boolean;
  notes: string[];
}

export interface MigrationReportRow {
  fromVersion: number;
  toVersion: number;
  description: string;
  status: 'supported' | 'automatic' | 'manual';
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '0.1.0',
    date: '2026-07-19',
    highlights: [
      'Slices 9–88 verified on main (platform, vault, cloud foundation, travel ops, deal engine).',
      'Slices 89–100 finalisation: import engine, trip health, offline, performance, a11y, security, analytics, release/ops.',
      'Local/demo default; no live commercial providers or payments.',
    ],
  },
];

export const DEFAULT_FEATURE_FLAGS: FeatureFlag[] = [
  {
    id: 'dealEngine',
    label: 'Super Deal Engine',
    description: 'Provider-neutral demo deal search and ranking.',
    enabled: true,
    experimental: false,
  },
  {
    id: 'universalImport',
    label: 'Universal import',
    description: 'ICS/CSV/email/PDF-text/backup import with review.',
    enabled: true,
    experimental: false,
  },
  {
    id: 'tripHealth',
    label: 'Trip Health Score',
    description: 'Full trip audit with explanations.',
    enabled: true,
    experimental: false,
  },
  {
    id: 'offlineDegraded',
    label: 'Offline degraded mode',
    description: 'Read-focused UI when network is offline.',
    enabled: true,
    experimental: false,
  },
  {
    id: 'opsDashboard',
    label: 'Operations dashboard',
    description: 'Internal health, queue, and diagnostics view.',
    enabled: true,
    experimental: false,
  },
  {
    id: 'experimentalDiscoveryBoost',
    label: 'Discovery boost (experimental)',
    description: 'Experimental ranking bias for discovery intents — off by default.',
    enabled: false,
    experimental: true,
  },
  {
    id: 'experimentalVirtualVault',
    label: 'Virtualised vault (experimental)',
    description: 'Use virtual windows for very large vault lists.',
    enabled: true,
    experimental: true,
  },
];

export const FEATURE_FLAGS_STORAGE_KEY = 'travel-buddy:feature-flags:v1';

export function loadFeatureFlags(): FeatureFlag[] {
  try {
    const raw = window.localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
    if (!raw) return DEFAULT_FEATURE_FLAGS.map((flag) => ({ ...flag }));
    const parsed = JSON.parse(raw) as Array<{ id: FeatureFlagId; enabled: boolean }>;
    return DEFAULT_FEATURE_FLAGS.map((flag) => {
      const override = parsed.find((entry) => entry.id === flag.id);
      return override ? { ...flag, enabled: Boolean(override.enabled) } : { ...flag };
    });
  } catch {
    return DEFAULT_FEATURE_FLAGS.map((flag) => ({ ...flag }));
  }
}

export function persistFeatureFlags(flags: FeatureFlag[]): void {
  try {
    window.localStorage.setItem(
      FEATURE_FLAGS_STORAGE_KEY,
      JSON.stringify(flags.map((flag) => ({ id: flag.id, enabled: flag.enabled }))),
    );
  } catch {
    // ignore
  }
}

export function setFeatureFlag(flags: FeatureFlag[], id: FeatureFlagId, enabled: boolean): FeatureFlag[] {
  return flags.map((flag) => (flag.id === id ? { ...flag, enabled } : flag));
}

export function buildCompatibilityReport(): CompatibilityReport {
  return {
    applicationVersion: APPLICATION_VERSION,
    backupVersion: BACKUP_VERSION,
    minSupportedBackupVersion: MIN_SUPPORTED_BACKUP_VERSION,
    supportsBackupRange: `v${MIN_SUPPORTED_BACKUP_VERSION}–v${BACKUP_VERSION}`,
    cloudOptional: true,
    liveProvidersEnabled: false,
    notes: [
      'Cloud features activate only with a verified Travel Buddy Supabase project.',
      'Deal engine adapters remain mock/demo until credentials + approval.',
      'Payments and automatic booking are disabled.',
    ],
  };
}

export function buildMigrationReport(): MigrationReportRow[] {
  return [
    { fromVersion: 2, toVersion: 3, description: 'Trip platform fields', status: 'automatic' },
    { fromVersion: 3, toVersion: 4, description: 'Vault / templates', status: 'automatic' },
    { fromVersion: 4, toVersion: 5, description: 'Travel ops collections', status: 'automatic' },
    { fromVersion: 5, toVersion: 6, description: 'Deal engine backup embedding', status: 'automatic' },
    { fromVersion: 6, toVersion: 7, description: 'Finalisation analytics/flags metadata', status: 'automatic' },
  ];
}

export function getVersionInfo() {
  return {
    applicationVersion: APPLICATION_VERSION,
    backupVersion: BACKUP_VERSION,
    releaseNotes: RELEASE_NOTES,
  };
}
