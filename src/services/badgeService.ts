/**
 * @file badgeService.ts
 *
 * Service for managing badge unlocks.
 * Checks unlock conditions and persists badge state.
 *
 * ── PHASE 10 ─────────────────────────────────────────────────────────
 * Badge engine with configurable unlock conditions.
 * ─────────────────────────────────────────────────────────────────────
 */

import type { ProgressRepository } from '../repositories/ProgressRepository';
import type { Badge } from '../types/domain';
import { BADGE_DEFINITIONS } from '../config/gamificationConfig';

export class BadgeService {
  private readonly repo: ProgressRepository;

  constructor(repo: ProgressRepository) {
    this.repo = repo;
  }

  /**
   * Initializes all badges in locked state.
   * Called on first use or when badges are not yet persisted.
   */
  private initializeBadges(): Badge[] {
    return BADGE_DEFINITIONS.map(def => ({
      ...def,
      locked: true,
      unlockedAt: undefined,
    }));
  }

  /**
   * Returns all badges (locked and unlocked).
   */
  async getAllBadges(): Promise<Badge[]> {
    const progress = await this.repo.getProgress();
    if (!progress?.badges) {
      return this.initializeBadges();
    }
    return progress.badges;
  }

  /**
   * Returns only unlocked badges.
   */
  async getUnlockedBadges(): Promise<Badge[]> {
    const badges = await this.getAllBadges();
    return badges.filter(b => !b.locked);
  }

  /**
   * Returns only locked badges.
   */
  async getLockedBadges(): Promise<Badge[]> {
    const badges = await this.getAllBadges();
    return badges.filter(b => b.locked);
  }

  /**
   * Unlocks a badge by ID.
   * Idempotent — unlocking an already unlocked badge is a no-op.
   */
  async unlockBadge(badgeId: string): Promise<Badge | null> {
    const progress = await this.repo.getProgress();
    if (!progress) return null;

    const badges = progress.badges || this.initializeBadges();
    const badgeIndex = badges.findIndex(b => b.id === badgeId);
    
    if (badgeIndex === -1) {
      console.warn(`[BadgeService] Badge not found: ${badgeId}`);
      return null;
    }

    const badge = badges[badgeIndex];
    if (!badge.locked) {
      // Already unlocked
      return badge;
    }

    // Unlock the badge
    const unlockedBadge: Badge = {
      ...badge,
      locked: false,
      unlockedAt: new Date().toISOString(),
    };

    badges[badgeIndex] = unlockedBadge;

    await this.repo.saveProgress({
      ...progress,
      badges,
    });

    return unlockedBadge;
  }

  /**
   * Checks and unlocks badges based on current progress.
   * Returns newly unlocked badges.
   */
  async checkAndUnlockBadges(): Promise<Badge[]> {
    const progress = await this.repo.getProgress();
    if (!progress) return [];

    const badges = progress.badges || this.initializeBadges();
    const newlyUnlocked: Badge[] = [];

    // Get current stats
    const completedTasks = Object.values(progress.days).reduce(
      (sum, day) => sum + day.tasks.filter(t => t.completed).length,
      0
    );
    const completedDays = Object.values(progress.days).filter(
      day => day.completionPercent === 100
    ).length;
    const currentStreak = progress.streak?.currentStreak || 0;
    const totalXP = progress.totalXP || 0;

    // Count completed weeks
    const weekMap = new Map<number, number>();
    Object.values(progress.days).forEach(day => {
      if (day.completionPercent === 100) {
        weekMap.set(day.weekNumber, (weekMap.get(day.weekNumber) || 0) + 1);
      }
    });
    const completedWeeks = Array.from(weekMap.values()).filter(count => count === 7).length;

    // Check each badge
    for (let i = 0; i < badges.length; i++) {
      const badge = badges[i];
      if (badge.locked && this.shouldUnlock(badge.id, {
        completedTasks,
        completedDays,
        completedWeeks,
        currentStreak,
        totalXP,
        milestones: progress.milestones || [],
      })) {
        const unlockedBadge: Badge = {
          ...badge,
          locked: false,
          unlockedAt: new Date().toISOString(),
        };
        badges[i] = unlockedBadge;
        newlyUnlocked.push(unlockedBadge);
      }
    }

    if (newlyUnlocked.length > 0) {
      await this.repo.saveProgress({
        ...progress,
        badges,
      });
    }

    return newlyUnlocked;
  }

  /**
   * Determines if a badge should be unlocked based on conditions.
   */
  private shouldUnlock(badgeId: string, stats: {
    completedTasks: number;
    completedDays: number;
    completedWeeks: number;
    currentStreak: number;
    totalXP: number;
    milestones: any[];
  }): boolean {
    switch (badgeId) {
      // Milestone badges
      case 'first-mission':
        return stats.completedDays >= 1;
      case 'roadmap-completed':
        return stats.milestones.some(m => m.id === 'roadmap-complete' && m.unlocked);
      case 'future-you-generated':
        return stats.milestones.some(m => m.id === 'future-you-generated' && m.unlocked);
      case 'deadline-survivor':
        return stats.milestones.some(m => m.id === 'deadline-rescue-used' && m.unlocked);
      case 'goal-analysis-complete':
        return stats.milestones.some(m => m.id === 'goal-analysis-complete' && m.unlocked);

      // Streak badges
      case '7-day-streak':
        return stats.currentStreak >= 7;
      case '14-day-streak':
        return stats.currentStreak >= 14;
      case '30-day-streak':
        return stats.currentStreak >= 30;
      case '100-day-streak':
        return stats.currentStreak >= 100;

      // Completion badges
      case '10-tasks-complete':
        return stats.completedTasks >= 10;
      case '50-tasks-complete':
        return stats.completedTasks >= 50;
      case '100-tasks-complete':
        return stats.completedTasks >= 100;
      case '250-tasks-complete':
        return stats.completedTasks >= 250;
      case '500-tasks-complete':
        return stats.completedTasks >= 500;

      // Special badges
      case 'first-week-complete':
        return stats.completedWeeks >= 1;
      case 'level-10-reached':
        return this.getLevelFromXP(stats.totalXP) >= 10;
      case 'perfect-week':
        return stats.completedWeeks >= 1;
      case 'execution-intelligence':
        return stats.milestones.some(m => m.id === 'execution-intelligence-used' && m.unlocked);

      default:
        return false;
    }
  }

  private getLevelFromXP(xp: number): number {
    // Simplified level calculation (matches levelService logic)
    return Math.floor(xp / 500) + 1;
  }
}
