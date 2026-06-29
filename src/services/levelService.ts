/**
 * @file levelService.ts
 *
 * Service for managing user levels and XP progression.
 * Computes current level, progress to next level, and level titles.
 *
 * ── PHASE 10 ─────────────────────────────────────────────────────────
 * Extends the existing XP system with configurable level thresholds.
 * ─────────────────────────────────────────────────────────────────────
 */

import type { ProgressRepository } from '../repositories/ProgressRepository';
import type { LevelState } from '../types/domain';
import { LEVEL_THRESHOLDS } from '../config/gamificationConfig';

export class LevelService {
  private readonly repo: ProgressRepository;

  constructor(repo: ProgressRepository) {
    this.repo = repo;
  }

  /**
   * Computes the current level state from total XP.
   * Uses configured level thresholds to determine level and progress.
   */
  async getLevelState(): Promise<LevelState> {
    const totalXP = await this.repo.getTotalXP();
    
    // Find current level
    let currentLevel = 1;
    let currentThreshold = LEVEL_THRESHOLDS[0];
    let nextThreshold = LEVEL_THRESHOLDS[1];

    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (totalXP >= LEVEL_THRESHOLDS[i].xpRequired) {
        currentLevel = LEVEL_THRESHOLDS[i].level;
        currentThreshold = LEVEL_THRESHOLDS[i];
        nextThreshold = LEVEL_THRESHOLDS[i + 1] || {
          level: currentLevel + 1,
          xpRequired: currentThreshold.xpRequired + 5000,
          title: 'Legend',
        };
        break;
      }
    }

    const currentXP = totalXP - currentThreshold.xpRequired;
    const nextLevelXP = nextThreshold.xpRequired - currentThreshold.xpRequired;
    const progress = Math.min(100, Math.round((currentXP / nextLevelXP) * 100));

    return {
      level: currentLevel,
      currentXP,
      nextLevelXP,
      progress,
      title: currentThreshold.title,
    };
  }

  /**
   * Returns the level for a given XP amount.
   * Used for checking if a level-up occurred after XP award.
   */
  getLevelForXP(xp: number): number {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i].xpRequired) {
        return LEVEL_THRESHOLDS[i].level;
      }
    }
    return 1;
  }

  /**
   * Checks if adding XP would cause a level-up.
   * Returns the new level if yes, or null if no level change.
   */
  async checkLevelUp(xpToAdd: number): Promise<number | null> {
    const currentTotal = await this.repo.getTotalXP();
    const currentLevel = this.getLevelForXP(currentTotal);
    const newLevel = this.getLevelForXP(currentTotal + xpToAdd);
    
    return newLevel > currentLevel ? newLevel : null;
  }
}
