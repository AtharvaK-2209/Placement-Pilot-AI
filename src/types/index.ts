/**
 * @file types/index.ts
 *
 * Barrel export for the unified domain model.
 * New code can import everything from 'src/types'.
 *
 * Example:
 *   import type { GoalInput, Roadmap, DailyMission } from '../types';
 */

export type * from './domain';
export type * from './appState';
// goal.ts and progress.ts re-export subsets of domain.ts —
// importing from './domain' directly is preferred for new code.
