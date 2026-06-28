/**
 * @file goal.ts
 *
 * Re-exports goal-related types from the unified domain model.
 *
 * ── SOURCE OF TRUTH ──────────────────────────────────────────────────
 * All type definitions live in src/types/domain.ts.
 * This file exists purely for backward-compatible import paths.
 * Existing imports from '../types/goal' continue to work unchanged.
 * New code should import from '../types/domain' directly.
 * ─────────────────────────────────────────────────────────────────────
 */

export type {
  GoalType,
  SkillLevel,
  LearningStyle,
  Skill,
  GoalInput,
} from './domain';
