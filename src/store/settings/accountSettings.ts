import type { TravelBuddyClient } from '../../lib/supabase/client';
import { getSupabaseClient } from '../../lib/supabase/client';
import { STORAGE_KEYS } from '../storeConstants';

export type NotificationPreferences = {
  departures: boolean;
  documentExpiry: boolean;
  unpaidExpenses: boolean;
  bookingReminders: boolean;
  itineraryConflicts: boolean;
  packingDeadlines: boolean;
};

export type AccountSettings = {
  displayName: string;
  email: string;
  currency: string;
  timezone: string;
  notificationPreferences: NotificationPreferences;
  updatedAt: string;
};

export type AccountSettingsResult<T> = { ok: true; value: T } | { ok: false; message: string };

export const ACCOUNT_SETTINGS_STORAGE_KEY = 'travel-buddy:account-settings:v1';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  departures: true,
  documentExpiry: true,
  unpaidExpenses: true,
  bookingReminders: true,
  itineraryConflicts: true,
  packingDeadlines: true,
};

export const createDefaultAccountSettings = (): AccountSettings => ({
  displayName: 'Demo Traveller',
  email: 'demo@travelbuddy.local',
  currency: 'USD',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES },
  updatedAt: new Date().toISOString(),
});

export const loadAccountSettings = (): AccountSettings => {
  try {
    const raw = window.localStorage.getItem(ACCOUNT_SETTINGS_STORAGE_KEY);
    if (!raw) return createDefaultAccountSettings();
    const parsed = JSON.parse(raw) as Partial<AccountSettings>;
    return {
      ...createDefaultAccountSettings(),
      ...parsed,
      notificationPreferences: {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(parsed.notificationPreferences ?? {}),
      },
    };
  } catch {
    return createDefaultAccountSettings();
  }
};

export const persistAccountSettings = (settings: AccountSettings): void => {
  try {
    window.localStorage.setItem(ACCOUNT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore quota errors.
  }
};

export const updateAccountSettings = (
  current: AccountSettings,
  patch: Partial<Omit<AccountSettings, 'updatedAt' | 'notificationPreferences'>> & {
    notificationPreferences?: Partial<NotificationPreferences>;
  },
): AccountSettings => ({
  ...current,
  ...patch,
  notificationPreferences: {
    ...current.notificationPreferences,
    ...(patch.notificationPreferences ?? {}),
  },
  updatedAt: new Date().toISOString(),
});

export async function syncAccountSettingsToCloud(
  settings: AccountSettings,
  client: TravelBuddyClient | null = getSupabaseClient(),
): Promise<AccountSettingsResult<AccountSettings>> {
  persistAccountSettings(settings);
  if (!client) {
    return { ok: true, value: settings };
  }
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) {
    return { ok: false, message: 'Sign in required to sync account settings.' };
  }
  const { error } = await client.from('profiles').upsert({
    id: userData.user.id,
    email: settings.email,
    display_name: settings.displayName,
    currency: settings.currency,
    timezone: settings.timezone,
    notification_preferences: settings.notificationPreferences,
    updated_at: settings.updatedAt,
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, value: settings };
}

export function exportAccountDataBundle(input: {
  settings: AccountSettings;
  vaultJson: string;
  templatesJson?: string;
}): string {
  return JSON.stringify(
    {
      schema: 'travel-buddy-account-export',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: input.settings,
      vault: JSON.parse(input.vaultJson),
      templates: input.templatesJson ? JSON.parse(input.templatesJson) : [],
      storageKeys: STORAGE_KEYS,
    },
    null,
    2,
  );
}

export type AccountDeletionGuard = {
  canDelete: boolean;
  blockers: string[];
  confirmationPhrase: string;
};

export const evaluateAccountDeletion = (input: {
  confirmation: string;
  activeTripCount: number;
  hasPendingSync: boolean;
}): AccountDeletionGuard => {
  const confirmationPhrase = 'DELETE MY ACCOUNT';
  const blockers: string[] = [];
  if (input.confirmation.trim() !== confirmationPhrase) {
    blockers.push(`Type ${confirmationPhrase} to confirm.`);
  }
  if (input.activeTripCount > 0) {
    blockers.push('Export or delete trips before account deletion.');
  }
  if (input.hasPendingSync) {
    blockers.push('Resolve pending sync changes before deletion.');
  }
  return {
    canDelete: blockers.length === 0,
    blockers,
    confirmationPhrase,
  };
};
