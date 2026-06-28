/**
 * @file useProgress.ts
 *
 * React hook that bridges the service layer with UI components.
 * Components import this hook — they never call services or the repository directly.
 *
 * All XP awards, streak recording, and achievement checks flow through here
 * so the logic stays in one place and pages stay declarative.
 */

import { useState, useEffect, useCallback } from 'react';
import { ProgressService }    from '../services/progressService';
import { XPService }          from '../services/xpService';
import { StreakService }      from '../services/streakService';
import { AchievementService } from '../services/achievementService';
import { useRepository }      from './useRepository';
import type { DailyMission }  from '../ai/dailyMission/dailyMission.schema';
import type { DayProgress, StreakState, Achievement } from '../types/progress';

// ── Re-export service classes (for direct use where repo is available) ────────
export { ProgressService, XPService, StreakService, AchievementService };

// ─── useProgress ─────────────────────────────────────────────────────────────

export interface ProgressState {
  dayProgress:    DayProgress | null;
  totalXP:        number;
  streak:         StreakState;
  achievements:   Achievement[];
  levelInfo:      { level: number; currentXP: number; nextLevelXP: number; progress: number };
  newlyUnlocked:  Achievement[];   // achievements unlocked this session — cleared after display
  loading:        boolean;
}

const DEFAULT_STREAK: StreakState = {
  currentStreak: 0, longestStreak: 0, lastActiveDate: '', totalActiveDays: 0,
};
const DEFAULT_LEVEL  = { level: 1, currentXP: 0, nextLevelXP: 500, progress: 0 };

/**
 * Hook for the DailyMissionPage.
 * Loads progress for a specific week/day, handles task toggling + XP awards.
 */
export function useDayProgress(
  weekNumber: number,
  dayNumber:  number,
  mission:    DailyMission | null,
  roadmapTitle: string,
) {
  const repo = useRepository();

  // Create service instances bound to the correct repo (localStorage or Firestore)
  const progressSvc    = new ProgressService(repo);
  const xpSvc          = new XPService(repo);
  const streakSvc      = new StreakService(repo);
  const achievementSvc = new AchievementService(repo);
  const [state, setState] = useState<ProgressState>({
    dayProgress:   null,
    totalXP:       0,
    streak:        DEFAULT_STREAK,
    achievements:  [],
    levelInfo:     DEFAULT_LEVEL,
    newlyUnlocked: [],
    loading:       true,
  });

  // Load persisted state and open/init the day when mission becomes available
  const load = useCallback(async () => {
    if (!mission) return;
    setState((s) => ({ ...s, loading: true }));

    await progressSvc.initProgress(roadmapTitle);
    const dayProgress  = await progressSvc.openDay(weekNumber, dayNumber, mission);
    const totalXP      = await xpSvc.getTotal();
    const streak       = await streakSvc.getStreak();
    const achievements = await achievementSvc.getAll();
    const levelInfo    = await xpSvc.getLevelInfo();

    setState({ dayProgress, totalXP, streak, achievements, levelInfo, newlyUnlocked: [], loading: false });
  }, [weekNumber, dayNumber, mission, roadmapTitle, repo]);

  useEffect(() => { load(); }, [load]);

  // ── Task toggle ─────────────────────────────────────────────────────────────

  const toggleTask = useCallback(async (taskTitle: string, currentlyDone: boolean) => {
    const nowDone = !currentlyDone;
    const updatedDay = await progressSvc.completeTask(weekNumber, dayNumber, taskTitle, nowDone);
    if (!updatedDay) return;

    const newlyUnlocked: Achievement[] = [];

    if (nowDone) {
      await xpSvc.award('task_complete', `Task: ${taskTitle}`);
    }

    const allDone = updatedDay.tasks.every((t: { completed: boolean }) => t.completed);
    if (allDone && nowDone) {
      await xpSvc.award('day_complete', `Day ${dayNumber} complete`);
      const updatedStreak = await streakSvc.recordActiveDay();
      if (await streakSvc.shouldAwardStreakBonus()) {
        await xpSvc.award('streak_bonus', `${updatedStreak.currentStreak}-day streak!`);
      }
      const firstMission = await achievementSvc.unlock('first_mission');
      if (firstMission) newlyUnlocked.push(firstMission);
      if (updatedStreak.currentStreak >= 3) {
        const a = await achievementSvc.unlock('three_day_streak');
        if (a) newlyUnlocked.push(a);
      }
      if (updatedStreak.currentStreak >= 7) {
        const a = await achievementSvc.unlock('seven_day_streak');
        if (a) newlyUnlocked.push(a);
      }
    }

    const totalXP  = await xpSvc.getTotal();
    if (totalXP >= 100)  { const a = await achievementSvc.unlock('hundred_xp');     if (a) newlyUnlocked.push(a); }
    if (totalXP >= 500)  { const a = await achievementSvc.unlock('five_hundred_xp'); if (a) newlyUnlocked.push(a); }

    const streak       = await streakSvc.getStreak();
    const achievements = await achievementSvc.getAll();
    const levelInfo    = await xpSvc.getLevelInfo();

    setState((prev) => ({
      ...prev,
      dayProgress:   updatedDay,
      totalXP,
      streak,
      achievements,
      levelInfo,
      newlyUnlocked: [...prev.newlyUnlocked, ...newlyUnlocked],
    }));
  }, [weekNumber, dayNumber, repo]);

  const clearNewlyUnlocked = useCallback(() => {
    setState((s) => ({ ...s, newlyUnlocked: [] }));
  }, []);

  return { state, toggleTask, clearNewlyUnlocked, reload: load };
}
