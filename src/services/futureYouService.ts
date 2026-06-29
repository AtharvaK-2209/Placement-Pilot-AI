/**
 * @file futureYouService.ts
 *
 * Business logic for Future You predictions.
 * Orchestrates data gathering from existing repositories and calls the AI agent.
 *
 * ── ARCHITECTURAL RULES ──────────────────────────────────────────────
 * ✓ Reuses ALL existing repositories (Goal, Roadmap, Progress, etc.)
 * ✓ Performs deterministic calculations before AI call
 * ✓ Makes ONE Gemini request with all context
 * ✓ Saves to FutureYouRepository (separate from other features)
 * ✗ Does NOT duplicate repository logic
 * ✗ Does NOT make multiple AI calls
 * ─────────────────────────────────────────────────────────────────────
 */

import type { FutureYouRepository } from '../repositories/FutureYouRepository';
import type { FutureYouInput, FutureYouPrediction } from '../ai/futureYou/futureYou.schema';
import { predictFutureYou } from '../ai/futureYou/futureYou';
import { getCurrentUser } from './authService';

export class FutureYouService {
  private readonly repo: FutureYouRepository;

  constructor(repo: FutureYouRepository) {
    this.repo = repo;
  }

  /**
   * Generates a Future You prediction by:
   * 1. Gathering data from existing repositories
   * 2. Calculating deterministic analytics
   * 3. Making ONE AI request
   * 4. Saving the result
   */
  async generatePrediction(context: {
    // Goal & Roadmap (from existing services)
    currentGoal: string;
    goalType: string;
    deadline: string;
    difficulty: string;
    feasibility: string;
    executionMode: string;
    roadmapVersion: number;
    totalWeeks: number;
    completedWeeks: number;
    currentWeek: number;
    remainingTopics: string[];

    // Progress (from progressService)
    overallCompletionPct: number;
    completedTasks: number;
    totalTasks: number;
    completedDays: number;
    totalXP: number;
    level: number;
    achievementCount: number;

    // Streaks (from streakService)
    currentStreak: number;
    longestStreak: number;
    streakActiveToday: boolean;
    totalActiveDays: number;

    // Goal Health (from goalHealthService)
    goalHealthScore: number;
    goalHealthLevel: string;
    healthTrend: 'up' | 'down' | 'stable';
    burnoutRisk: 'low' | 'medium' | 'high';
    deadlineRisk: 'low' | 'medium' | 'high';
    deadlineStatus: 'on_track' | 'slightly_behind' | 'rescue_active' | 'critical';
    estimatedCompletionDate: string;

    // Execution Intelligence (from executionIntelligence)
    interviewReadinessScore: number;
    strengths: string[];
    weaknesses: string[];
    behaviourPatterns: string[];

    // Daily Mission History (from progressService)
    missedTasksCount: number;
    revisionTasksCompletedCount: number;
    revisionTasksTotalCount: number;
    projectTasksCompletedCount: number;
    projectTasksTotalCount: number;
    practiceTasksCompletedCount: number;
    practiceTasksTotalCount: number;

    // Topic Performance (calculated)
    topicsWithHighCompletion: string[];
    topicsWithLowCompletion: string[];

    // Deadline Rescue (from deadlineRescue)
    deadlineRescueActive: boolean;
    replanCount: number;
  }): Promise<FutureYouPrediction | null> {
    try {
      // ── Step 1: Calculate deterministic analytics ──────────────────────────
      
      const remainingWeeks = context.totalWeeks - context.completedWeeks;
      const remainingDays = this.calculateRemainingDays(context.deadline);
      const remainingHours = remainingWeeks * this.estimateWeeklyHours(context);
      const averageCompletionRate = context.completedWeeks > 0
        ? (context.overallCompletionPct / context.completedWeeks)
        : 0;
      const consistencyRate = context.totalActiveDays > 0
        ? (context.completedDays / context.totalActiveDays) * 100
        : 0;
      const executionConsistency = this.classifyConsistency(consistencyRate);
      const targetDays = this.calculateTargetDays(
        context.deadline,
        context.estimatedCompletionDate,
        remainingDays
      );

      // ── Step 2: Build input for AI ─────────────────────────────────────────
      
      const input: FutureYouInput = {
        // Goal Context
        currentGoal: context.currentGoal,
        goalType: context.goalType,
        deadline: context.deadline,
        difficulty: context.difficulty,
        feasibility: context.feasibility,
        executionMode: context.executionMode,

        // Roadmap
        roadmapVersion: context.roadmapVersion,
        totalWeeks: context.totalWeeks,
        completedWeeks: context.completedWeeks,
        currentWeek: context.currentWeek,
        remainingWeeks,
        remainingTopics: context.remainingTopics,

        // Progress
        overallCompletionPct: context.overallCompletionPct,
        completedTasks: context.completedTasks,
        totalTasks: context.totalTasks,
        completedDays: context.completedDays,
        averageCompletionRate,

        // Time
        remainingDays,
        remainingHours,
        weeklyHours: this.estimateWeeklyHours(context),
        predictedCompletionDate: context.estimatedCompletionDate,
        targetDays,

        // XP & Gamification
        totalXP: context.totalXP,
        level: context.level,
        achievementCount: context.achievementCount,

        // Streaks
        currentStreak: context.currentStreak,
        longestStreak: context.longestStreak,
        streakActiveToday: context.streakActiveToday,
        totalActiveDays: context.totalActiveDays,

        // Consistency
        consistencyRate,
        executionConsistency,

        // Goal Health
        goalHealthScore: context.goalHealthScore,
        goalHealthLevel: context.goalHealthLevel,
        healthTrend: context.healthTrend,

        // Risk Assessment
        burnoutRisk: context.burnoutRisk,
        deadlineRisk: context.deadlineRisk,
        deadlineStatus: context.deadlineStatus,

        // Execution Intelligence
        interviewReadinessScore: context.interviewReadinessScore,
        strengths: context.strengths,
        weaknesses: context.weaknesses,
        behaviourPatterns: context.behaviourPatterns,

        // Daily Mission History
        missedTasksCount: context.missedTasksCount,
        revisionTasksCompletedCount: context.revisionTasksCompletedCount,
        revisionTasksTotalCount: context.revisionTasksTotalCount,
        projectTasksCompletedCount: context.projectTasksCompletedCount,
        projectTasksTotalCount: context.projectTasksTotalCount,
        practiceTasksCompletedCount: context.practiceTasksCompletedCount,
        practiceTasksTotalCount: context.practiceTasksTotalCount,

        // Topic Performance
        topicsWithHighCompletion: context.topicsWithHighCompletion,
        topicsWithLowCompletion: context.topicsWithLowCompletion,

        // Deadline Rescue
        deadlineRescueActive: context.deadlineRescueActive,
        replanCount: context.replanCount,
      };

      // ── Step 3: Call AI (ONE request) ──────────────────────────────────────
      
      const user = getCurrentUser();
      const response = await predictFutureYou(input, user?.uid);

      if (!response.success || !response.data) {
        console.error('[FutureYouService] AI prediction failed');
        return null;
      }

      const prediction = response.data;

      // ── Step 4: Save to repository ─────────────────────────────────────────
      
      await this.repo.saveLatest(prediction);
      
      // Also append to history for tracking
      await this.repo.appendHistory(prediction, {
        roadmapVersion: context.roadmapVersion,
        currentWeek: context.currentWeek,
        overallCompletion: context.overallCompletionPct,
        currentStreak: context.currentStreak,
        goalHealthScore: context.goalHealthScore,
        burnoutRisk: context.burnoutRisk,
      });

      console.log('[FutureYouService] ✓ Prediction generated and saved');
      return prediction;

    } catch (error) {
      console.error('[FutureYouService] generatePrediction failed:', error);
      return null;
    }
  }

