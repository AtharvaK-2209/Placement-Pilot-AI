/**
 * @file dailyMission.schema.ts
 *
 * Schema layer for the Daily Mission Agent.
 *
 * AGENT RESPONSIBILITY — Daily Mission Agent
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsible for:
 *   ✓ Converting one roadmap week into a single day's actionable plan
 *   ✓ Distributing the week's workload across days
 *   ✓ Calibrating task density to execution mode
 *   ✓ Providing a motivational note for the day
 *
 * Does NOT:
 *   ✗ Regenerate the roadmap
 *   ✗ Decide which topics to study (roadmap already decided this)
 *   ✗ Track progress or completions
 *   ✗ Know about other weeks
 *
 * Future agents that consume DailyMission:
 *   • Progress Tracking Agent  — marks tasks complete, calculates %
 *   • Dynamic Replanning Agent — regenerates missions on missed days
 *   • Streak Agent             — reads completed field for streak logic
 *
 * Extensibility:
 *   Fields marked "future" are reserved for later phases.
 *   Consumers should never crash if these fields are absent.
 */

// ─── Task ──────────────────────────────────────────────────────────────────────

/**
 * A single atomic task inside a daily mission.
 * Kept generic so Progress, Streak, and XP agents can attach metadata later.
 */
export interface MissionTask {
  /** Short label shown in the UI. */
  title: string;

  /**
   * Estimated minutes to complete this task.
   * Whole numbers only.
   */
  estimatedMinutes: number;

  /**
   * Task category — drives icon and card colour in the UI.
   * - "learning"  — concept study
   * - "practice"  — LeetCode / coding exercise
   * - "revision"  — review of previous material
   * - "project"   — build task or mini deliverable
   */
  type: 'learning' | 'practice' | 'revision' | 'project';

  // ── Future fields (Phase 4+) ──────────────────────────────────────────────
  // completed?: boolean;
  // completedAt?: string;   // ISO timestamp
  // xpReward?: number;
}

// ─── DailyMission ─────────────────────────────────────────────────────────────

/**
 * The complete daily mission returned by generateDailyMission().
 *
 * Designed to be generic enough that all future agents can consume it
 * without schema changes — new fields can be added as optional extensions.
 */
export interface DailyMission {
  /**
   * Display title for the day's mission.
   * Example: "Day 3 — Arrays & Java Collections"
   */
  title: string;

  /**
   * Total estimated hours for the day (sum of all task minutes / 60).
   * Floating point to one decimal. Example: 2.5
   */
  estimatedHours: number;

  /**
   * Learning tasks — concept study, reading, watching.
   * Derived from the week's module concepts.
   */
  learningTasks: MissionTask[];

  /**
   * Practice tasks — LeetCode problems, coding exercises.
   * Derived from the week's module practice items.
   */
  practiceTasks: MissionTask[];

  /**
   * Revision tasks — review of previous day / week material.
   * Always included when day > 1 to reinforce retention.
   */
  revisionTasks: MissionTask[];

  /**
   * A single milestone string the user should achieve today.
   * Example: "Implement Binary Search from memory"
   */
  milestone: string;

  /**
   * Optional 1–2 sentence motivational note personalized to the day.
   */
  motivation?: string;

  // ── Future fields (Phase 4+) ──────────────────────────────────────────────
  // weekNumber?: number;
  // dayNumber?: number;
  // completed?: boolean;
  // difficultyRating?: 'Easy' | 'Medium' | 'Hard';
}

// ─── DailyMissionInput ────────────────────────────────────────────────────────

/**
 * Input contract for generateDailyMission().
 * Accepts exactly what is available from the roadmap — nothing else.
 */
export interface DailyMissionInput {
  /** The specific roadmap week to generate missions for. */
  week: import('../schemas/roadmap.schema').RoadmapWeek;

  /**
   * Day number within the week (1–7).
   * Influences task distribution — heavier on day 1, lighter on day 7.
   */
  dayNumber: number;

  /**
   * Execution mode from GoalAnalysis — calibrates task density.
   * Intensive/Extreme → more tasks. Relaxed → fewer.
   */
  executionMode: string;

  /**
   * Weekly study hours from GoalInput.
   * Used to compute per-day hour budget (weeklyHours / 5 active days).
   */
  weeklyHours: number;
}

// ─── DailyMissionResponse ─────────────────────────────────────────────────────

/**
 * Standard { success, data } envelope — same pattern across all agents.
 */
export interface DailyMissionResponse {
  success: boolean;
  data: DailyMission;
}
