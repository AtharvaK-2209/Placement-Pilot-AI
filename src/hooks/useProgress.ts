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

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ProgressService }         from '../services/progressService';
import { XPService }               from '../services/xpService';
import { StreakService }            from '../services/streakService';
import { AchievementService }      from '../services/achievementService';
import { RoadmapProgressService }  from '../services/roadmapProgressService';
import { useRepository }           from './useRepository';
import { useRoadmapProgressRepository } from './useRoadmapProgressRepository';
import { executionPipelineEvents } from '../services/executionPipelineEvents';
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
  
  // Keep a ref to the latest state for use in callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Load — runs when mission becomes available or repo changes ─────────────
  const load = useCallback(async () => {
    if (!mission) return;
    
    console.log(`[useProgress] ═══ START load for Week ${weekNumber}, Day ${dayNumber} ═══`);
    setState((s) => ({ ...s, loading: true }));

    try {
      // ── FIX: never let initProgress wipe existing data ──────────────────────
      // Only initialise if there is NO progress at all yet.
      const existing = await repo.getProgress();
      if (!existing) {
        console.log(`[useProgress] No existing progress, initializing with roadmap: "${roadmapTitle}"`);
        await progressSvc.initProgress(roadmapTitle);
      } else {
        console.log(`[useProgress] Existing progress found for roadmap: "${existing.roadmapTitle}"`);
      }

      console.log(`[useProgress] Opening day progress for Week ${weekNumber}, Day ${dayNumber}...`);
      const dayProgress  = await progressSvc.openDay(weekNumber, dayNumber, mission);
      console.log(`[useProgress] ✓ Day progress loaded:`, { 
        weekNumber: dayProgress.weekNumber, 
        dayNumber: dayProgress.dayNumber,
        tasksCount: dayProgress.tasks.length,
        completionPercent: dayProgress.completionPercent
      });
      
      const totalXP      = await xpSvc.getTotal();
      const streak       = await streakSvc.getStreak();
      const achievements = await achievementSvc.getAll();
      const levelInfo    = await xpSvc.getLevelInfo();

      setState({ dayProgress, totalXP, streak, achievements, levelInfo, newlyUnlocked: [], loading: false });
      console.log(`[useProgress] ✓ Load complete - state updated`);
      console.log(`[useProgress] ═══ END load for Week ${weekNumber}, Day ${dayNumber} ═══`);
    } catch (error) {
      console.error('[useProgress] ✗ Error during load:', error);
      setState((s) => ({ ...s, loading: false }));
      alert(`Failed to load progress: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your internet connection and Firestore permissions.`);
    }
  }, [weekNumber, dayNumber, mission, roadmapTitle, repo, progressSvc, xpSvc, streakSvc, achievementSvc]);

  useEffect(() => { load(); }, [load]);

  // ── Task toggle — XP awarded exactly once per task ─────────────────────────
  const isTogglingRef = useRef(false);
  const toggleTask = useCallback(async (taskTitle: string, currentlyDone: boolean) => {
    // Prevent multiple simultaneous toggles to avoid race conditions
    if (isTogglingRef.current) {
      console.log(`[useProgress] toggleTask: Skipping "${taskTitle}" - already toggling another task`);
      return;
    }

    const currentState = stateRef.current;
    if (!currentState.dayProgress) {
      console.warn('[useProgress] toggleTask: No day progress available');
      return;
    }

    isTogglingRef.current = true;
    try {
      console.log(`[useProgress] ═══ START toggleTask for "${taskTitle}" ═══`);
      console.log(`[useProgress] Toggle lock acquired for "${taskTitle}"`);
      
      // 1. Make optimistic UI update immediately for responsive UX
      const nowDone = !currentlyDone;
      console.log(`[useProgress] Optimistic toggle: "${taskTitle}" ${currentlyDone} -> ${nowDone}`);
      
      // Create optimistic update using functional setState to avoid stale closure
      setState(prev => {
        if (!prev.dayProgress) return prev;
        
        const updatedTasks = prev.dayProgress.tasks.map(t => 
          t.taskTitle === taskTitle 
            ? { ...t, completed: nowDone, completedAt: nowDone ? new Date().toISOString() : undefined }
            : t
        );
        
        const completedCount = updatedTasks.filter(t => t.completed).length;
        const completionPercent = updatedTasks.length > 0 
          ? Math.round((completedCount / updatedTasks.length) * 100)
          : 0;
        
        const isAllDone = completedCount === updatedTasks.length && updatedTasks.length > 0;
        
        return {
          ...prev,
          dayProgress: {
            ...prev.dayProgress,
            tasks: updatedTasks,
            completionPercent,
            completedAt: isAllDone && !prev.dayProgress.completedAt ? new Date().toISOString() : prev.dayProgress.completedAt,
          },
        };
      });
      
      console.log(`[useProgress] ✓ Optimistic UI update completed`);

      // 2. Read persisted state from repository (not React state)
      console.log(`[useProgress] Reading persisted state before writing...`);
      const persistedDay = await repo.getDayProgress(weekNumber, dayNumber);
      const persistedTask = persistedDay?.tasks.find((t) => t.taskTitle === taskTitle);
      const wasAlreadyDone = persistedTask?.completed ?? false;

      console.log(`[useProgress] Toggling task "${taskTitle}": optimistic ${nowDone}, persisted: ${wasAlreadyDone}`);

      // 3. Persist the change to ensure data integrity
      console.log(`[useProgress] Calling progressSvc.completeTask...`);
      const updatedDay = await progressSvc.completeTask(weekNumber, dayNumber, taskTitle, nowDone);
      if (!updatedDay) {
        console.error('[useProgress] ✗ Failed to persist task completion - completeTask returned null');
        alert('Failed to save task completion. Please check your internet connection and Firestore permissions.');
        return;
      }

      console.log(`[useProgress] ✓ Task persisted successfully. New completion state:`, updatedDay.tasks.find(t => t.taskTitle === taskTitle));

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
      const roadmapProgress = await roadmapPSvc.recomputeAndUnlock(totalWeeks);

      // ────────────────────────────────────────────────────────────────────────────
      // EMIT EXECUTION PIPELINE EVENTS for downstream systems
      // ────────────────────────────────────────────────────────────────────────────
      console.log('[useProgress] ════════ EMITTING EXECUTION PIPELINE EVENTS ════════');
      
      // Emit task completion event
      await executionPipelineEvents.emit({
        type: 'task_completed',
        timestamp: new Date().toISOString(),
        data: {
          taskTitle,
          weekNumber,
          dayNumber,
          nowDone,
        },
      });

      // Emit day completion event if all tasks done
      if (allDone && nowDone && !wasAlreadyDone) {
        await executionPipelineEvents.emit({
          type: 'day_completed',
          timestamp: new Date().toISOString(),
          data: {
            weekNumber,
            dayNumber,
            streak: streak.currentStreak,
          },
        });
      }

      // Emit week unlocked event if any week was newly unlocked
      // The recomputeAndUnlock always returns the current state;
      // Listeners can check if unlockedWeek increased from their previous knowledge
      await executionPipelineEvents.emit({
        type: 'week_unlocked',
        timestamp: new Date().toISOString(),
        data: {
          unlockedWeek: roadmapProgress.unlockedWeek,
          weekStatuses: roadmapProgress.weekStatuses,
        },
      });
      console.log(`[useProgress] ✓ Emitted week_unlocked event for week ${roadmapProgress.unlockedWeek}`);

      // Emit achievement unlocked events
      for (const achievement of newlyUnlocked) {
        await executionPipelineEvents.emit({
          type: 'achievement_unlocked',
          timestamp: new Date().toISOString(),
          data: {
            achievementId: achievement.id,
            title: achievement.title,
          },
        });
      }

      // Emit XP awarded event
      if (nowDone && !wasAlreadyDone) {
        await executionPipelineEvents.emit({
          type: 'xp_awarded',
          timestamp: new Date().toISOString(),
          data: {
            taskTitle,
            totalXP,
          },
        });
      }

      // Emit general progress update
      await executionPipelineEvents.emit({
        type: 'progress_updated',
        timestamp: new Date().toISOString(),
        data: {
          weekNumber,
          dayNumber,
          completionPct: updatedDay.completionPercent,
        },
      });

      // 4. Final state update with complete persisted truth
      setState((prev) => {
        const newState = {
          ...prev,
          dayProgress:   updatedDay,  // This contains the correct completion state from persistence
          totalXP,
          streak,
          achievements,
          levelInfo,
          newlyUnlocked: [...prev.newlyUnlocked, ...newlyUnlocked],
        };
        
        console.log(`[useProgress] DIAGNOSTIC - State update:`, {
          prevDayProgress: prev.dayProgress ? {
            tasksCount: prev.dayProgress.tasks.length,
            firstTask: prev.dayProgress.tasks[0] ? {
              title: prev.dayProgress.tasks[0].taskTitle,
              completed: prev.dayProgress.tasks[0].completed
            } : null
          } : null,
          newDayProgress: newState.dayProgress ? {
            tasksCount: newState.dayProgress.tasks.length,
            firstTask: newState.dayProgress.tasks[0] ? {
              title: newState.dayProgress.tasks[0].taskTitle,
              completed: newState.dayProgress.tasks[0].completed
            } : null
          } : null
        });
        
        return newState;
      });

      console.log(`[useProgress] ✓ State updated successfully with persisted data`);
      console.log(`[useProgress] ═══ END toggleTask for "${taskTitle}" ═══`);
    } catch (error) {
      console.error('[useProgress] ✗ Error in toggleTask:', error);
      alert(`Failed to save task completion: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your internet connection and try again.`);
    } finally {
      isTogglingRef.current = false;
      console.log(`[useProgress] Toggle lock released for "${taskTitle}"`);
    }
  }, [weekNumber, dayNumber, repo, progressSvc, xpSvc, streakSvc, achievementSvc, roadmapPSvc, totalWeeks]);
  const recordMissionGenerated = useCallback(async (weekNumber: number, dayNumber: number) => {
    await roadmapPSvc.recordMissionGenerated(weekNumber, dayNumber);
  }, [roadmapPSvc]);

  const clearNewlyUnlocked = useCallback(() => {
    setState((s) => ({ ...s, newlyUnlocked: [] }));
  }, []);

  return { state, toggleTask, recordMissionGenerated, clearNewlyUnlocked, reload: load };
}
