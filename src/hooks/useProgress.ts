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
import { progressService }    from '../services/index';
import { xpService }          from '../services/index';
import { streakService }      from '../services/index';
import { achievementService } from '../services/index';
import type { DailyMission }  from '../ai/dailyMission/dailyMission.schema';
import type { DayProgress, StreakState, Achievement } from '../types/progress';

// ── Re-export for convenience ────────────────────────────────────────────────

// Services are singletons wired to the active repository.
export { progressService, xpService, streakService, achievementService };

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

    await progressService.initProgress(roadmapTitle);
    const dayProgress  = await progressService.openDay(weekNumber, dayNumber, mission);
    const totalXP      = await xpService.getTotal();
    const streak       = await streakService.getStreak();
    const achievements = await achievementService.getAll();
    const levelInfo    = await xpService.getLevelInfo();

    setState({ dayProgress, totalXP, streak, achievements, levelInfo, newlyUnlocked: [], loading: false });
  }, [weekNumber, dayNumber, mission, roadmapTitle]);

  useEffect(() => { load(); }, [load]);

  // ── Task toggle ─────────────────────────────────────────────────────────────

  const toggleTask = useCallback(async (taskTitle: string, currentlyDone: boolean) => {
    const nowDone = !currentlyDone;
    const updatedDay = await progressService.completeTask(weekNumber, dayNumber, taskTitle, nowDone);
    if (!updatedDay) return;

    const newlyUnlocked: Achievement[] = [];

    // Award XP for completing a task
    if (nowDone) {
      await xpService.award('task_complete', `Task: ${taskTitle}`);
    }

    // Check if all tasks are now done → day complete bonus
    const allDone = updatedDay.tasks.every((t: { completed: boolean }) => t.completed);
    if (allDone && nowDone) {
      await xpService.award('day_complete', `Day ${dayNumber} complete`);

      // Record active day for streak
      const updatedStreak = await streakService.recordActiveDay();

      // Streak bonus check
      if (await streakService.shouldAwardStreakBonus()) {
        await xpService.award('streak_bonus', `${updatedStreak.currentStreak}-day streak!`);
      }

      // First mission achievement
      const firstMission = await achievementService.unlock('first_mission');
      if (firstMission) newlyUnlocked.push(firstMission);

      // Streak achievements
      if (updatedStreak.currentStreak >= 3) {
        const a = await achievementService.unlock('three_day_streak');
        if (a) newlyUnlocked.push(a);
      }
      if (updatedStreak.currentStreak >= 7) {
        const a = await achievementService.unlock('seven_day_streak');
        if (a) newlyUnlocked.push(a);
      }
    }

    // XP milestone achievements
    const totalXP  = await xpService.getTotal();
    if (totalXP >= 100)  { const a = await achievementService.unlock('hundred_xp');     if (a) newlyUnlocked.push(a); }
    if (totalXP >= 500)  { const a = await achievementService.unlock('five_hundred_xp'); if (a) newlyUnlocked.push(a); }

    const streak      = await streakService.getStreak();
    const achievements = await achievementService.getAll();
    const levelInfo   = await xpService.getLevelInfo();

    setState((prev) => ({
      ...prev,
      dayProgress:   updatedDay,
      totalXP,
      streak,
      achievements,
      levelInfo,
      newlyUnlocked: [...prev.newlyUnlocked, ...newlyUnlocked],
    }));
  }, [weekNumber, dayNumber]);

  const clearNewlyUnlocked = useCallback(() => {
    setState((s) => ({ ...s, newlyUnlocked: [] }));
  }, []);

  return { state, toggleTask, clearNewlyUnlocked, reload: load };
}
