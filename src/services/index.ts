/**
 * @file services/index.ts
 *
 * Central export for all service modules.
 * Provides a single import point for the entire service layer.
 */

// Core services
export { XPService } from './xpService';
export { ProgressService } from './progressService';

// Phase 10 Gamification services
export { LevelService } from './levelService';
export { BadgeService } from './badgeService';
export { StreakService } from './streakService';
export { WeeklyGoalService } from './weeklyGoalService';
export { MilestoneService } from './milestoneService';
export { GamificationService } from './gamificationService';

// Re-export types
export type { XPAwardResult, GamificationState } from './gamificationService';
