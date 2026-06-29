/**
 * @file milestoneService.ts
 *
 * Service for tracking user milestones.
 * Manages milestone unlocks and provides milestone state.
 *
 * ── PHASE 10 ─────────────────────────────────────────────────────────
 * Milestone tracking for key journey events.
 * ─────────────────────────────────────────────────────────────────────
 */

import type { ProgressRepository } from '../repositories/ProgressRepository';
import type { Milestone } from '../types/domain';
import { MILESTONE_DEFINITIONS } from '../config/gamificationConfig';

export class MilestoneService {
  private readonly repo: ProgressRepository;

  constructor(repo: ProgressRepository) {
    this.repo = repo;
  }

  /**
   * Initializes all milestones in locked state.
   */
  private initializeMilestones(): Milestone[] {
    return MILESTONE_DEFINITIONS.map(def => ({
      ...def,
      unlocked: false,
      unlockedAt: undefined,
    }));
  }

  /**
   * Returns all milestones (locked and unlocked).
   */
  async getAllMilestones(): Promise<Milestone[]> {
    const progress = await this.repo.getProgress();
    if (!progress?.milestones) {
      return this.initializeMilestones();
    }
    return progress.milestones;
  }

  /**
   * Returns only unlocked milestones.
   */
  async getUnlockedMilestones(): Promise<Milestone[]> {
    const milestones = await this.getAllMilestones();
    return milestones.filter(m => m.unlocked);
  }

  /**
   * Returns only locked milestones.
   */
  async getLockedMilestones(): Promise<Milestone[]> {
    const milestones = await this.getAllMilestones();
    return milestones.filter(m => !m.unlocked);
  }

  /**
   * Unlocks a milestone by ID.
   * Idempotent — unlocking an already unlocked milestone is a no-op.
   * Returns the unlocked milestone or null if not found.
   */
  async unlockMilestone(milestoneId: string): Promise<Milestone | null> {
    const progress = await this.repo.getProgress();
    if (!progress) return null;

    const milestones = progress.milestones || this.initializeMilestones();
    const milestoneIndex = milestones.findIndex(m => m.id === milestoneId);

    if (milestoneIndex === -1) {
      console.warn(`[MilestoneService] Milestone not found: ${milestoneId}`);
      return null;
    }

    const milestone = milestones[milestoneIndex];
    if (milestone.unlocked) {
      // Already unlocked
      return milestone;
    }

    // Unlock the milestone
    const unlockedMilestone: Milestone = {
      ...milestone,
      unlocked: true,
      unlockedAt: new Date().toISOString(),
    };

    milestones[milestoneIndex] = unlockedMilestone;

    await this.repo.saveProgress({
      ...progress,
      milestones,
    });

    return unlockedMilestone;
  }

  /**
   * Checks if a milestone is unlocked.
   */
  async isMilestoneUnlocked(milestoneId: string): Promise<boolean> {
    const milestones = await this.getAllMilestones();
    const milestone = milestones.find(m => m.id === milestoneId);
    return milestone?.unlocked || false;
  }

  /**
   * Returns the count of unlocked milestones.
   */
  async getUnlockedCount(): Promise<number> {
    const milestones = await this.getAllMilestones();
    return milestones.filter(m => m.unlocked).length;
  }

  /**
   * Returns the total count of milestones.
   */
  getTotalCount(): number {
    return MILESTONE_DEFINITIONS.length;
  }

  /**
   * Returns milestone completion percentage.
   */
  async getCompletionPercentage(): Promise<number> {
    const unlockedCount = await this.getUnlockedCount();
    const totalCount = this.getTotalCount();
    return Math.round((unlockedCount / totalCount) * 100);
  }
}
