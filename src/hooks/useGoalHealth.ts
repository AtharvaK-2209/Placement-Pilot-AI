/**
 * @file useGoalHealth.ts
 *
 * React hook for the Goal Health Score Agent.
 * Phase 7.1: adds trend computation, history persistence, history state.
 */

import { useState, useCallback, useMemo } from 'react';
import { useAuth }                         from '../contexts/AuthContext';
import { useRepository }                   from './useRepository';
import { useRoadmapRepository }            from './useRoadmapRepository';
import { generateGoalHealth }              from '../ai/goalHealth/goalHealth';
import { ProgressService }                 from '../services/progressService';
import { XPService }                       from '../services/xpService';
import { StreakService }                   from '../services/streakService';
import { AchievementService }              from '../services/achievementService';
import { RoadmapService }                  from '../services/roadmapService';
import { FirestoreGoalHealthRepository }   from '../repositories/FirestoreGoalHealthRepository';
import { LocalStorageGoalHealthRepository } from '../repositories/LocalStorageGoalHealthRepository';
import type {
  GoalHealthScore,
  GoalHealthHistoryEntry,
  HealthTrend,
} from '../ai/goalHealth/goalHealth.schema';
import { db } from '../config/firebase';

export interface GoalHealthState {
  score:    GoalHealthScore | null;
  history:  GoalHealthHistoryEntry[];
  loading:  boolean;
  error:    string | null;
}

// ─── Trend helper ──────────────────────────────────────────────────────────────

