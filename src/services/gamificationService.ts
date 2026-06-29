/**
 * @file gamificationService.ts
 *
 * Unified gamification service that orchestrates all gamification subsystems.
 * Provides a single entry point for XP awards, level-ups, badge unlocks, etc.
 *
 * ── PHASE 10 ─────────────────────────────────────────────────────────
 * Complete gamification engine coordinating:
 *   - XP & Levels
 *   - Badges
 *   - Streaks
 *   - Weekly Goals
 *   - Milestones
 * ─────────────────────────────────────────────────────────────────────
 */

import type { ProgressRepository } from '../repositories/ProgressRepository';
import type { XPSource, LevelState, Badge, Milestone, WeeklyGoal, ExtendedStreakState } from '../types/domain';
import { XPService } from './xpService';
import { LevelService } from './levelService';
import { BadgeService } from './badgeService';
import { StreakService } from './streakService';
import { WeeklyGoalService } from './weeklyGoalService';
import { MilestoneService } from './milestoneService';

/**
 * Result of awarding XP — includes level-up and badge unlock info.
 */
export interface XPAwardResult {
  xpAwarded: number;
  totalXP: number;
  levelUp: boolean;
  newLevel?: number;
  previousLevel?: number;
  badgesUnlocked: Badge[];
}

/**
 * Complete gamification state snapshot.
 */
export interface GamificationState {
  level: LevelState;
  totalXP: number;
  streak: ExtendedStreakState;
  badges: Badge[];
  milestones: Milestone[];
  weeklyGoal: WeeklyGoal;
  tasksCompleted: number;
}

export class GamificationService {
  private readonly repo: ProgressRepository;
  private readonly xpService: XPService;
  private readonly levelService: LevelService;
  private readonly badgeService: BadgeService;
  private readonly streakService: StreakService;
  private readonly weeklyGoalService: WeeklyGoalService;
  private readonly milestoneService: MilestoneService;

  constructor(repo: ProgressRepository) {
    this.repo = repo;
    this.xpService = new XPService(repo);
    this.levelService = new LevelService(repo);
    this.badgeService = new BadgeService(repo);
    this.streakService = new StreakService(repo);
    this.weeklyGoalService = new WeeklyGoalService(repo);
    this.milestoneService = new MilestoneService(repo);
  }

  // ─── XP & Levels ──────────────────────────────────────────────────────────────

  /**
   * Awards XP and checks for level-ups and badge unlocks.
   * Returns complete result with all triggered events.
   */
  async awardXP(source: XPSource, description: string): Promise<XPAwardResult> {
    const previousLevel = (await this.levelService.getLevelState()).level;
    const xpAwarded = await this.xpService.award(source, description);
    const totalXP = await this.xpService.getTotal();
    const newLevel = (await this.levelService.getLevelState()).level;
    const levelUp = newLevel > previousLevel;

    // Check for badge unlocks
    const badgesUnlocked = await this.badgeService.checkAndUnlockBadges();

    // Update weekly goal progress
    await this.weeklyGoalService.updateWeeklyGoalProgress();

    return {
      xpAwarded,
      totalXP,
      levelUp,
      newLevel: levelUp ? newLevel : undefined,
      previousLevel: levelUp ? previousLevel : undefined,
      badgesUnlocked,
    };
  }

  /**
   * Returns the current level state.
   */
  async getLevelState(): Promise<LevelState> {
    return this.levelService.getLevelState();
  }

  // ─── Streaks ──────────────────────────────────────────────────────────────────

  /**
   * Updates streak when a day is completed.
   */
  async updateStreakOnDayComplete(dayDate: string): Promise<ExtendedStreakState> {
    const streak = await this.streakService.updateStreakOnDayComplete(dayDate);
    
    // Check for streak-related badge unlocks
    await this.badgeService.checkAndUnlockBadges();
    
    return streak;
  }

  /**
   * Returns extended streak state.
   */
  async getExtendedStreak(): Promise<ExtendedStreakState> {
    return this.streakService.getExtendedStreak();
  }

  // ─── Badges ───────────────────────────────────────────────────────────────────

  /**
   * Returns all badges (locked and unlocked).
   */
  async getAllBadges(): Promise<Badge[]> {
    return this.badgeService.getAllBadges();
  }

  /**
   * Returns only unlocked badges.
   */
  async getUnlockedBadges(): Promise<Badge[]> {
    return this.badgeService.getUnlockedBadges();
  }

