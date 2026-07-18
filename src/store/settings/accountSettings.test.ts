import { describe, expect, it } from 'vitest';
import {
  createDefaultAccountSettings,
  evaluateAccountDeletion,
  exportAccountDataBundle,
  updateAccountSettings,
} from './accountSettings';

describe('account settings', () => {
  it('updates preferences and currency', () => {
    const next = updateAccountSettings(createDefaultAccountSettings(), {
      currency: 'EUR',
      notificationPreferences: { unpaidExpenses: false },
    });
    expect(next.currency).toBe('EUR');
    expect(next.notificationPreferences.unpaidExpenses).toBe(false);
    expect(next.notificationPreferences.departures).toBe(true);
  });

  it('exports a portable account bundle', () => {
    const json = exportAccountDataBundle({
      settings: createDefaultAccountSettings(),
      vaultJson: JSON.stringify({ version: 1, trips: [] }),
    });
    const parsed = JSON.parse(json);
    expect(parsed.schema).toBe('travel-buddy-account-export');
    expect(parsed.settings.currency).toBe('USD');
  });

  it('blocks unsafe account deletion', () => {
    const blocked = evaluateAccountDeletion({
      confirmation: 'nope',
      activeTripCount: 2,
      hasPendingSync: true,
    });
    expect(blocked.canDelete).toBe(false);
    expect(blocked.blockers.length).toBeGreaterThan(1);

    const allowed = evaluateAccountDeletion({
      confirmation: 'DELETE MY ACCOUNT',
      activeTripCount: 0,
      hasPendingSync: false,
    });
    expect(allowed.canDelete).toBe(true);
  });
});
