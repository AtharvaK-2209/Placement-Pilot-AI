/**
 * @file services/index.ts
 *
 * Service registry — creates all service instances wired to the active repository.
 *
 * Components and hooks import from here, never instantiating services directly.
 * Changing the repository (src/repositories/index.ts) automatically propagates
 * to all services with no further changes required.
 */

import { progressRepository }  from '../repositories/index';
import { ProgressService }     from './progressService';
import { XPService }           from './xpService';
import { StreakService }        from './streakService';
import { AchievementService }  from './achievementService';

export const progressService    = new ProgressService(progressRepository);
export const xpService          = new XPService(progressRepository);
export const streakService      = new StreakService(progressRepository);
export const achievementService = new AchievementService(progressRepository);

// Re-export types for convenience
export type { ProgressRepository } from '../repositories/ProgressRepository';
export { ACHIEVEMENT_CATALOGUE }   from './achievementService';
