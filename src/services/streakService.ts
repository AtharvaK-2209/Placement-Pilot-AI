/**
 * @file streakService.ts
 *
 * Business logic for daily study streaks.
 *
 * ─── DEPENDENCY RULE ─────────────────────────────────────────────────────────
 * Depends ONLY on ProgressRepository. Zero storage knowledge.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { ProgressRepository } from '../repositories/ProgressRepository';
import type { StreakState }         from '../types/progress';

// ─── Streak Service ───────────────────────────────────────────────────────────

export class StreakService {
  private readonly repo: ProgressRepository;
  constructor(repo: ProgressRepository) { this.repo = repo; }

  /**
   * Records today as an active day.
   * - If last active was yesterday  → increments currentStreak.
   * - If last active was today      → no change (idempotent).
   * - If last active was 2+ days ago → resets currentStreak to 1.
   *
   * Returns the updated StreakState.
   */
  async recordActiveDay(): Promise<StreakState> {
    const today   = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    const streak  = await this.repo.getStreak();

    if (streak.lastActiveDate === today) {
      // Already recorded today — idempotent
      return streak;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const isConsecutive = streak.lastActiveDate === yesterdayStr;

    const updated: StreakState = {
      currentStreak:   isConsecutive ? streak.currentStreak + 1 : 1,
      longestStreak:   Math.max(streak.longestStreak, isConsecutive ? streak.currentStreak + 1 : 1),
      lastActiveDate:  today,
      totalActiveDays: streak.totalActiveDays + 1,
    };

    await this.repo.updateStreak(updated);
    return updated;
  }

  /** Returns the current streak state. */
  async getStreak(): Promise<StreakState> {
    return this.repo.getStreak();
  }

  /**
   * Returns true if the streak bonus should be awarded today.
   * Bonus is awarded at streak milestones: 3, 7, 14, 30 days.
   */
  async shouldAwardStreakBonus(): Promise<boolean> {
    const streak     = await this.repo.getStreak();
    const milestones = [3, 7, 14, 30, 60, 100];
    return milestones.includes(streak.currentStreak);
  }
}
