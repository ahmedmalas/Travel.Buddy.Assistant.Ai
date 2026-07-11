import { describe, expect, it } from 'vitest';
import {
  average,
  calculateIntegrityHealthScoreFromCounts,
  classifyTrendDirection,
  getTrendWindowRuns,
  roundToTwo,
} from './integrityCalculations';

describe('integrityCalculations', () => {
  it('calculates deterministic health score from severity counts', () => {
    const score = calculateIntegrityHealthScoreFromCounts({
      warningCount: 2,
      repairableErrorCount: 1,
      blockingErrorCount: 1,
      unresolvedIssueCount: 3,
    });
    expect(score).toBe(49);
  });

  it('classifies trends based on weighted severity deltas', () => {
    const improving = classifyTrendDirection([
      { blockingErrorCount: 0, repairableErrorCount: 0, warningCount: 1, unresolvedIssueCount: 1 },
      { blockingErrorCount: 1, repairableErrorCount: 1, warningCount: 1, unresolvedIssueCount: 3 },
    ]);
    const deteriorating = classifyTrendDirection([
      { blockingErrorCount: 1, repairableErrorCount: 1, warningCount: 1, unresolvedIssueCount: 3 },
      { blockingErrorCount: 0, repairableErrorCount: 0, warningCount: 1, unresolvedIssueCount: 1 },
    ]);
    const stable = classifyTrendDirection([
      { blockingErrorCount: 0, repairableErrorCount: 0, warningCount: 1, unresolvedIssueCount: 1 },
      { blockingErrorCount: 0, repairableErrorCount: 0, warningCount: 1, unresolvedIssueCount: 1 },
    ]);
    expect(improving).toBe('Improving');
    expect(deteriorating).toBe('Deteriorating');
    expect(stable).toBe('Stable');
  });

  it('returns expected trend windows and helper math utilities', () => {
    const runs = [1, 2, 3, 4, 5, 6, 7];
    expect(getTrendWindowRuns(runs, 'latest-5')).toEqual([1, 2, 3, 4, 5]);
    expect(getTrendWindowRuns(runs, 'latest-10')).toEqual(runs);
    expect(getTrendWindowRuns(runs, 'all-retained')).toEqual(runs);
    expect(average([1, 2, 3])).toBe(2);
    expect(roundToTwo(1.236)).toBe(1.24);
  });
});