function computeTrend(current: number, previous: number | undefined): HealthTrend {
  if (previous === undefined) return { delta: 0, direction: 'stable' };
  const delta = current - previous;
  return {
    delta,
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable',
  };
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useGoalHealth() {
  const { user }    = useAuth();
  const repo        = useRepository();
  const roadmapRepo = useRoadmapRepository();

  const healthRepo = useMemo(
    () => user
      ? new FirestoreGoalHealthRepository(db, user.uid)
      : new LocalStorageGoalHealthRepository(),
    [user],
  );

  const [state, setState] = useState<GoalHealthState>({
    score: null, history: [], loading: false, error: null,
  });

  // ── refresh: calls agent, computes trend, persists latest + history ────────
  const refresh = useCallback(async (deadline?: string) => {
    console.group('[GoalHealth] START refresh hook');
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const progressSvc    = new ProgressService(repo);
      const xpSvc          = new XPService(repo);
      const streakSvc      = new StreakService(repo);
      const achievementSvc = new AchievementService(repo);
      const roadmapSvc     = new RoadmapService(roadmapRepo);

      // Step 1: Load all required data
      console.log('[GoalHealth] Step 1: Loading data...');
      const [progress, streak, achievements, levelInfo, versions, pointer] =
        await Promise.all([
          repo.getProgress(),
          streakSvc.getStreak(),
          achievementSvc.getAll(),
          xpSvc.getLevelInfo(),
          roadmapSvc.listVersions(),
          roadmapSvc.getActiveVersionNumber(),
        ]);

      // DIAGNOSTIC: Log user and roadmap info
      console.log('[GoalHealth] DIAGNOSTIC - User/Roadmap Info:', {
        userId: user?.uid,
        userExists: !!user,
        progressExists: !!progress,
        streakExists: !!streak,
        roadmapRepoExists: !!roadmapRepo,
        versionsCount: versions?.length,
        pointer: pointer
      });

      console.log('[GoalHealth] Step 2: Loading active roadmap...');
      const activeRoadmap = await roadmapSvc.getActiveRoadmap();
      console.log('[GoalHealth] DIAGNOSTIC - Active Roadmap:', {
        exists: !!activeRoadmap,
        roadmapTitle: activeRoadmap?.title,
        totalWeeks: activeRoadmap?.totalWeeks,
        executionMode: activeRoadmap?.executionMode
      });
      
      if (!activeRoadmap) {
        console.error('[GoalHealth] ERROR: No active roadmap found');
        setState((s) => ({ ...s, loading: false, error: 'No active roadmap found.' }));
        return;
      }

      const totalWeeks    = activeRoadmap.totalWeeks;
      const activeVersion = pointer ?? 1;
      const replanCount   = Math.max(0, versions.length - 1);

      // DIAGNOSTIC: Log basic roadmap info
      console.log('[GoalHealth] DIAGNOSTIC - Roadmap Base Info:', {
        totalWeeks,
        activeVersion,
        replanCount,
        versionsLength: versions?.length
      });

      console.log('[GoalHealth] Step 3: Calculating progress...');
      let completedWeeks = 0;
      let startedDays    = 0;
      let completedDays  = 0;

      if (progress) {
        // DIAGNOSTIC: Log progress structure
        console.log('[GoalHealth] DIAGNOSTIC - Progress Structure:', {
          hasProgress: !!progress,
          roadmapTitle: progress?.roadmapTitle,
          daysCount: progress?.days ? Object.keys(progress.days).length : 0,
          daysKeys: progress?.days ? Object.keys(progress.days) : []
        });

        // Calculate completed weeks
        for (let w = 1; w <= totalWeeks; w++) {
          const wp = await progressSvc.getWeekProgress(w, '');
          if (wp.completionPercent === 100) completedWeeks++;
        }
        
        // Count started and completed days
        if (progress.days) {
          Object.values(progress.days).forEach((day) => {
            startedDays++;
            if (day.completionPercent === 100) completedDays++;
          });
        }
      }

      // DIAGNOSTIC: Log progress calculation results
      console.log('[GoalHealth] DIAGNOSTIC - Progress Calculation:', {
        completedWeeks,
        startedDays,
        completedDays,
        totalWeeks
      });

      console.log('[GoalHealth] Step 4: Calculating metrics...');
      const overallCompletionPct = totalWeeks > 0
        ? Math.round((completedWeeks / totalWeeks) * 100) : 0;
      const remainingWeeks  = Math.max(0, totalWeeks - completedWeeks);
      const consistencyRate = startedDays > 0
        ? Math.round((completedDays / startedDays) * 100) : 0;
      const today           = new Date().toISOString().split('T')[0];
      const streakActiveToday = streak.lastActiveDate === today;

      // DIAGNOSTIC: Log calculated metrics
      console.log('[GoalHealth] DIAGNOSTIC - Core Metrics:', {
        overallCompletionPct,
        remainingWeeks,
        consistencyRate,
        today,
        streakActiveToday,
        streak: streak ? {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastActiveDate: streak.lastActiveDate
        } : null,
        achievementsCount: achievements?.length,
        levelInfo: levelInfo ? {
          level: levelInfo.level,
          currentXP: levelInfo.currentXP,
          nextLevelXP: levelInfo.nextLevelXP
        } : null
      });

      // ── Phase 8.1: Calculate additional metrics ───────────────────────────
      const avgWeeklyProgress = completedWeeks > 0 && startedDays > 0
        ? Math.round((completedWeeks / Math.ceil(startedDays / 7)) * 100)
        : 0;

      const remainingHours = activeRoadmap.totalHours * (1 - overallCompletionPct / 100);

      // Use provided deadline or compute a default one
      const effectiveDeadline = deadline ?? (() => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + (remainingWeeks * 7));
        return futureDate.toISOString().split('T')[0];
      })();
      
      // DIAGNOSTIC: Validate deadline format
      console.log('[GoalHealth] DIAGNOSTIC - Effective Deadline:', {
        deadlineParam: deadline,
        effectiveDeadline,
        isValidDate: !isNaN(new Date(effectiveDeadline).getTime())
      });

      // DIAGNOSTIC: Log all inputs for generateGoalHealth
      console.log('[GoalHealth] DIAGNOSTIC - generateGoalHealth Inputs:', {
        executionMode: activeRoadmap.executionMode,
        roadmapVersion: activeVersion,
        totalWeeks,
        completedWeeks,
        overallCompletionPct,
        remainingWeeks,
        totalXP: levelInfo?.currentXP + (levelInfo?.level - 1) * 500,
        level: levelInfo?.level,
        currentStreak: streak?.currentStreak,
        longestStreak: streak?.longestStreak,
        achievementCount: achievements?.length,
        consistencyRate,
        replanCount,
        streakActiveToday,
        deadline: effectiveDeadline,
        avgWeeklyProgress,
        remainingHours,
        userId: user?.uid
      });

      console.log('[GoalHealth] Step 5: Calling generateGoalHealth...');
      
      // DEFENSIVE: Ensure all required fields are present
      if (!levelInfo) {
        console.error('[GoalHealth] ERROR: levelInfo is undefined');
        setState((s) => ({ ...s, loading: false, error: 'Missing level information.' }));
        console.groupEnd();
        return;
      }
      
      if (!streak) {
        console.error('[GoalHealth] ERROR: streak is undefined');
        setState((s) => ({ ...s, loading: false, error: 'Missing streak information.' }));
        console.groupEnd();
        return;
      }
      
      // Ensure numeric values are valid
      const calculatedXP = levelInfo.currentXP + (levelInfo.level - 1) * 500;
      if (isNaN(calculatedXP) || !isFinite(calculatedXP)) {
        console.error('[GoalHealth] ERROR: Invalid XP calculation:', { levelInfo, calculatedXP });
        setState((s) => ({ ...s, loading: false, error: 'Invalid XP calculation.' }));
        console.groupEnd();
        return;
      }
      
      const result = await generateGoalHealth({
        executionMode:        activeRoadmap.executionMode,
        roadmapVersion:       activeVersion,
        totalWeeks,
        completedWeeks,
        overallCompletionPct,
        remainingWeeks,
        totalXP:              calculatedXP,
        level:                levelInfo.level,
        currentStreak:        streak.currentStreak,
        longestStreak:        streak.longestStreak,
        achievementCount:     achievements?.length || 0,
        consistencyRate,
        replanCount,
        streakActiveToday,
        // Phase 8.1 additions
        deadline:             effectiveDeadline,
        avgWeeklyProgress,
        remainingHours,
      }, user?.uid);

      if (!result.success) {
        setState((s) => ({ ...s, loading: false, error: 'Failed to compute health score.' }));
        return;
      }

      // ── Compute trend vs previous evaluation ──────────────────────────────
      const previous   = await healthRepo.getHealth();
      const trend      = computeTrend(result.data.score, previous?.score);
      result.data.trend = trend;

      // ── Persist latest ────────────────────────────────────────────────────
      await healthRepo.saveHealth(result.data);

      // ── Append immutable history entry ────────────────────────────────────
      const historyEntry: GoalHealthHistoryEntry = {
        score:                   result.data.score,
        level:                   result.data.level,
        confidence:              result.data.confidence,
        summary:                 result.data.summary,
        strengths:               result.data.strengths,
        weaknesses:              result.data.weaknesses,
        recommendations:         result.data.recommendations,
        trend,
        evaluatedAt:             result.data.computedAt,
        roadmapVersion:          activeVersion,
        streak:                  streak.currentStreak,
        overallCompletionPct,
        // Phase 8.1 additions
        burnoutRisk:             result.data.burnoutRisk,
        estimatedCompletionDate: result.data.estimatedCompletionDate,
        estimatedDaysRemaining:  result.data.estimatedDaysRemaining,
      };
      await healthRepo.saveHistory(historyEntry);

      // ── Load full history for mini graph ──────────────────────────────────
      const history = await healthRepo.getHistory();

      setState({ score: result.data, history, loading: false, error: null });
      console.log('[GoalHealth] SUCCESS: Goal health computed and saved');
      console.groupEnd();
    } catch (e) {
      console.error('[GoalHealth] ERROR: Unexpected exception:', e);
      console.error('[GoalHealth] ERROR Stack:', e instanceof Error ? e.stack : 'No stack');
      setState((s) => ({ ...s, loading: false, error: 'Unexpected error.' }));
      console.groupEnd();
    }
  }, [repo, roadmapRepo, healthRepo, user]);

  // ── loadCached: reads latest + history without calling Gemini ─────────────
  const loadCached = useCallback(async () => {
    const [cached, history] = await Promise.all([
      healthRepo.getHealth(),
      healthRepo.getHistory(),
    ]);
    if (cached) {
      setState({ score: cached, history, loading: false, error: null });
    }
  }, [healthRepo]);

  return { ...state, refresh, loadCached };
}
