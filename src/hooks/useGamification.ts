/**
 * @file useGamification.ts
 * 
 * React hook for fetching gamification data.
 * Provides level, XP, badges, streaks, milestones, and weekly goals.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GamificationService } from '../services/gamificationService';
import type { GamificationState } from '../services/gamificationService';
import { getProgressRepository } from '../repositories/index';
import { executionPipelineEvents } from '../services/executionPipelineEvents';

export interface UseGamificationState {
  data: GamificationState | null;
  currentWeekProgress: {
    missionProgress: number;
    xpProgress: number;
    overallProgress: number;
  };
  xpLog: any[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useGamification(): UseGamificationState {
  const { user } = useAuth();

  const [data, setData] = useState<GamificationState | null>(null);
  const [currentWeekProgress, setCurrentWeekProgress] = useState({
    missionProgress: 0,
    xpProgress: 0,
    overallProgress: 0,
  });
  const [xpLog, setXpLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGamificationData = async () => {
    if (!user) {
      setError(new Error('User not authenticated'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const repo = getProgressRepository();
      const gamificationService = new GamificationService(repo);

      // Load gamification state
      const gamificationState = await gamificationService.getGamificationState();
      setData(gamificationState);

      // Load week progress
      const weekProgress = await gamificationService.getCurrentWeekProgress();
      setCurrentWeekProgress(weekProgress);

      // Load XP log
      const progress = await repo.getProgress();
      setXpLog(progress?.xpLog || []);

    } catch (err) {
      console.error('Failed to load gamification data:', err);
      setError(err instanceof Error ? err : new Error('Failed to load gamification data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGamificationData();

    // Subscribe to execution pipeline events to keep gamification state in sync
    // These events are emitted when the user completes tasks, earns XP, etc.
    const unsubscribeTaskCompleted = executionPipelineEvents.subscribe('task_completed', async () => {
      console.log('[useGamification] Received task_completed event, refreshing gamification state');
      await fetchGamificationData();
    });

    const unsubscribeDayCompleted = executionPipelineEvents.subscribe('day_completed', async () => {
      console.log('[useGamification] Received day_completed event, refreshing gamification state');
      await fetchGamificationData();
    });

    const unsubscribeXPAwarded = executionPipelineEvents.subscribe('xp_awarded', async () => {
      console.log('[useGamification] Received xp_awarded event, refreshing gamification state');
      await fetchGamificationData();
    });

    const unsubscribeProgressUpdated = executionPipelineEvents.subscribe('progress_updated', async () => {
      console.log('[useGamification] Received progress_updated event, refreshing gamification state');
      await fetchGamificationData();
    });

    // Cleanup: unsubscribe from events on unmount
    return () => {
      unsubscribeTaskCompleted();
      unsubscribeDayCompleted();
      unsubscribeXPAwarded();
      unsubscribeProgressUpdated();
    };
  }, [user]);

  return {
    data,
    currentWeekProgress,
    xpLog,
    loading,
    error,
    refresh: fetchGamificationData,
  };
}
