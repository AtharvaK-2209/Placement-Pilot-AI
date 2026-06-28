/**
 * @file ProgressRepository.ts
 *
 * Abstract interface for all progress storage operations.
 *
 * ─── ARCHITECTURE RULE ────────────────────────────────────────────────────────
 * Business logic (services, AI agents, React components) must depend ONLY on
 * this interface — never on a concrete implementation.
 *
 * This ensures that swapping localStorage → Firestore → any future backend
 * requires changing ONLY the instantiation site (src/repositories/index.ts),
 * with zero changes to services, agents, or UI components.
 *
 * Implementations:
 *   LocalStorageProgressRepository  — src/repositories/LocalStorageProgressRepository.ts
 *   FirestoreProgressRepository     — src/repositories/FirestoreProgressRepository.ts (future)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type {
  UserProgress,
  DayProgress,
  XPEntry,
  StreakState,
  Achievement,
} from '../types/progress';

// ─── ProgressRepository ────────────────────────────────────────────────────────

export interface ProgressRepository {

  // ── Full aggregate ──────────────────────────────────────────────────────────

  /**
   * Returns the complete UserProgress for the active roadmap,
   * or null if no progress has been saved yet.
   */
  getProgress(): Promise<UserProgress | null>;

  /**
   * Persists the complete UserProgress object.
   * Overwrites any existing saved state.
   * Used for bulk operations and initial save.
   */
  saveProgress(progress: UserProgress): Promise<void>;

  /**
   * Clears all stored progress for the active roadmap.
   * Used when starting a new goal or resetting the current one.
   */
  resetProgress(): Promise<void>;

  // ── Day & task granularity ───────────────────────────────────────────────────

  /**
   * Returns the DayProgress for a specific week/day combination,
   * or null if that day has not been started yet.
   */
  getDayProgress(weekNumber: number, dayNumber: number): Promise<DayProgress | null>;

  /**
   * Creates or fully replaces the DayProgress for a given week/day.
   * Called when a day's mission is first generated.
   */
  saveDayProgress(day: DayProgress): Promise<void>;

  /**
   * Updates the completion state of a single task within a day.
   * The repository is responsible for recomputing completionPercent
   * and setting completedAt on the day when all tasks are done.
   */
  updateTask(
    weekNumber:   number,
    dayNumber:    number,
    taskTitle:    string,
    completed:    boolean,
  ): Promise<void>;

  // ── XP ──────────────────────────────────────────────────────────────────────

  /**
   * Returns the current total XP, or 0 if none has been earned yet.
   */
  getTotalXP(): Promise<number>;

  /**
   * Appends an XP entry to the log and increments the running total.
   */
  addXP(entry: XPEntry): Promise<void>;

  /**
   * Returns the full XP event log in chronological order.
   */
  getXPLog(): Promise<XPEntry[]>;

  // ── Streak ──────────────────────────────────────────────────────────────────

  /**
   * Returns the current StreakState, or a zero-state if not yet initialised.
   */
  getStreak(): Promise<StreakState>;

  /**
   * Overwrites the StreakState.
   * The streak service computes the new state; the repository only stores it.
   */
  updateStreak(streak: StreakState): Promise<void>;

  // ── Achievements ────────────────────────────────────────────────────────────

  /**
   * Returns all unlocked achievements in unlock order.
   */
  getAchievements(): Promise<Achievement[]>;

  /**
   * Appends a newly unlocked achievement.
   * Idempotent — adding a duplicate achievement id is a no-op.
   */
  addAchievement(achievement: Achievement): Promise<void>;
}
