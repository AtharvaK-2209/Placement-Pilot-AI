/**
 * @file streakService.ts
 *
 * Extended streak service with weekly and monthly tracking.
 * Manages daily, weekly, and monthly streaks plus missed days.
 *
 * ── PHASE 10 ─────────────────────────────────────────────────────────
 * Enhanced streak tracking with extended metrics.
 * ─────────────────────────────────────────────────────────────────────
 */

import type { ProgressRepository } from '../repositories/ProgressRepository';
import type { ExtendedStreakState } from '../types/domain';

export class StreakService {
  private readonly repo: ProgressRepository;

  constructor(repo: ProgressRepository) {
    this.repo = repo;
  }

  /**
   * Returns the extended streak state with weekly/monthly metrics.
   */
  async getExtendedStreak(): Promise<ExtendedStreakState> {
    const progress = await this.repo.getProgress();
    
    if (!progress?.extendedStreak) {
      // Initialize extended streak from base streak
      const baseStreak = await this.repo.getStreak();
      return {
        ...baseStreak,
        weeklyStreak: 0,
        monthlyStreak: 0,
        missedDays: 0,
      };
    }

    return progress.extendedStreak;
  }

  /**
   * Updates the streak after a day is completed.
   * Computes daily, weekly, and monthly streaks.
   */
  async updateStreakOnDayComplete(dayDate: string): Promise<ExtendedStreakState> {
    const progress = await this.repo.getProgress();
    if (!progress) {
      throw new Error('[StreakService] Progress not initialized');
    }

    const baseStreak = progress.streak || {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
      totalActiveDays: 0,
    };

    const extendedStreak = progress.extendedStreak || {
      ...baseStreak,
      weeklyStreak: 0,
      monthlyStreak: 0,
      missedDays: 0,
    };

    const today = new Date(dayDate);
    const lastActive = extendedStreak.lastActiveDate
      ? new Date(extendedStreak.lastActiveDate)
      : null;

    let newCurrentStreak = extendedStreak.currentStreak;
    let newMissedDays = extendedStreak.missedDays;

    if (!lastActive) {
      // First day ever
      newCurrentStreak = 1;
    } else {
      const daysDiff = Math.floor(
        (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 0) {
        // Same day, no change
        return extendedStreak;
      } else if (daysDiff === 1) {
        // Consecutive day
        newCurrentStreak += 1;
      } else {
        // Streak broken
        newMissedDays += daysDiff - 1;
        newCurrentStreak = 1;
      }
    }

    const newLongestStreak = Math.max(extendedStreak.longestStreak, newCurrentStreak);
    const newTotalActiveDays = extendedStreak.totalActiveDays + 1;

    // Calculate weekly streak (consecutive weeks with 5+ active days)
    const weeklyStreak = await this.calculateWeeklyStreak(progress.days);

    // Calculate monthly streak (consecutive months with 20+ active days)
    const monthlyStreak = await this.calculateMonthlyStreak(progress.days);

    const updatedExtendedStreak: ExtendedStreakState = {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActiveDate: dayDate,
      totalActiveDays: newTotalActiveDays,
      weeklyStreak,
      monthlyStreak,
      missedDays: newMissedDays,
    };

    // Update both base streak and extended streak
    await this.repo.updateStreak({
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActiveDate: dayDate,
      totalActiveDays: newTotalActiveDays,
    });

    await this.repo.saveProgress({
      ...progress,
      extendedStreak: updatedExtendedStreak,
    });

    return updatedExtendedStreak;
  }

  /**
   * Calculates consecutive weeks with 5+ active days.
   */
  private async calculateWeeklyStreak(
    days: Record<string, any>
  ): Promise<number> {
    if (!days || Object.keys(days).length === 0) return 0;

    // Group days by week (Monday-Sunday)
    const weekMap = new Map<string, number>();
    
    Object.values(days).forEach((day: any) => {
      if (day.completionPercent === 100) {
        const date = new Date(day.startedAt);
        const weekKey = this.getWeekKey(date);
        weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1);
      }
    });

    // Sort weeks chronologically
    const sortedWeeks = Array.from(weekMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));

    // Count consecutive weeks with 5+ days from most recent
    let streak = 0;
    for (let i = sortedWeeks.length - 1; i >= 0; i--) {
      if (sortedWeeks[i][1] >= 5) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Calculates consecutive months with 20+ active days.
   */
  private async calculateMonthlyStreak(
    days: Record<string, any>
  ): Promise<number> {
    if (!days || Object.keys(days).length === 0) return 0;

    // Group days by month
    const monthMap = new Map<string, number>();
    
    Object.values(days).forEach((day: any) => {
      if (day.completionPercent === 100) {
        const date = new Date(day.startedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
      }
    });

    // Sort months chronologically
    const sortedMonths = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));

    // Count consecutive months with 20+ days from most recent
    let streak = 0;
    for (let i = sortedMonths.length - 1; i >= 0; i--) {
      if (sortedMonths[i][1] >= 20) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Returns the week key (Monday's date) for a given date.
   */
  private getWeekKey(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  /**
   * Returns streak statistics.
   */
  async getStreakStats(): Promise<{
    current: number;
    longest: number;
    weekly: number;
    monthly: number;
    totalActive: number;
    missedDays: number;
  }> {
    const streak = await this.getExtendedStreak();
    return {
      current: streak.currentStreak,
      longest: streak.longestStreak,
      weekly: streak.weeklyStreak,
      monthly: streak.monthlyStreak,
      totalActive: streak.totalActiveDays,
      missedDays: streak.missedDays,
    };
  }

  // ─── Backward Compatibility ────────────────────────────────────────────────

  /**
   * Returns base streak state (backward compatible).
   * New code should use getExtendedStreak() instead.
   */
  async getStreak(): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string;
    totalActiveDays: number;
  }> {
    const extended = await this.getExtendedStreak();
    return {
      currentStreak: extended.currentStreak,
      longestStreak: extended.longestStreak,
      lastActiveDate: extended.lastActiveDate,
      totalActiveDays: extended.totalActiveDays,
    };
  }

  /**
   * Records active day and returns updated streak (backward compatible).
   * New code should use updateStreakOnDayComplete() instead.
   */
  async recordActiveDay(): Promise<{
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string;
    totalActiveDays: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const extended = await this.updateStreakOnDayComplete(today);
    return {
      currentStreak: extended.currentStreak,
      longestStreak: extended.longestStreak,
      lastActiveDate: extended.lastActiveDate,
      totalActiveDays: extended.totalActiveDays,
    };
  }

  /**
   * Checks if streak bonus should be awarded (backward compatible).
   * Returns true if current streak is a multiple of 7.
   */
  async shouldAwardStreakBonus(): Promise<boolean> {
    const streak = await this.getExtendedStreak();
    return streak.currentStreak > 0 && streak.currentStreak % 7 === 0;
  }
}
