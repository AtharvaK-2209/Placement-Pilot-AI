/**
 * @file useProgress.ts
 *
 * React hook that bridges the service layer with UI components.
 *
 * Bug fixes (Phase 7.2):
 *   1. Service instances are memoised per-repo so they never go stale.
 *   2. initProgress guard: never wipes existing progress regardless of title.
 *   3. XP is awarded exactly once per task: guarded by checking persisted state
 *      BEFORE awarding, not just the React prop value.
 *   4. toggleTask is stable (useMemo services prevent stale-closure issues).
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProgressService }         from '../services/progressService';
import { XPService }               from '../services/xpService';
import { StreakService }            from '../services/streakService';
import { AchievementService }      from '../services/achievementService';
import { RoadmapProgressService }  from '../services/roadmapProgressService';
import { useRepository }           from './useRepository';
import { useRoadmapProgressRepository } from './useRoadmapProgressRepository';
import type { DailyMission }       from '../ai/dailyMission/dailyMission.schema';
import type { DayProgress, StreakState, Achievement } from '../types/progress';

export { ProgressService, XPService, StreakService, AchievementService };

export interface ProgressState {
  dayProgress:    DayProgress | null;
  totalXP:        number;
  streak:         StreakState;
  achievements:   Achievement[];
  levelInfo:      { level: number; currentXP: number; nextLevelXP: number; progress: number };
  newlyUnlocked:  Achievement[];
  loading:        boolean;
}

const DEFAULT_STREAK: StreakState = {
  currentStreak: 0, longestStreak: 0, lastActiveDate: '', totalActiveDays: 0,
};
const DEFAULT_LEVEL = { level: 1, currentXP: 0, nextLevelXP: 500, progress: 0 };

export function useDayProgress(
  weekNumber:   number,
  dayNumber:    number,
  mission:      DailyMission | null,
  roadmapTitle: string,
  totalWeeks:   number = 1,      // needed for unlock computation
) {
  const repo         = useRepository();
  const roadmapPRepo = useRoadmapProgressRepository();

  // ── Memoised services ──────────────────────────────────────────────────────
  const progressSvc    = useMemo(() => new ProgressService(repo),    [repo]);
  const xpSvc          = useMemo(() => new XPService(repo),          [repo]);
  const streakSvc      = useMemo(() => new StreakService(repo),      [repo]);
  const achievementSvc = useMemo(() => new AchievementService(repo), [repo]);
  const roadmapPSvc    = useMemo(
    () => new RoadmapProgressService(roadmapPRepo, repo),
    [roadmapPRepo, repo],
  );

  const [state, setState] = useState<ProgressState>({
    dayProgress: null, totalXP: 0, streak: DEFAULT_STREAK,
    achievements: [], levelInfo: DEFAULT_LEVEL, newlyUnlocked: [], loading: true,
  });

  // ── Load — runs when mission becomes available or repo changes ─────────────
  const load = useCallback(async () => {
    if (!mission) return;
    setState((s) => ({ ...s, loading: true }));

    // ── FIX: never let initProgress wipe existing data ──────────────────────
    // Only initialise if there is NO progress at all yet.
    const existing = await repo.getProgress();
    if (!existing) {
      await progressSvc.initProgress(roadmapTitle);
    }

    const dayProgress  = await progressSvc.openDay(weekNumber, dayNumber, mission);
    const totalXP      = await xpSvc.getTotal();
    const streak       = await streakSvc.getStreak();
    const achievements = await achievementSvc.getAll();
    const levelInfo    = await xpSvc.getLevelInfo();

    setState({ dayProgress, totalXP, streak, achievements, levelInfo, newlyUnlocked: [], loading: false });
  }, [weekNumber, dayNumber, mission, roadmapTitle, repo, progressSvc, xpSvc, streakSvc, achievementSvc]);

  useEffect(() => { load(); }, [load]);

  // ── Task toggle — XP awarded exactly once per task ─────────────────────────
  const toggleTask = useCallback(async (taskTitle: string, currentlyDone: boolean) => {
    if (!state.dayProgress) {
      console.warn('[useProgress] toggleTask: No day progress available');
      return;
    }

    try {
      // Read the PERSISTED state to prevent double-awarding on optimistic renders
      const persistedDay = await repo.getDayProgress(weekNumber, dayNumber);
      const persistedTask = persistedDay?.tasks.find((t) => t.taskTitle === taskTitle);
      const wasAlreadyDone = persistedTask?.completed ?? false;

      // Calculate the new completion state
      const nowDone = !currentlyDone;

      console.log(`[useProgress] Toggling task "${taskTitle}": ${currentlyDone} -> ${nowDone}, wasAlreadyDone: ${wasAlreadyDone}`);

      // Persist the change FIRST to ensure data integrity
      const updatedDay = await progressSvc.completeTask(weekNumber, dayNumber, taskTitle, nowDone);
      if (!updatedDay) {
        console.error('[useProgress] Failed to persist task completion');
        return;
      }

      console.log(`[useProgress] Task persisted successfully. New completion state:`, updatedDay.tasks.find(t => t.taskTitle === taskTitle));

      const newlyUnlocked: Achievement[] = [];

      // ── FIX: Only award XP if the task was NOT already done in persistence ──
      if (nowDone && !wasAlreadyDone) {
        console.log(`[useProgress] Awarding XP for task completion`);
        await xpSvc.award('task_complete', `Task: ${taskTitle}`);
      }

      const allDone = updatedDay.tasks.every((t: { completed: boolean }) => t.completed);
      if (allDone && nowDone && !wasAlreadyDone) {
        console.log(`[useProgress] All tasks done, awarding day completion XP`);
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

      const totalXP      = await xpSvc.getTotal();
      if (totalXP >= 100) { const a = await achievementSvc.unlock('hundred_xp');      if (a) newlyUnlocked.push(a); }
      if (totalXP >= 500) { const a = await achievementSvc.unlock('five_hundred_xp'); if (a) newlyUnlocked.push(a); }

      const streak       = await streakSvc.getStreak();
      const achievements = await achievementSvc.getAll();
      const levelInfo    = await xpSvc.getLevelInfo();

      // Recompute roadmap week progress + unlock next week if threshold met
      await roadmapPSvc.recomputeAndUnlock(totalWeeks);

      // Update state with the COMPLETE persisted truth (no optimistic updates)
      setState((prev) => ({
        ...prev,
        dayProgress:   updatedDay,  // This contains the correct completion state from persistence
        totalXP,
        streak,
        achievements,
        levelInfo,
        newlyUnlocked: [...prev.newlyUnlocked, ...newlyUnlocked],
      }));

      console.log(`[useProgress] State updated successfully`);
    } catch (error) {
      console.error('[useProgress] Error in toggleTask:', error);
    }
  }, [weekNumber, dayNumber, state.dayProgress, repo, progressSvc, xpSvc, streakSvc, achievementSvc, roadmapPSvc, totalWeeks]);
  const recordMissionGenerated = useCallback(async (weekNumber: number, dayNumber: number) => {
    await roadmapPSvc.recordMissionGenerated(weekNumber, dayNumber);
  }, [roadmapPSvc]);

  const clearNewlyUnlocked = useCallback(() => {
    setState((s) => ({ ...s, newlyUnlocked: [] }));
  }, []);

  return { state, toggleTask, recordMissionGenerated, clearNewlyUnlocked, reload: load };
}
