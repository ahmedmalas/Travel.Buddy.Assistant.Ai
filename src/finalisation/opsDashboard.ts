/**
 * Slice 98 — Operations dashboard data assembly.
 */

import { inventoryLocalCache, type OfflineState } from './offline';
import { summarizeAnalytics, type AnalyticsState } from './analytics';
import { buildCompatibilityReport, type FeatureFlag } from './release';
import { PERFORMANCE_BASELINE } from './performance';
import type { ImportReviewDraft } from './importEngine';
import type { SyncEngineState } from '../store/sync/syncEngine';
import { syncQueueSummary } from '../store/sync/syncEngine';

export interface OpsDashboardModel {
  generatedAt: string;
  applicationHealth: 'healthy' | 'degraded' | 'attention';
  offline: OfflineState;
  sync: {
    network: SyncEngineState['network'];
    pending: number;
    failed: number;
    lastSyncAt: string | null;
  };
  storage: {
    totalBytes: number;
    items: Array<{ key: string; bytes: number; category: string }>;
  };
  importHistory: Array<{ id: string; fileName: string; at: string; entities: number; confidence: number }>;
  analytics: ReturnType<typeof summarizeAnalytics>;
  performance: typeof PERFORMANCE_BASELINE;
  compatibility: ReturnType<typeof buildCompatibilityReport>;
  featureFlags: FeatureFlag[];
  diagnostics: string[];
}

export function buildOpsDashboard(input: {
  offline: OfflineState;
  syncState: SyncEngineState;
  analytics: AnalyticsState;
  featureFlags: FeatureFlag[];
  importHistory: ImportReviewDraft[];
  storage?: Storage;
}): OpsDashboardModel {
  const storageItems = inventoryLocalCache(input.storage ?? window.localStorage);
  const totalBytes = storageItems.reduce((sum, item) => sum + item.bytes, 0);
  const queue = syncQueueSummary(input.syncState);
  const diagnostics: string[] = [];
  if (input.offline.network === 'offline') diagnostics.push('Network offline — degraded mode active.');
  if (queue.failed > 0) diagnostics.push(`${queue.failed} sync queue item(s) failed.`);
  if (queue.pending > 0) diagnostics.push(`${queue.pending} sync queue item(s) pending.`);
  if (totalBytes > 4 * 1024 * 1024) diagnostics.push('Local storage usage is high (>4MB).');

  let applicationHealth: OpsDashboardModel['applicationHealth'] = 'healthy';
  if (queue.failed > 0 || input.offline.network === 'offline') applicationHealth = 'degraded';
  if (queue.failed > 5) applicationHealth = 'attention';

  return {
    generatedAt: new Date().toISOString(),
    applicationHealth,
    offline: input.offline,
    sync: {
      network: input.syncState.network,
      pending: queue.pending,
      failed: queue.failed,
      lastSyncAt: input.syncState.lastSyncAt ?? null,
    },
    storage: {
      totalBytes,
      items: storageItems.slice(0, 20),
    },
    importHistory: input.importHistory
      .slice()
      .reverse()
      .slice(0, 20)
      .map((draft) => ({
        id: draft.id,
        fileName: draft.fileName,
        at: draft.importedAt,
        entities: draft.entities.length,
        confidence: draft.overallConfidence,
      })),
    analytics: summarizeAnalytics(input.analytics),
    performance: PERFORMANCE_BASELINE,
    compatibility: buildCompatibilityReport(),
    featureFlags: input.featureFlags,
    diagnostics,
  };
}
