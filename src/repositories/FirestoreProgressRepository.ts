/**
 * @file FirestoreProgressRepository.ts
 *
 * Future Firestore implementation of ProgressRepository.
 *
 * ─── NOT YET IMPLEMENTED ─────────────────────────────────────────────────────
 * This file is a placeholder. Phase 6 will provide the full implementation.
 *
 * When implemented it will:
 *   - Read/write to Firestore using the `db` export from src/config/firebase.ts
 *   - Use the same UserProgress / DayProgress / XPEntry types
 *   - Be a drop-in replacement for LocalStorageProgressRepository
 *
 * To activate, change ONE line in src/repositories/index.ts:
 *   Before: export const progressRepository = new LocalStorageProgressRepository();
 *   After:  export const progressRepository = new FirestoreProgressRepository();
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { ProgressRepository } from './ProgressRepository';
import type {
  UserProgress,
  DayProgress,
  XPEntry,
  StreakState,
  Achievement,
} from '../types/progress';

export class FirestoreProgressRepository implements ProgressRepository {

  // ─── Stub implementations ─────────────────────────────────────────────────
  // Every method throws until Phase 6 provides the real Firestore logic.
  // This prevents accidental use while keeping TypeScript satisfied.

  private notImplemented(method: string): never {
    throw new Error(
      `[FirestoreProgressRepository] ${method}() is not yet implemented. ` +
      `Use LocalStorageProgressRepository until Phase 6.`,
    );
  }

  async getProgress(): Promise<UserProgress | null>                         { this.notImplemented('getProgress'); }
  async saveProgress(_p: UserProgress): Promise<void>                       { this.notImplemented('saveProgress'); }
  async resetProgress(): Promise<void>                                      { this.notImplemented('resetProgress'); }
  async getDayProgress(_w: number, _d: number): Promise<DayProgress | null> { this.notImplemented('getDayProgress'); }
  async saveDayProgress(_d: DayProgress): Promise<void>                     { this.notImplemented('saveDayProgress'); }
  async updateTask(_w: number, _d: number, _t: string, _c: boolean): Promise<void> { this.notImplemented('updateTask'); }
  async getTotalXP(): Promise<number>                                       { this.notImplemented('getTotalXP'); }
  async addXP(_e: XPEntry): Promise<void>                                   { this.notImplemented('addXP'); }
  async getXPLog(): Promise<XPEntry[]>                                      { this.notImplemented('getXPLog'); }
  async getStreak(): Promise<StreakState>                                   { this.notImplemented('getStreak'); }
  async updateStreak(_s: StreakState): Promise<void>                        { this.notImplemented('updateStreak'); }
  async getAchievements(): Promise<Achievement[]>                           { this.notImplemented('getAchievements'); }
  async addAchievement(_a: Achievement): Promise<void>                      { this.notImplemented('addAchievement'); }
}
