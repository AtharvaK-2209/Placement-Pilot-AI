/**
 * @file progress.ts
 *
 * Re-exports progress-related types from the unified domain model.
 *
 * ── SOURCE OF TRUTH ──────────────────────────────────────────────────
 * All type definitions live in src/types/domain.ts.
 * This file exists purely for backward-compatible import paths.
 * Existing imports from '../types/progress' continue to work unchanged.
 * New code should import from '../types/domain' directly.
 * ─────────────────────────────────────────────────────────────────────
 */

export type {
  TaskCompletion,
  DayProgress,
  WeekProgress,
  OverallProgress,
  XPSource,
  XPEntry,
  LevelInfo,
  StreakState,
  Achievement,
  UserProgress,
} from './domain';
