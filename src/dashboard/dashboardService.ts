/**
 * @file dashboardService.ts
 *
 * Business logic for aggregating all dashboard data.
 *
 * ─── ARCHITECTURE RULE ────────────────────────────────────────────────────────
 * This service is the ONLY entry point for dashboard data.
 * UI components should call getDashboardData() instead of querying repositories.
 *
 * Dependencies:
 *   - ProgressRepository (via getProgressRepository)
 *   - RoadmapRepository (via hooks)
 *   - MissionRepository (via hooks)
 *   - GoalHealthRepository (via hooks)
 *   - ExecutionIntelligenceRepository (via hooks)
 *   - DeadlineRescueRepository (via hooks)
 *   - FutureYouRepository (via hooks)
 *   - RoadmapProgressRepository (via hooks)
 *   - XPService
 *   - StreakService
 *
 * NEVER queries Firestore directly — always through repositories.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { ProgressRepository } from '../repositories/ProgressRepository';
import type { RoadmapRepository } from '../repositories/RoadmapRepository';
import type { MissionRepository } from '../repositories/MissionRepository';
import type { GoalHealthRepository } from '../repositories/GoalHealthRepository';
import type { ExecutionIntelligenceRepository } from '../repositories/ExecutionIntelligenceRepository';
import type { DeadlineRescueRepository } from '../repositories/DeadlineRescueRepository';
import type { FutureYouRepository } from '../repositories/FutureYouRepository';
import type { RoadmapProgressRepository } from '../repositories/RoadmapProgressRepository';
import type { GoalInput, Roadmap, UserProgress } from '../types/domain';
import type { RoadmapProgress } from '../types/roadmapProgress';
import type {
  DashboardData,
  UserGreeting,
  GoalSummary,
  RoadmapSummary,
  MissionSummary,
  GoalHealthSummary,
  XPSummary,
  StreakSummary,
  DeadlineSummary,
  DeadlineRescueSummary,
  ExecutionIntelligenceSummary,
  FutureYouSummary,
  QuickActions,
  ProgressSummary,
  DashboardMeta,
} from './dashboard.types';

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class DashboardService {
  private readonly progressRepo: ProgressRepository;
  private readonly roadmapRepo: RoadmapRepository;
  private readonly missionRepo: MissionRepository;
  private readonly goalHealthRepo: GoalHealthRepository;
  private readonly executionIntelligenceRepo: ExecutionIntelligenceRepository;
  private readonly deadlineRescueRepo: DeadlineRescueRepository;
  private readonly futureYouRepo: FutureYouRepository;
  private readonly roadmapProgressRepo: RoadmapProgressRepository;

  constructor(
    progressRepo: ProgressRepository,
    roadmapRepo: RoadmapRepository,
    missionRepo: MissionRepository,
    goalHealthRepo: GoalHealthRepository,
    executionIntelligenceRepo: ExecutionIntelligenceRepository,
    deadlineRescueRepo: DeadlineRescueRepository,
    futureYouRepo: FutureYouRepository,
    roadmapProgressRepo: RoadmapProgressRepository,
  ) {
    this.progressRepo = progressRepo;
    this.roadmapRepo = roadmapRepo;
    this.missionRepo = missionRepo;
    this.goalHealthRepo = goalHealthRepo;
    this.executionIntelligenceRepo = executionIntelligenceRepo;
    this.deadlineRescueRepo = deadlineRescueRepo;
    this.futureYouRepo = futureYouRepo;
    this.roadmapProgressRepo = roadmapProgressRepo;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MAIN AGGREGATION METHOD
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Aggregates all dashboard data into a single object.
   * Minimizes database reads by batching and using cached repositories.
   * 
   * @param goal - Current user's goal (from app state or context)
   * @param displayName - User's display name for greeting
   * @returns Complete dashboard data object
   */
  async getDashboardData(
    goal: GoalInput | null,
    displayName?: string
  ): Promise<DashboardData> {
    const errors: string[] = [];

    // ─── Parallel data fetching ───────────────────────────────────────────────
    // Fetch all independent data sources in parallel to minimize latency
    const [
      roadmap,
      roadmapProgress,
      progress,
      goalHealth,
      executionIntelligence,
      deadlineRescue,
      futureYou,
    ] = await Promise.all([
      this.roadmapRepo.getActiveRoadmap().catch((e) => { errors.push('roadmap'); console.error(e); return null; }),
      this.roadmapProgressRepo.getProgress().catch((e) => { errors.push('roadmapProgress'); console.error(e); return null; }),
      this.progressRepo.getProgress().catch((e) => { errors.push('progress'); console.error(e); return null; }),
      this.goalHealthRepo.getHealth().catch((e) => { errors.push('goalHealth'); console.error(e); return null; }),
      this.executionIntelligenceRepo.getIntelligence().catch((e) => { errors.push('executionIntelligence'); console.error(e); return null; }),
      this.deadlineRescueRepo.getRescueStrategy().catch((e) => { errors.push('deadlineRescue'); console.error(e); return null; }),
      this.futureYouRepo.getLatest().catch((e) => { errors.push('futureYou'); console.error(e); return null; }),
    ]);

    // ─── Fetch today's mission ────────────────────────────────────────────────
    let todaysMission = null;
    if (roadmapProgress) {
      const currentWeek = roadmapProgress.currentWeek;
      const currentDayInWeek = this.getCurrentDayInWeek(roadmapProgress);
      if (currentDayInWeek > 0 && currentDayInWeek <= 7) {
        todaysMission = await this.missionRepo
          .getMission(currentWeek, currentDayInWeek)
          .catch((e) => { errors.push('mission'); console.error(e); return null; });
      }
    }

    // ─── Compute dashboard sections ───────────────────────────────────────────
    const greeting = this.computeGreeting(displayName);
    const goalSummary = goal ? this.computeGoalSummary(goal) : null;
    const roadmapSummary = roadmap && roadmapProgress
      ? this.computeRoadmapSummary(roadmap, roadmapProgress)
      : null;
    const missionSummary = todaysMission && roadmapProgress
      ? await this.computeMissionSummary(todaysMission, roadmapProgress, progress)
      : null;
    const goalHealthSummary = goalHealth
      ? this.computeGoalHealthSummary(goalHealth)
      : null;
    const xpSummary = await this.computeXPSummary(progress);
    const streakSummary = await this.computeStreakSummary(progress);
    const deadlineSummary = goal && goalHealth
      ? this.computeDeadlineSummary(goal, goalHealth)
      : null;
    const deadlineRescueSummary = deadlineRescue
      ? this.computeDeadlineRescueSummary(deadlineRescue)
      : null;
    const executionIntelligenceSummary = executionIntelligence
      ? this.computeExecutionIntelligenceSummary(executionIntelligence)
      : null;
    const futureYouSummary = this.computeFutureYouSummary(futureYou);
    const quickActions = this.computeQuickActions(
      roadmapProgress,
      missionSummary,
      roadmap,
      goalHealth,
      futureYou,
      deadlineRescue
    );
    const progressSummary = await this.computeProgressSummary(
      roadmap,
      roadmapProgress,
      progress
    );
    const meta = this.computeMeta(errors, goalHealth, executionIntelligence, futureYou);

    return {
      greeting,
      goal: goalSummary,
      roadmap: roadmapSummary,
      mission: missionSummary,
      goalHealth: goalHealthSummary,
      xp: xpSummary,
      streak: streakSummary,
      deadline: deadlineSummary,
      deadlineRescue: deadlineRescueSummary,
      executionIntelligence: executionIntelligenceSummary,
      futureYou: futureYouSummary,
      quickActions,
      progress: progressSummary,
      meta,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // COMPUTATION HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════

  private computeGreeting(displayName?: string): UserGreeting {
    const now = new Date();
    const hour = now.getHours();
    
    let message = 'Good Morning';
    if (hour >= 12 && hour < 17) message = 'Good Afternoon';
    else if (hour >= 17) message = 'Good Evening';

    return {
      message,
      displayName,
      currentTime: now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      currentDate: now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
    };
  }

  private computeGoalSummary(goal: GoalInput): GoalSummary {
    const deadline = new Date(goal.deadline);
    const now = new Date();
    const remainingDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      goal: goal.goal,
      goalType: goal.goalType,
      deadline: goal.deadline,
      remainingDays,
      executionMode: '', // Will be populated from goal analysis if needed
      difficulty: '',    // Will be populated from goal analysis if needed
      feasibility: '',   // Will be populated from goal analysis if needed
      weeklyHours: goal.weeklyHours,
    };
  }

  private computeRoadmapSummary(
    roadmap: Roadmap,
    roadmapProgress: RoadmapProgress
  ): RoadmapSummary {
    const currentWeek = roadmapProgress.currentWeek;
    const totalWeeks = roadmap.totalWeeks;
    const completedWeeks = roadmapProgress.completedWeeks;
    const remainingWeeks = Math.max(0, totalWeeks - currentWeek + 1);

    // Find current week's progress
    const currentWeekStatus = roadmapProgress.weekStatuses.find(
      (ws) => ws.weekNumber === currentWeek
    );
    const currentWeekProgress = currentWeekStatus?.completionPercent || 0;

    return {
      title: roadmap.title,
      currentWeek,
      totalWeeks,
      completedWeeks,
      remainingWeeks,
      currentWeekProgress,
      version: 1, // Will be populated from active pointer if needed
      generatedAt: roadmap.generatedAt,
    };
  }

  private async computeMissionSummary(
    mission: any,
    roadmapProgress: RoadmapProgress,
    progress: UserProgress | null
  ): Promise<MissionSummary> {
    const currentWeek = roadmapProgress.currentWeek;
    const currentDay = this.getCurrentDayInWeek(roadmapProgress);
    
    // Get day progress for today
    const dayKey = `w${currentWeek}-d${currentDay}`;
    const dayProgress = progress?.days[dayKey];

    const allTasks = [
      ...(mission.learningTasks || []),
      ...(mission.practiceTasks || []),
      ...(mission.revisionTasks || []),
    ];
    const totalTasks = allTasks.length;
    const completedTasks = dayProgress?.tasks.filter((t) => t.completed).length || 0;
    const completionPercent = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    return {
      title: mission.title || 'Today\'s Mission',
      weekNumber: currentWeek,
      dayNumber: currentDay,
      estimatedHours: mission.estimatedHours || 0,
      totalTasks,
      completedTasks,
      completionPercent,
      completed: completionPercent === 100,
      generatedAt: mission.generatedAt,
    };
  }

  private computeGoalHealthSummary(goalHealth: any): GoalHealthSummary {
    return {
      score: goalHealth.score,
      level: goalHealth.level,
      summary: goalHealth.summary,
      burnoutRisk: goalHealth.burnoutRisk,
      deadlineStatus: goalHealth.deadlineStatus,
      estimatedCompletionDate: goalHealth.estimatedCompletionDate,
      estimatedDaysRemaining: goalHealth.estimatedDaysRemaining,
      overallCompletion: goalHealth.overallCompletion,
      topStrengths: goalHealth.strengths?.slice(0, 3) || [],
      topWeaknesses: goalHealth.weaknesses?.slice(0, 3).map((w: any) => 
        typeof w === 'string' ? w : w.title
      ) || [],
      trend: goalHealth.trend?.direction,
      computedAt: goalHealth.computedAt,
    };
  }

  private async computeXPSummary(progress: UserProgress | null): Promise<XPSummary> {
    const totalXP = progress?.totalXP || 0;
    const level = Math.floor(totalXP / 500) + 1;
    const currentXP = totalXP % 500;
    const nextLevelXP = 500;
    const progressPercent = Math.round((currentXP / nextLevelXP) * 100);

    return {
      totalXP,
      level,
      currentXP,
      nextLevelXP,
      progress: progressPercent,
    };
  }

  private async computeStreakSummary(progress: UserProgress | null): Promise<StreakSummary> {
    const streak = progress?.streak || {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
      totalActiveDays: 0,
    };

    const today = new Date().toISOString().split('T')[0];
    const isActiveToday = streak.lastActiveDate === today;
    
    // Streak bonus at milestones: 3, 7, 14, 30 days
    const milestones = [3, 7, 14, 30, 60, 100];
    const streakBonus = milestones.includes(streak.currentStreak);

    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActiveDate: streak.lastActiveDate,
      totalActiveDays: streak.totalActiveDays,
      isActiveToday,
      streakBonus,
    };
  }

  private computeDeadlineSummary(
    goal: GoalInput,
    goalHealth: any
  ): DeadlineSummary {
    const deadline = new Date(goal.deadline);
    const now = new Date();
    const remainingDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    const estimatedCompletion = new Date(goalHealth.estimatedCompletionDate);
    const buffer = Math.ceil((deadline.getTime() - estimatedCompletion.getTime()) / (1000 * 60 * 60 * 24));
    
    const onTrack = buffer >= 0;

    return {
      deadline: goal.deadline,
      remainingDays,
      estimatedCompletion: goalHealth.estimatedCompletionDate,
      buffer,
      status: goalHealth.deadlineStatus,
      onTrack,
    };
  }

  private computeDeadlineRescueSummary(deadlineRescue: any): DeadlineRescueSummary {
    const active = deadlineRescue.status === 'active' || deadlineRescue.status === 'critical';
    
    const topActions = deadlineRescue.recoveryActions
      ?.slice(0, 3)
      .map((action: any) => action.description) || [];

    return {
      active,
      status: deadlineRescue.status,
      reason: deadlineRescue.reason,
      daysBehind: deadlineRescue.daysBehind,
      recoveryProbability: deadlineRescue.recoveryProbability,
      topActions,
      estimatedCompletion: deadlineRescue.estimatedCompletion,
      computedAt: deadlineRescue.computedAt,
    };
  }

  private computeExecutionIntelligenceSummary(
    executionIntelligence: any
  ): ExecutionIntelligenceSummary {
    return {
      overallPerformance: executionIntelligence.overallPerformance,
      interviewReadiness: executionIntelligence.interviewReadiness,
      burnoutRisk: executionIntelligence.burnoutRisk,
      deadlineRisk: executionIntelligence.deadlineRisk,
      topStrengths: executionIntelligence.strengths?.slice(0, 3) || [],
      topWeaknesses: executionIntelligence.weaknesses?.slice(0, 3) || [],
      topPatterns: executionIntelligence.behaviourPatterns?.slice(0, 3) || [],
      motivationalMessage: executionIntelligence.motivationalMessage,
      computedAt: executionIntelligence.computedAt,
    };
  }

  private computeFutureYouSummary(futureYou: any | null): FutureYouSummary {
    if (!futureYou) {
      return { available: false };
    }

    return {
      available: true,
      narrative: futureYou.careerNarrative,
      estimatedInterviewConfidence: futureYou.estimatedInterviewConfidence,
      internshipReadiness: futureYou.internshipReadiness,
      topPredictedSkills: futureYou.predictedSkills?.slice(0, 3) || [],
      predictedAt: futureYou.predictedAt,
    };
  }

  private computeQuickActions(
    roadmapProgress: RoadmapProgress | null,
    missionSummary: MissionSummary | null,
    roadmap: Roadmap | null,
    goalHealth: any | null,
    futureYou: any | null,
    deadlineRescue: any | null
  ): QuickActions {
    const canStartMission = !!roadmapProgress && !missionSummary;
    const canContinueMission = !!missionSummary && !missionSummary.completed;
    const canViewRoadmap = !!roadmap;
    const canCheckGoalHealth = !!roadmapProgress; // Can check if roadmap exists
    const canViewFutureYou = !!futureYou;
    const canActivateRescue = !!goalHealth && 
      goalHealth.deadlineStatus === 'critical' && 
      !deadlineRescue;

    return {
      canStartMission,
      canContinueMission,
      canViewRoadmap,
      canCheckGoalHealth,
      canViewFutureYou,
      canActivateRescue,
    };
  }

  private async computeProgressSummary(
    roadmap: Roadmap | null,
    roadmapProgress: RoadmapProgress | null,
    progress: UserProgress | null
  ): Promise<ProgressSummary> {
    const overallCompletion = roadmapProgress?.overallCompletion || 0;
    const completedTasks = roadmapProgress?.completedTasks || 0;
    const completedDays = roadmapProgress?.completedDays || 0;
    const completedWeeks = roadmapProgress?.completedWeeks || 0;
    const totalWeeks = roadmap?.totalWeeks || 0;
    const achievementCount = progress?.achievements?.length || 0;

    // Compute total tasks from roadmap
    let totalTasks = 0;
    if (roadmap) {
      totalTasks = roadmap.weeks.length * 7 * 5; // Rough estimate: 5 tasks per day, 7 days per week
    }

    // Compute consistency rate
    const startedDays = Object.keys(progress?.days || {}).length;
    const consistencyRate = startedDays > 0
      ? Math.round((completedDays / startedDays) * 100)
      : 0;

    return {
      overallCompletion,
      completedTasks,
      totalTasks: Math.max(totalTasks, completedTasks),
      completedDays,
      completedWeeks,
      totalWeeks,
      achievementCount,
      consistencyRate,
    };
  }

  private computeMeta(
    errors: string[],
    goalHealth: any | null,
    executionIntelligence: any | null,
    futureYou: any | null
  ): DashboardMeta {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check for stale data
    let hasStaleData = false;
    if (goalHealth && new Date(goalHealth.computedAt) < oneDayAgo) hasStaleData = true;
    if (executionIntelligence && new Date(executionIntelligence.computedAt) < oneDayAgo) hasStaleData = true;
    if (futureYou && new Date(futureYou.predictedAt) < oneDayAgo) hasStaleData = true;

    return {
      generatedAt: now.toISOString(),
      hasStaleData,
      errors,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // UTILITY HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Computes the current day in the week (1-7) based on roadmap progress.
   * Returns 0 if unable to determine.
   */
  private getCurrentDayInWeek(roadmapProgress: RoadmapProgress): number {
    const currentWeekStatus = roadmapProgress.weekStatuses.find(
      (ws) => ws.weekNumber === roadmapProgress.currentWeek
    );
    
    if (!currentWeekStatus) return 1; // Default to day 1
    
    // Next day to generate is generatedDays + 1
    return Math.min(currentWeekStatus.generatedDays + 1, 7);
  }
}
