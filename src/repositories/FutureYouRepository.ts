/**
 * @file FutureYouRepository.ts
 *
 * Repository interface for Future You predictions.
 */

import type {
  FutureYouPrediction,
  FutureYouHistoryEntry,
} from '../ai/futureYou/futureYou.schema';

export interface FutureYouRepository {
  /**
   * Saves the latest Future You prediction.
   * Overwrites any previous latest prediction.
   */
  saveLatest(prediction: FutureYouPrediction): Promise<void>;

  /**
   * Retrieves the latest Future You prediction.
   * Returns null if no prediction exists.
   */
  getLatest(): Promise<FutureYouPrediction | null>;

  /**
   * Appends a prediction to the immutable history.
   * Used for tracking prediction evolution over time.
   */
  appendHistory(
    prediction: FutureYouPrediction,
    context: {
      roadmapVersion: number;
      currentWeek: number;
      overallCompletion: number;
      currentStreak: number;
      goalHealthScore: number;
      burnoutRisk: string;
    }
  ): Promise<void>;

  /**
   * Retrieves prediction history, ordered by timestamp (newest first).
   * Optionally limit the number of entries returned.
   */
  getHistory(limit?: number): Promise<FutureYouHistoryEntry[]>;

  /**
   * Clears the latest prediction.
   * Used when starting a new goal or resetting.
   */
  clearLatest(): Promise<void>;
}
