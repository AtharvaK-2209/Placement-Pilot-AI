/**
 * @file GoalHealthRepository.ts
 *
 * Abstract interface for Goal Health persistence.
 * Phase 7.1: adds history + getLatest.
 */

import type {
  GoalHealthScore,
  GoalHealthHistoryEntry,
} from '../ai/goalHealth/goalHealth.schema';

export interface GoalHealthRepository {
  /** Overwrites the "latest" document with the current evaluation. */
  saveHealth(score: GoalHealthScore): Promise<void>;

  /** Appends an immutable history entry. Never overwrites a previous entry. */
  saveHistory(entry: GoalHealthHistoryEntry): Promise<void>;

  /** Returns the most recently saved score, or null. */
  getHealth(): Promise<GoalHealthScore | null>;

  /** Returns all history entries in ascending chronological order. */
  getHistory(): Promise<GoalHealthHistoryEntry[]>;
}
