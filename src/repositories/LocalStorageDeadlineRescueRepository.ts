/**
 * @file LocalStorageDeadlineRescueRepository.ts
 *
 * LocalStorage implementation of DeadlineRescueRepository.
 * Used for anonymous (unauthenticated) users.
 *
 * Storage keys:
 *   placementpilot_rescue_latest   — current active rescue strategy
 *   placementpilot_rescue_history  — array of all rescue activations
 */

import type { DeadlineRescueRepository } from './DeadlineRescueRepository';
import type {
  RescueStrategy,
  RescueHistoryEntry,
} from '../ai/deadlineRescue/deadlineRescue.schema';

const LATEST_KEY = 'placementpilot_rescue_latest';
const HISTORY_KEY = 'placementpilot_rescue_history';

export class LocalStorageDeadlineRescueRepository implements DeadlineRescueRepository {

  // ─── Latest Strategy ─────────────────────────────────────────────────────────

  async getRescueStrategy(): Promise<RescueStrategy | null> {
    const raw = localStorage.getItem(LATEST_KEY);
    return raw ? JSON.parse(raw) as RescueStrategy : null;
  }

  async saveRescueStrategy(strategy: RescueStrategy): Promise<void> {
    localStorage.setItem(LATEST_KEY, JSON.stringify(strategy));
  }

  async clearRescueStrategy(): Promise<void> {
    localStorage.removeItem(LATEST_KEY);
  }

  // ─── History ─────────────────────────────────────────────────────────────────

  async getHistory(): Promise<RescueHistoryEntry[]> {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) as RescueHistoryEntry[] : [];
  }

  async saveHistory(entry: RescueHistoryEntry): Promise<void> {
    const history = await this.getHistory();
    history.push(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
}
