/**
 * @file useDeadlineRescue.ts
 *
 * React hook for Deadline Rescue Mode.
 * Integrates with existing repositories to provide rescue functionality.
 */

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRepository } from './useRepository';
import { useRoadmapRepository } from './useRoadmapRepository';
import {
  generateRescueStrategy,
  checkRescueActivation,
} from '../ai/deadlineRescue/deadlineRescue';
import type {
  RescueStrategy,
  RescueInput,
  RescueHistoryEntry,
  RescueActivationCheck,
} from '../ai/deadlineRescue/deadlineRescue.schema';
import { FirestoreDeadlineRescueRepository } from '../repositories/FirestoreDeadlineRescueRepository';
import { LocalStorageDeadlineRescueRepository } from '../repositories/LocalStorageDeadlineRescueRepository';
import { ProgressService } from '../services/progressService';
import { StreakService } from '../services/streakService';
import { RoadmapService } from '../services/roadmapService';
import { db } from '../config/firebase';

export interface DeadlineRescueState {
  strategy: RescueStrategy | null;
  history: RescueHistoryEntry[];
  activationCheck: RescueActivationCheck | null;
  loading: boolean;
  error: string | null;
}

export function useDeadlineRescue() {
  const { user } = useAuth();
  const progressRepo = useRepository();
  const roadmapRepo = useRoadmapRepository();

  const rescueRepo = useMemo(
    () => user
      ? new FirestoreDeadlineRescueRepository(db, user.uid)
      : new LocalStorageDeadlineRescueRepository(),
    [user],
  );

  const [state, setState] = useState<DeadlineRescueState>({
    strategy: null,
    history: [],
    activationCheck: null,
    loading: false,
    error: null,
  });

  // ── checkActivation: deterministic check without AI call ──────────────────
  const checkActivation = useCallback(async (
    goalHealthScore: number,
    goalHealthLevel: string,
    burnoutRisk: string,
    deadlineRisk: string,
    estimatedCompletionDate: string,
    estimatedDaysRemaining: number,
    deadline: string,
  ) => {
    try {
      const progressSvc = new ProgressService(progressRepo);
      const streakSvc = new StreakService(progressRepo);
      const roadmapSvc = new RoadmapService(roadmapRepo);

      const [progress, streak, pointer, activeRoadmap] = await Promise.all([
        progressRepo.getProgress(),
        streakSvc.getStreak(),
        roadmapSvc.getActiveVersionNumber(),
        roadmapSvc.getActiveRoadmap(),
      ]);

      if (!activeRoadmap) {
        setState((s) => ({ ...s, error: 'No active roadmap found.' }));
        return null;
      }

      const totalWeeks = activeRoadmap.totalWeeks;
      let completedWeeks = 0;
      let startedDays = 0;
      let completedDays = 0;

      if (progress) {
        for (let w = 1; w <= totalWeeks; w++) {
          const wp = await progressSvc.getWeekProgress(w, '');
          if (wp.completionPercent === 100) completedWeeks++;
        }
        Object.values(progress.days).forEach((day) => {
          startedDays++;
          if (day.completionPercent === 100) completedDays++;
        });
      }

      const overallCompletionPct = totalWeeks > 0
        ? Math.round((completedWeeks / totalWeeks) * 100)
        : 0;
      const remainingWeeks = Math.max(0, totalWeeks - completedWeeks);
      const consistencyRate = startedDays > 0
        ? Math.round((completedDays / startedDays) * 100)
        : 0;

      const deadlineDate = new Date(deadline);
      const today = new Date();
      const remainingDays = Math.max(0, Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

      const daysBehindSchedule = estimatedDaysRemaining - remainingDays;

      const currentPace = completedWeeks > 0 && startedDays > 0
        ? completedWeeks / Math.ceil(startedDays / 7)
        : 0;

      const requiredPace = remainingWeeks > 0 && remainingDays > 0
        ? remainingWeeks / (remainingDays / 7)
        : 0;

      const input: RescueInput = {
        currentGoal: activeRoadmap.title,
        goalType: 'placement',
        deadline,
        remainingDays,
        roadmapVersion: pointer ?? 1,
        totalWeeks,
        completedWeeks,
        currentWeek: completedWeeks + 1,
        remainingWeeks,
        executionMode: activeRoadmap.executionMode,
        weeklyHours: activeRoadmap.totalHours / totalWeeks,
        overallCompletionPct,
        completedTasks: startedDays,
        totalTasks: totalWeeks * 7,
        remainingHours: activeRoadmap.totalHours * (1 - overallCompletionPct / 100),
        currentPace,
        requiredPace,
        goalHealthScore,
        goalHealthLevel,
        burnoutRisk,
        deadlineRisk,
        estimatedCompletionDate,
        estimatedDaysRemaining,
        daysBehindSchedule,
        currentStreak: streak.currentStreak,
        consistencyRate,
        strongTopics: [],
        weakTopics: [],
        remainingModules: activeRoadmap.weeks
          .slice(completedWeeks)
          .flatMap((week) =>
            week.modules.map((mod) => ({
              title: mod.title,
              weekNumber: week.week,
              hours: mod.estimatedHours,
              priority: week.type === 'interview' ? 'high' as const : week.type === 'project' ? 'low' as const : 'medium' as const,
              type: week.type,
            }))
          ),
      };

      const check = checkRescueActivation(input);
      setState((s) => ({ ...s, activationCheck: check }));
      return check;
    } catch (e) {
      console.error('[useDeadlineRescue] checkActivation error:', e);
      setState((s) => ({ ...s, error: 'Failed to check rescue activation.' }));
      return null;
    }
  }, [progressRepo, roadmapRepo]);

  // ── activate: generates rescue strategy with AI ────────────────────────────
  const activate = useCallback(async (
    goalHealthScore: number,
    goalHealthLevel: string,
    burnoutRisk: string,
    deadlineRisk: string,
    estimatedCompletionDate: string,
    estimatedDaysRemaining: number,
    deadline: string,
    strongTopics: string[] = [],
    weakTopics: string[] = [],
  ) => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const progressSvc = new ProgressService(progressRepo);
      const streakSvc = new StreakService(progressRepo);
      const roadmapSvc = new RoadmapService(roadmapRepo);

      const [progress, streak, pointer, activeRoadmap] = await Promise.all([
        progressRepo.getProgress(),
        streakSvc.getStreak(),
        roadmapSvc.getActiveVersionNumber(),
        roadmapSvc.getActiveRoadmap(),
      ]);

      if (!activeRoadmap) {
        setState((s) => ({ ...s, loading: false, error: 'No active roadmap found.' }));
        return;
      }

      const totalWeeks = activeRoadmap.totalWeeks;
      let completedWeeks = 0;
      let startedDays = 0;
      let completedDays = 0;

      if (progress) {
        for (let w = 1; w <= totalWeeks; w++) {
          const wp = await progressSvc.getWeekProgress(w, '');
          if (wp.completionPercent === 100) completedWeeks++;
        }
        Object.values(progress.days).forEach((day) => {
          startedDays++;
          if (day.completionPercent === 100) completedDays++;
        });
      }

      const overallCompletionPct = totalWeeks > 0
        ? Math.round((completedWeeks / totalWeeks) * 100)
        : 0;
      const remainingWeeks = Math.max(0, totalWeeks - completedWeeks);
      const consistencyRate = startedDays > 0
        ? Math.round((completedDays / startedDays) * 100)
        : 0;

      const deadlineDate = new Date(deadline);
      const today = new Date();
      const remainingDays = Math.max(0, Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

      const daysBehindSchedule = estimatedDaysRemaining - remainingDays;

      const currentPace = completedWeeks > 0 && startedDays > 0
        ? completedWeeks / Math.ceil(startedDays / 7)
        : 0;

      const requiredPace = remainingWeeks > 0 && remainingDays > 0
        ? remainingWeeks / (remainingDays / 7)
        : 0;

      const input: RescueInput = {
        currentGoal: activeRoadmap.title,
        goalType: 'placement',
        deadline,
        remainingDays,
        roadmapVersion: pointer ?? 1,
        totalWeeks,
        completedWeeks,
        currentWeek: completedWeeks + 1,
        remainingWeeks,
        executionMode: activeRoadmap.executionMode,
        weeklyHours: activeRoadmap.totalHours / totalWeeks,
        overallCompletionPct,
        completedTasks: startedDays,
        totalTasks: totalWeeks * 7,
        remainingHours: activeRoadmap.totalHours * (1 - overallCompletionPct / 100),
        currentPace,
        requiredPace,
        goalHealthScore,
        goalHealthLevel,
        burnoutRisk,
        deadlineRisk,
        estimatedCompletionDate,
        estimatedDaysRemaining,
        daysBehindSchedule,
        currentStreak: streak.currentStreak,
        consistencyRate,
        strongTopics,
        weakTopics,
        remainingModules: activeRoadmap.weeks
          .slice(completedWeeks)
          .flatMap((week) =>
            week.modules.map((mod) => ({
              title: mod.title,
              weekNumber: week.week,
              hours: mod.estimatedHours,
              priority: week.type === 'interview' ? 'high' as const : week.type === 'project' ? 'low' as const : 'medium' as const,
              type: week.type,
            }))
          ),
      };

      const result = await generateRescueStrategy(input, user?.uid, true);

      if (!result.success) {
        setState((s) => ({ ...s, loading: false, error: 'Failed to generate rescue strategy.' }));
        return;
      }

      // Save to repository
      await rescueRepo.saveRescueStrategy(result.data);

      // Save to history
      const historyEntry: RescueHistoryEntry = {
        status: result.data.status,
        reason: result.data.reason,
        daysBehind: result.data.daysBehind,
        recoveryActions: result.data.recoveryActions,
        estimatedCompletion: result.data.estimatedCompletion,
        recoveryProbability: result.data.recoveryProbability,
        confidence: result.data.confidence,
        activatedAt: result.data.computedAt,
        roadmapVersion: pointer ?? 1,
        currentWeek: completedWeeks + 1,
        overallCompletion: overallCompletionPct,
        recommendedDailyHours: result.data.recommendedDailyHours,
      };
      await rescueRepo.saveHistory(historyEntry);

      // Load history
      const history = await rescueRepo.getHistory();

      setState({
        strategy: result.data,
        history,
        activationCheck: checkRescueActivation(input),
        loading: false,
        error: null,
      });
    } catch (e) {
      console.error('[useDeadlineRescue] activate error:', e);
      setState((s) => ({ ...s, loading: false, error: 'Unexpected error.' }));
    }
  }, [progressRepo, roadmapRepo, rescueRepo, user]);

  // ── loadCached: reads latest strategy without AI call ──────────────────────
  const loadCached = useCallback(async () => {
    const [strategy, history] = await Promise.all([
      rescueRepo.getRescueStrategy(),
      rescueRepo.getHistory(),
    ]);
    if (strategy) {
      setState({ strategy, history, activationCheck: null, loading: false, error: null });
    }
  }, [rescueRepo]);

  // ── deactivate: clears rescue mode ─────────────────────────────────────────
  const deactivate = useCallback(async () => {
    await rescueRepo.clearRescueStrategy();
    setState((s) => ({ ...s, strategy: null, activationCheck: null }));
  }, [rescueRepo]);

  return {
    ...state,
    checkActivation,
    activate,
    loadCached,
    deactivate,
  };
}
