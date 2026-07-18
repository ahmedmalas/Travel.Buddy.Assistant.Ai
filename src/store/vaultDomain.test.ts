import { describe, expect, it } from 'vitest';
import {
  createVaultTrip,
  migrateVaultState,
  syncActiveTripIntoVault,
  templateFromTrip,
  tripFromTemplate,
  validateVaultImportPayload,
  DEFAULT_TRIP_TEMPLATES,
  migrateTemplates,
} from './vaultDomain';
import { createEmptyTrip } from './tripDomain';

describe('vaultDomain', () => {
  it('migrates a single active trip into a vault', () => {
    const vault = migrateVaultState(null, createEmptyTrip({ tripName: 'Solo' }));
    expect(vault.trips).toHaveLength(1);
    expect(vault.trips[0]?.tripName).toBe('Solo');
    expect(vault.activeTripId).toBe(vault.trips[0]?.id);
  });

  it('syncs active trip edits into the vault collection', () => {
    const vault = migrateVaultState(null, createEmptyTrip({ tripName: 'A' }));
    const active = { ...vault.trips[0]!, destination: 'Oslo' };
    const next = syncActiveTripIntoVault(vault, active);
    expect(next.trips[0]?.destination).toBe('Oslo');
  });

  it('creates trips from templates and templates from trips', () => {
    const template = DEFAULT_TRIP_TEMPLATES[0]!;
    const created = tripFromTemplate(template, 'My weekend');
    expect(created.tripName).toBe('My weekend');
    expect(created.id).not.toBe(template.snapshot.id);
    const saved = templateFromTrip(createVaultTrip({ tripName: 'Custom' }), 'Saved custom');
    expect(saved.isDefault).toBe(false);
    expect(saved.name).toBe('Saved custom');
  });

  it('validates vault and legacy backup imports', () => {
    const vaultOk = validateVaultImportPayload({
      schema: 'travel-buddy-vault-backup',
      vault: migrateVaultState(null, createEmptyTrip({ tripName: 'Vaulted' })),
    });
    expect(vaultOk.ok).toBe(true);
    const legacyOk = validateVaultImportPayload({
      schema: 'travel-buddy-backup',
      trip: createEmptyTrip({ tripName: 'Legacy' }),
    });
    expect(legacyOk.ok).toBe(true);
    const bad = validateVaultImportPayload('nope');
    expect(bad.ok).toBe(false);
  });

  it('keeps default templates when migrating empty storage', () => {
    const templates = migrateTemplates(null);
    expect(templates.some((template) => template.isDefault)).toBe(true);
  });
});
