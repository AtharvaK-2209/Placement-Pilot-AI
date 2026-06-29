/**
 * @file useDashboard.ts
 *
 * React hook for fetching aggregated dashboard data.
 *
 * ─── ARCHITECTURE RULE ────────────────────────────────────────────────────────
 * This hook is the ONLY way UI components should access dashboard data.
 * Never query repositories directly from components.
 *
 * Usage:
 *   const { data, loading, error, refresh } = useDashboard(goal, displayName);
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { DashboardService } from '../dashboard/dashboardService';
import type { DashboardData } from '../dashboard/dashboard.types';
import { getProgressRepository, getExecutionIntelligenceRepository, getFutureYouRepository } from '../repositories/index';
import { useRoadmapRepository } from './useRoadmapRepository';
import { useMissionRepository } from './useMissionRepository';
import { useRoadmapProgressRepository } from './useRoadmapProgressRepository';
import { FirestoreGoalHealthRepository } from '../repositories/FirestoreGoalHealthRepository';
import { LocalStorageGoalHealthRepository } from '../repositories/LocalStorageGoalHealthRepository';
import { FirestoreDeadlineRescueRepository } from '../repositories/FirestoreDeadlineRescueRepository';
import { LocalStorageDeadlineRescueRepository } from '../repositories/LocalStorageDeadlineRescueRepository';
import type { GoalInput } from '../types/domain';

// ─── Hook State ────────────────────────────────────────────────────────────────

export interface UseDashboardState {
  /** Dashboard data */
  data: DashboardData | null;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Manual refresh function */
  refresh: () => Promise<void>;
}

// ─── Hook Implementation ───────────────────────────────────────────────────────

export function useDashboard(
  goal: GoalInput | null,
  displayName?: string,
  autoRefresh = false,
  refreshInterval = 60000
): UseDashboardState {
  const { user } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get repositories (auth-aware)
  const roadmapRepo = useRoadmapRepository();
  const missionRepo = useMissionRepository();
  const roadmapProgressRepo = useRoadmapProgressRepository();

  const goalHealthRepo = useMemo(
    () => user
      ? new FirestoreGoalHealthRepository(db, user.uid)
      : new LocalStorageGoalHealthRepository(),
    [user],
  );

  const deadlineRescueRepo = useMemo(
    () => user
      ? new FirestoreDeadlineRescueRepository(db, user.uid)
      : new LocalStorageDeadlineRescueRepository(),
    [user],
  );

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get repositories
      const progressRepo = getProgressRepository();
      const executionIntelligenceRepo = getExecutionIntelligenceRepository();
      const futureYouRepo = getFutureYouRepository();

      // Create dashboard service
      const dashboardService = new DashboardService(
        progressRepo,
        roadmapRepo,
        missionRepo,
        goalHealthRepo,
        executionIntelligenceRepo,
        deadlineRescueRepo,
        futureYouRepo,
        roadmapProgressRepo,
      );

      // Fetch dashboard data
      const dashboardData = await dashboardService.getDashboardData(goal, displayName);
      setData(dashboardData);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDashboardData();
  }, [goal, displayName, user]); // Re-fetch when goal, displayName, or user changes

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  return {
    data,
    loading,
    error,
    refresh: fetchDashboardData,
  };
}
