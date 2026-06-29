/**
 * @file MissionRepository.ts
 *
 * Abstract interface for persisting generated daily missions.
 *
 * ─── ARCHITECTURE RULE ────────────────────────────────────────────────────────
 * Missions are generated ONCE and stored here permanently.
 * DailyMissionPage always checks the repository first.
 * Gemini is only called when no mission exists for that week/day.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { DailyMission } from '../ai/dailyMission/dailyMission.schema';

export interface MissionRepository {
  /**
   * Saves a generated mission for a specific week/day.
   * Idempotent — calling again with the same key overwrites only if force=true.
   */
  saveMission(weekNumber: number, dayNumber: number, mission: DailyMission): Promise<void>;

  /**
   * Returns the stored mission for a week/day, or null if not yet generated.
   */
  getMission(weekNumber: number, dayNumber: number): Promise<DailyMission | null>;

  /**
   * Returns true if a mission already exists for this week/day.
   */
  hasMission(weekNumber: number, dayNumber: number): Promise<boolean>;
}
