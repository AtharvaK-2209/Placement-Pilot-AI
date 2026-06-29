/**
 * @file roadmapProgress.ts
 *
 * Domain type for roadmap execution progress.
 * Stored at users/{uid}/roadmapProgress/current.
 * Never contains AI data — purely execution tracking.
 */

export interface WeekExecutionStatus {
  weekNumber:        number;
  generatedDays:     number;   // how many day missions have been generated
  completedDays:     number;   // days with completionPercent === 100
  completionPercent: number;   // 0–100
  status:            'locked' | 'unlocked' | 'in_progress' | 'completed';
}

export interface RoadmapProgress {
  /** 1-indexed current active week. */
  currentWeek:       number;
  /** 1-indexed: highest week the user has unlocked. */
  unlockedWeek:      number;
  completedWeeks:    number;
  completedTasks:    number;
  completedDays:     number;
  /** 0–100 overall roadmap completion. */
  overallCompletion: number;
  /** Per-week execution status. */
  weekStatuses:      WeekExecutionStatus[];
  /** Threshold (0–100) at which the next week unlocks. Default: 100. */
  unlockThreshold:   number;
  updatedAt:         string;
}
