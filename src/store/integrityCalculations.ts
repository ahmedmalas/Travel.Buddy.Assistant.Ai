export type IntegrityIssueCounts = {
  warningCount: number;
  repairableErrorCount: number;
  blockingErrorCount: number;
  unresolvedIssueCount: number;
};

export type IntegrityTrendDirection = 'Improving' | 'Stable' | 'Deteriorating';

export type IntegrityTrendWindow = 'latest-5' | 'latest-10' | 'all-retained';

export type IntegrityTrendRunLike = {
  warningCount: number;
  repairableErrorCount: number;
  blockingErrorCount: number;
  unresolvedIssueCount: number;
};

export const calculateIntegrityHealthScoreFromCounts = (counts: IntegrityIssueCounts): number => {
  const penalty =
    counts.blockingErrorCount * 25 +
    counts.repairableErrorCount * 12 +
    counts.warningCount * 4 +
    counts.unresolvedIssueCount * 2;
  return Math.max(0, Math.min(100, 100 - penalty));
};

export const average = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const roundToTwo = (value: number): number => Math.round(value * 100) / 100;

export const getRunSeverityWeight = (run: IntegrityTrendRunLike): number =>
  run.blockingErrorCount * 5 + run.repairableErrorCount * 3 + run.warningCount * 2 + run.unresolvedIssueCount;

export const classifyTrendDirection = (runs: IntegrityTrendRunLike[]): IntegrityTrendDirection => {
  if (runs.length < 2) {
    return 'Stable';
  }
  const latestScore = getRunSeverityWeight(runs[0]);
  const oldestScore = getRunSeverityWeight(runs[runs.length - 1]);
  const delta = latestScore - oldestScore;
  if (delta <= -1) {
    return 'Improving';
  }
  if (delta >= 1) {
    return 'Deteriorating';
  }
  return 'Stable';
};

export const getTrendWindowRuns = <T>(runs: T[], window: IntegrityTrendWindow): T[] => {
  if (window === 'latest-5') {
    return runs.slice(0, 5);
  }
  if (window === 'latest-10') {
    return runs.slice(0, 10);
  }
  return runs;
};

export type SimulationAccuracyStatus = 'Exact Match' | 'Partial Match' | 'Diverged';

export type SimulationAccuracyInput = {
  selectionMatches: boolean;
  predictedIssueTotal: number;
  actualIssueTotal: number;
  predictedWarningCount: number;
  actualWarningCount: number;
  predictedRepairableErrorCount: number;
  actualRepairableErrorCount: number;
  predictedBlockingErrorCount: number;
  actualBlockingErrorCount: number;
  predictedResolvedFingerprintCount: number;
  actualResolvedFingerprintCount: number;
};

/**
 * Deterministic simulation accuracy classification:
 * - Selection mismatch between simulate and apply => Diverged
 * - Exact Match when all severity totals and resolved fingerprint counts match
 * - Partial Match when issue-total delta is within 1
 * - Diverged otherwise
 */
export const classifySimulationAccuracy = (input: SimulationAccuracyInput): SimulationAccuracyStatus => {
  if (!input.selectionMatches) {
    return 'Diverged';
  }
  const sameCounts =
    input.predictedIssueTotal === input.actualIssueTotal &&
    input.predictedWarningCount === input.actualWarningCount &&
    input.predictedRepairableErrorCount === input.actualRepairableErrorCount &&
    input.predictedBlockingErrorCount === input.actualBlockingErrorCount &&
    input.predictedResolvedFingerprintCount === input.actualResolvedFingerprintCount;
  if (sameCounts) {
    return 'Exact Match';
  }
  if (Math.abs(input.predictedIssueTotal - input.actualIssueTotal) <= 1) {
    return 'Partial Match';
  }
  return 'Diverged';
};