  /**
   * Retrieves the latest prediction from cache.
   */
  async getLatestPrediction(): Promise<FutureYouPrediction | null> {
    return this.repo.getLatest();
  }

  /**
   * Retrieves prediction history.
   */
  async getPredictionHistory(limit?: number): Promise<any[]> {
    return this.repo.getHistory(limit);
  }

  /**
   * Clears the latest prediction.
   * Used when starting a new goal or resetting.
   */
  async clearPrediction(): Promise<void> {
    await this.repo.clearLatest();
  }

  // ── Private Helpers ─────────────────────────────────────────────────────────

  private calculateRemainingDays(deadline: string): number {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  private estimateWeeklyHours(_context: { totalWeeks: number; completedWeeks: number }): number {
    // Default estimation - can be enhanced with actual tracking
    return 15; // Placeholder - should come from goal input or tracking
  }

  private classifyConsistency(consistencyRate: number): string {
    if (consistencyRate >= 90) return 'excellent';
    if (consistencyRate >= 75) return 'good';
    if (consistencyRate >= 50) return 'moderate';
    return 'poor';
  }

  private calculateTargetDays(
    deadline: string,
    estimatedCompletionDate: string,
    _remainingDays: number
  ): number {
    // Use deadline if on track, otherwise use estimated completion
    const deadlineDays = this.calculateRemainingDays(deadline);
    const estimatedDays = this.calculateRemainingDays(estimatedCompletionDate);
    
    // If estimated completion is before deadline, use estimated
    // Otherwise use deadline
    return Math.min(deadlineDays, estimatedDays);
  }
}
