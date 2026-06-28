/**
 * @file xpService.ts
 *
 * Business logic for XP rewards.
 *
 * ─── DEPENDENCY RULE ─────────────────────────────────────────────────────────
 * Depends ONLY on ProgressRepository. Zero storage knowledge.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { ProgressRepository } from '../repositories/ProgressRepository';
import type { XPEntry, XPSource }  from '../types/progress';

// ─── XP reward table ──────────────────────────────────────────────────────────

const XP_REWARDS: Record<XPSource, number> = {
  task_complete:  10,
  day_complete:   50,
  week_complete:  200,
  streak_bonus:   25,
  milestone:      100,
  achievement:    150,
};

// ─── XP Service ───────────────────────────────────────────────────────────────

export class XPService {
  private readonly repo: ProgressRepository;
  constructor(repo: ProgressRepository) { this.repo = repo; }

  /**
   * Awards XP for a given source event.
   * Generates a stable id from timestamp + source to prevent duplicates.
   */
  async award(source: XPSource, description: string): Promise<number> {
    const amount = XP_REWARDS[source];
    const entry: XPEntry = {
      id:          `${Date.now()}-${source}`,
      source,
      amount,
      earnedAt:    new Date().toISOString(),
      description,
    };
    await this.repo.addXP(entry);
    return amount;
  }

  /** Returns the current total XP. */
  async getTotal(): Promise<number> {
    return this.repo.getTotalXP();
  }

  /** Returns the full XP log. */
  async getLog(): Promise<XPEntry[]> {
    return this.repo.getXPLog();
  }

  /** Returns the XP needed to reach the next level (every 500 XP = 1 level). */
  async getLevelInfo(): Promise<{ level: number; currentXP: number; nextLevelXP: number; progress: number }> {
    const total       = await this.repo.getTotalXP();
    const level       = Math.floor(total / 500) + 1;
    const currentXP   = total % 500;
    const nextLevelXP = 500;
    const progress    = Math.round((currentXP / nextLevelXP) * 100);
    return { level, currentXP, nextLevelXP, progress };
  }
}
