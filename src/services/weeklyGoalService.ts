/**
 * @file weeklyGoalService.ts
 *
 * Service for managing weekly goals.
 * Auto-generates goals at the start of each week and tracks progress.
 *
 * ── PHASE 10 ─────────────────────────────────────────────────────────
 * Weekly goal tracking system with auto-generation and progress monitoring.
 * ─────────────────────────────────────────────────────────────────────
 */

import type { ProgressRepository } from '../repositories/ProgressRepository';
import type { WeeklyGoal } from '../types/domain';
import { WEEKLY_GOAL_TARGETS, getWeekBounds } from '../config/gamificationConfig';

export class WeeklyGoalService {
  private readonly repo: ProgressRepository;

  constructor(repo: ProgressRepository) {
    this.repo = repo;
  }

  /**
   * Returns the current week's goal, creating one if it doesn't exist.
   */
  async getCurrentWeekGoal(): Promise<WeeklyGoal> {
    const progress = await this.repo.getProgress();
    const weeklyGoals = progress?.weeklyGoals || [];
    const currentWeekBounds = getWeekBounds(new Date());

    // Find existing goal for current week
    const existingGoal = weeklyGoals.find(
      g => g.weekStartDate === currentWeekBounds.start
    );

    if (existingGoal) {
      return existingGoal;
    }

    // Create new goal for current week
    const newGoal: WeeklyGoal = {
      weekStartDate: currentWeekBounds.start,
      weekEndDate: currentWeekBounds.end,
      targetMissions: WEEKLY_GOAL_TARGETS.missions,
      completedMissions: 0,
      targetXP: WEEKLY_GOAL_TARGETS.xp,
      earnedXP: 0,
      completed: false,
    };

    if (progress) {
      await this.repo.saveProgress({
        ...progress,
        weeklyGoals: [...weeklyGoals, newGoal],
      });
    }

    return newGoal;
  }

  /**
   * Returns all weekly goals in chronological order.
   */
  async getAllWeeklyGoals(): Promise<WeeklyGoal[]> {
    const progress = await this.repo.getProgress();
    return progress?.weeklyGoals || [];
  }

  /**
   * Updates the current week's goal progress.
   * Called after task/day completion or XP award.
   */
  async updateWeeklyGoalProgress(): Promise<WeeklyGoal> {
    const progress = await this.repo.getProgress();
    if (!progress) {
      return this.getCurrentWeekGoal();
    }

    const weeklyGoals = progress.weeklyGoals || [];
    const currentWeekBounds = getWeekBounds(new Date());

    // Find or create current week goal
    let currentGoalIndex = weeklyGoals.findIndex(
      g => g.weekStartDate === currentWeekBounds.start
    );

    if (currentGoalIndex === -1) {
      const newGoal = await this.getCurrentWeekGoal();
      return newGoal;
    }

    // Calculate completed missions in current week
    const currentWeekDays = Object.values(progress.days).filter(day => {
      const dayDate = new Date(day.startedAt).toISOString().split('T')[0];
      return dayDate >= currentWeekBounds.start && dayDate <= currentWeekBounds.end;
    });

    const completedMissions = currentWeekDays.filter(
      day => day.completionPercent === 100
    ).length;

    // Calculate XP earned in current week
    const earnedXP = progress.xpLog
      .filter(entry => {
        const entryDate = new Date(entry.earnedAt).toISOString().split('T')[0];
        return entryDate >= currentWeekBounds.start && entryDate <= currentWeekBounds.end;
      })
      .reduce((sum, entry) => sum + entry.amount, 0);

    const currentGoal = weeklyGoals[currentGoalIndex];
    const completed = completedMissions >= currentGoal.targetMissions &&
                     earnedXP >= currentGoal.targetXP;

    const updatedGoal: WeeklyGoal = {
      ...currentGoal,
      completedMissions,
      earnedXP,
      completed,
      completedAt: completed && !currentGoal.completed
        ? new Date().toISOString()
        : currentGoal.completedAt,
    };

    weeklyGoals[currentGoalIndex] = updatedGoal;

    await this.repo.saveProgress({
      ...progress,
      weeklyGoals,
    });

    return updatedGoal;
  }

  /**
   * Returns the progress percentage for the current week's goal.
   */
  async getCurrentWeekProgress(): Promise<{
    missionProgress: number;
    xpProgress: number;
    overallProgress: number;
  }> {
    const goal = await this.getCurrentWeekGoal();

    const missionProgress = Math.min(
      100,
      Math.round((goal.completedMissions / goal.targetMissions) * 100)
    );

    const xpProgress = Math.min(
      100,
      Math.round((goal.earnedXP / goal.targetXP) * 100)
    );

    const overallProgress = Math.round((missionProgress + xpProgress) / 2);

    return {
      missionProgress,
      xpProgress,
      overallProgress,
    };
  }

  /**
   * Returns the count of completed weekly goals.
   */
  async getCompletedWeeklyGoalsCount(): Promise<number> {
    const goals = await this.getAllWeeklyGoals();
    return goals.filter(g => g.completed).length;
  }
}
