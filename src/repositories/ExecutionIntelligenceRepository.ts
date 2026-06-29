/**
 * @file ExecutionIntelligenceRepository.ts
 *
 * Abstract interface for Execution Intelligence persistence.
 * Follows the same pattern as GoalHealthRepository.
 */

import type {
  ExecutionIntelligenceScore,
  ExecutionIntelligenceHistoryEntry,
} from '../ai/executionIntelligence/executionIntelligence.schema';

export interface ExecutionIntelligenceRepository {
  /** Overwrites the "latest" document with the current analysis. */
  saveIntelligence(analysis: ExecutionIntelligenceScore): Promise<void>;

  /** Appends an immutable history entry. Never overwrites a previous entry. */
  saveHistory(entry: ExecutionIntelligenceHistoryEntry): Promise<void>;

  /** Returns the most recently saved analysis, or null. */
  getIntelligence(): Promise<ExecutionIntelligenceScore | null>;

  /** Returns all history entries in ascending chronological order. */
  getHistory(): Promise<ExecutionIntelligenceHistoryEntry[]>;
}
