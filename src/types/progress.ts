/**
 * @file progress.ts
 *
 * Domain types for the Progress & XP System.
 *
 * These types are storage-agnostic — they describe business domain objects,
 * not storage formats. LocalStorageProgressRepository and
 * FirestoreProgressRepository both serialize/deserialize to/from these types.
 *
 * Never import localStorage, Firestore, or any storage SDK from this file.
 */

// ─── Task completion ───────────────────────────────────────────────────────────

/**
 * Records the completion status of a single task inside a daily mission.
 * The taskTitle is used as a stable identifier within a day.
 */
export interface TaskCompletion {
  taskTitle:    string;
  completed:    boolean;
  completedAt?: string; // ISO 8601 timestamp, set when completed = true
}

// ─── Daily progress ────────────────────────────────────────────────────────────

/**
 * Progress record for one day within one roadmap week.
 * Key: `week-${weekNumber}-day-${dayNumber}`  (managed by the repository)
 */
export interface DayProgress {
  weekNumber:   number;
  dayNumber:    number;

  /** The mission title generated for this day. */
  missionTitle: string;

  /** Individual task completion states. */
  tasks:        TaskCompletion[];

  /**
   * Percentage of tasks completed (0–100).
   * Derived field — recomputed on every update, never stored stale.
   */
  completionPercent: number;

  /** ISO 8601 timestamp of when the day's mission was first opened. */
  startedAt:    string;

  /** ISO 8601 timestamp of when the day was marked fully complete. */
  completedAt?: string;
}

// ─── Week progress ────────────────────────────────────────────────────────────

/**
 * Aggregated progress for one roadmap week.
 * Computed from its DayProgress records — never stored redundantly.
 */
export interface WeekProgress {
  weekNumber:        number;
  weekTitle:         string;
  completedDays:     number;
  totalDays:         number; // always 7
  completionPercent: number; // 0–100
  completed:         boolean;
  completedAt?:      string;
}

// ─── XP ───────────────────────────────────────────────────────────────────────

/**
 * XP ledger entry — one record per XP event.
 * Append-only; never mutated after creation.
 */
export interface XPEntry {
  id:          string; // UUID or timestamp-based key
  source:      XPSource;
  amount:      number;
  earnedAt:    string; // ISO 8601
  description: string; // human-readable label for the XP event
}

export type XPSource =
  | 'task_complete'
  | 'day_complete'
  | 'week_complete'
  | 'streak_bonus'
  | 'milestone'
  | 'achievement';

// ─── Streak ───────────────────────────────────────────────────────────────────

export interface StreakState {
  currentStreak:  number; // consecutive active days
  longestStreak:  number;
  lastActiveDate: string; // ISO 8601 date string ("YYYY-MM-DD")
  totalActiveDays: number;
}

// ─── Achievement ──────────────────────────────────────────────────────────────

export interface Achievement {
  id:          string;
  title:       string;
  description: string;
  unlockedAt:  string; // ISO 8601 timestamp
  icon?:       string; // future: emoji or asset key
}

// ─── User progress (root aggregate) ──────────────────────────────────────────

/**
 * The single root object managed by ProgressRepository.
 *
 * All other progress types are nested here.
 * When persisted to localStorage this is one JSON blob;
 * when migrated to Firestore it maps naturally to one document
 * with subcollections for days and XP entries.
 */
export interface UserProgress {
  /** Matches the roadmap title this progress belongs to. */
  roadmapTitle:  string;

  /** ISO 8601 timestamp of when the roadmap was started. */
  startedAt:     string;

  /** Day-keyed map: `"w${week}-d${day}"` → DayProgress */
  days:          Record<string, DayProgress>;

  /** Running total XP points. */
  totalXP:       number;

  /** XP event log. */
  xpLog:         XPEntry[];

  /** Current streak state. */
  streak:        StreakState;

  /** Unlocked achievements. */
  achievements:  Achievement[];

  /** ISO 8601 timestamp of last write. */
  updatedAt:     string;
}
