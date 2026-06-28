/**
 * @file achievementService.ts
 *
 * Business logic for unlocking achievements.
 *
 * ─── DEPENDENCY RULE ─────────────────────────────────────────────────────────
 * Depends ONLY on ProgressRepository. Zero storage knowledge.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { ProgressRepository } from '../repositories/ProgressRepository';
import type { Achievement }        from '../types/progress';

// ─── Achievement catalogue ─────────────────────────────────────────────────────

/** All available achievements, keyed by a stable id. */
export const ACHIEVEMENT_CATALOGUE: Record<string, Omit<Achievement, 'unlockedAt'>> = {
  first_mission: {
    id:          'first_mission',
    title:       'First Mission',
    description: 'Completed your very first daily mission.',
    icon:        '🎯',
  },
  three_day_streak: {
    id:          'three_day_streak',
    title:       'On a Roll',
    description: 'Maintained a 3-day study streak.',
    icon:        '🔥',
  },
  seven_day_streak: {
    id:          'seven_day_streak',
    title:       'Week Warrior',
    description: 'Maintained a 7-day study streak.',
    icon:        '⚡',
  },
  first_week_complete: {
    id:          'first_week_complete',
    title:       'Week 1 Done',
    description: 'Completed all 7 days of Week 1.',
    icon:        '🏆',
  },
  hundred_xp: {
    id:          'hundred_xp',
    title:       'XP Earner',
    description: 'Earned 100 XP.',
    icon:        '⭐',
  },
  five_hundred_xp: {
    id:          'five_hundred_xp',
    title:       'Level Up',
    description: 'Reached 500 XP.',
    icon:        '🚀',
  },
};

// ─── Achievement Service ───────────────────────────────────────────────────────

export class AchievementService {
  private readonly repo: ProgressRepository;
  constructor(repo: ProgressRepository) { this.repo = repo; }

  /**
   * Unlocks an achievement by id.
   * Idempotent — safe to call multiple times for the same id.
   * Returns the Achievement if newly unlocked, null if already unlocked.
   */
  async unlock(id: string): Promise<Achievement | null> {
    const template = ACHIEVEMENT_CATALOGUE[id];
    if (!template) {
      console.warn(`[AchievementService] Unknown achievement id: "${id}"`);
      return null;
    }

    const existing = await this.repo.getAchievements();
    if (existing.some((a) => a.id === id)) return null; // already unlocked

    const achievement: Achievement = {
      ...template,
      unlockedAt: new Date().toISOString(),
    };

    await this.repo.addAchievement(achievement);
    return achievement;
  }

  /** Returns all unlocked achievements. */
  async getAll(): Promise<Achievement[]> {
    return this.repo.getAchievements();
  }

  /** Returns true if a specific achievement is already unlocked. */
  async isUnlocked(id: string): Promise<boolean> {
    const all = await this.repo.getAchievements();
    return all.some((a) => a.id === id);
  }
}