  /**
   * Manually unlocks a badge (used for special events).
   */
  async unlockBadge(badgeId: string): Promise<Badge | null> {
    return this.badgeService.unlockBadge(badgeId);
  }

  // ─── Milestones ───────────────────────────────────────────────────────────────

  /**
   * Unlocks a milestone and checks for related badge unlocks.
   */
  async unlockMilestone(milestoneId: string): Promise<Milestone | null> {
    const milestone = await this.milestoneService.unlockMilestone(milestoneId);
    
    if (milestone) {
      // Check for milestone-related badge unlocks
      await this.badgeService.checkAndUnlockBadges();
      
      // Award milestone XP
      await this.awardXP('milestone', `Milestone: ${milestone.title}`);
    }
    
    return milestone;
  }

  /**
   * Returns all milestones.
   */
  async getAllMilestones(): Promise<Milestone[]> {
    return this.milestoneService.getAllMilestones();
  }

  /**
   * Returns only unlocked milestones.
   */
  async getUnlockedMilestones(): Promise<Milestone[]> {
    return this.milestoneService.getUnlockedMilestones();
  }

  // ─── Weekly Goals ─────────────────────────────────────────────────────────────

  /**
   * Returns the current week's goal.
   */
  async getCurrentWeeklyGoal(): Promise<WeeklyGoal> {
    return this.weeklyGoalService.getCurrentWeekGoal();
  }

  /**
   * Returns all weekly goals.
   */
  async getAllWeeklyGoals(): Promise<WeeklyGoal[]> {
    return this.weeklyGoalService.getAllWeeklyGoals();
  }

  /**
   * Returns the current week's progress.
   */
  async getCurrentWeekProgress(): Promise<{
    missionProgress: number;
    xpProgress: number;
    overallProgress: number;
  }> {
    return this.weeklyGoalService.getCurrentWeekProgress();
  }

  // ─── Complete State ───────────────────────────────────────────────────────────

  /**
   * Returns complete gamification state snapshot.
   * Used for rendering dashboards and stats pages.
   */
  async getGamificationState(): Promise<GamificationState> {
    const [level, totalXP, streak, badges, milestones, weeklyGoal, tasksCompleted] = await Promise.all([
      this.getLevelState(),
      this.xpService.getTotal(),
      this.getExtendedStreak(),
      this.getAllBadges(),
      this.getAllMilestones(),
      this.getCurrentWeeklyGoal(),
      this.repo.getTotalTasksCompleted(),
    ]);

    return {
      level,
      totalXP,
      streak,
      badges,
      milestones,
      weeklyGoal,
      tasksCompleted,
    };
  }

  // ─── Event Handlers ───────────────────────────────────────────────────────────

  /**
   * Called when a task is completed.
   * Awards XP and updates all relevant systems.
   */
  async onTaskComplete(taskTitle: string): Promise<XPAwardResult> {
    return this.awardXP('task_complete', `Task: ${taskTitle}`);
  }

  /**
   * Called when a day is completed.
   * Awards XP, updates streak, and checks for badge unlocks.
   */
  async onDayComplete(dayDate: string, missionTitle: string): Promise<{
    xpResult: XPAwardResult;
    streak: ExtendedStreakState;
  }> {
    const xpResult = await this.awardXP('day_complete', `Mission: ${missionTitle}`);
    const streak = await this.updateStreakOnDayComplete(dayDate);
    
    // Check if first mission milestone should be unlocked
    const firstMissionUnlocked = await this.milestoneService.isMilestoneUnlocked('first-mission-complete');
    if (!firstMissionUnlocked) {
      await this.unlockMilestone('first-mission-complete');
    }
    
    return { xpResult, streak };
  }

  /**
   * Called when a week is completed.
   */
  async onWeekComplete(weekNumber: number, weekTitle: string): Promise<XPAwardResult> {
    const xpResult = await this.awardXP('week_complete', `Week ${weekNumber}: ${weekTitle}`);
    
    // Check if first week milestone should be unlocked
    if (weekNumber === 1) {
      const firstWeekUnlocked = await this.milestoneService.isMilestoneUnlocked('first-week-complete');
      if (!firstWeekUnlocked) {
        await this.unlockMilestone('first-week-complete');
      }
    }
    
    return xpResult;
  }
}
