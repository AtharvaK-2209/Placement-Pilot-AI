/**
 * @file DeadlineRescueRepository.ts
 *
 * Abstract interface for deadline rescue mode storage operations.
 *
 * ─── ARCHITECTURE RULE ────────────────────────────────────────────────────────
 * Business logic must depend ONLY on this interface.
 * Never on concrete implementations (Firestore, localStorage).
 *
 * Implementations:
 *   FirestoreDeadlineRescueRepository  — src/repositories/FirestoreDeadlineRescueRepository.ts
 *   LocalStorageDeadlineRescueRepository — src/repositories/LocalStorageDeadlineRescueRepository.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type {
  RescueStrategy,
  RescueHistoryEntry,
} from '../ai/deadlineRescue/deadlineRescue.schema';

export interface DeadlineRescueRepository {

  /**
   * Returns the latest active rescue strategy, or null if none exists.
   */
  getRescueStrategy(): Promise<RescueStrategy | null>;

  /**
   * Saves the latest rescue strategy.
   * Replaces any existing strategy.
   */
  saveRescueStrategy(strategy: RescueStrategy): Promise<void>;

  /**
   * Clears the active rescue strategy (deactivates rescue mode).
   */
  clearRescueStrategy(): Promise<void>;

  /**
   * Returns the full rescue activation history in chronological order.
   */
  getHistory(): Promise<RescueHistoryEntry[]>;

  /**
   * Appends a new rescue activation to the history.
   * History entries are immutable once created.
   */
  saveHistory(entry: RescueHistoryEntry): Promise<void>;
}
