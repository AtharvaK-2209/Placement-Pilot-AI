/**
 * @file useDashboardRefresh.ts
 *
 * React hook that listens to execution pipeline events and refreshes
 * downstream systems (Goal Health, Deadline Rescue, etc.) as needed.
 *
 * Used by Dashboard and related components to stay in sync with task completions.
 */

import { useEffect, useRef } from 'react';
import { executionPipelineEvents } from '../services/executionPipelineEvents';
import type { ExecutionPipelineEvent } from '../services/executionPipelineEvents';

export interface UseDashboardRefreshOptions {
  /**
   * Callback fired when task is completed.
   * Use this to refresh XP display, achievements, etc.
   */
  onTaskCompleted?: (event: ExecutionPipelineEvent) => void | Promise<void>;

  /**
   * Callback fired when day is completed.
   * Use this to refresh streak displays, daily stats, etc.
   */
  onDayCompleted?: (event: ExecutionPipelineEvent) => void | Promise<void>;

  /**
   * Callback fired when week is unlocked.
   * Use this to refresh roadmap view, week statuses, etc.
   */
  onWeekUnlocked?: (event: ExecutionPipelineEvent) => void | Promise<void>;

  /**
   * Callback fired when achievement is unlocked.
   * Use this to refresh achievement displays, badges, etc.
   */
  onAchievementUnlocked?: (event: ExecutionPipelineEvent) => void | Promise<void>;

  /**
   * Callback fired when progress updates.
   * Use this for general state refreshes.
   */
  onProgressUpdated?: (event: ExecutionPipelineEvent) => void | Promise<void>;

  /**
   * Callback fired when XP is awarded.
   * Use this to refresh XP displays immediately.
   */
  onXPAwarded?: (event: ExecutionPipelineEvent) => void | Promise<void>;
}

/**
 * Hook that subscribes to execution pipeline events and calls provided callbacks.
 * Automatically unsubscribes on unmount.
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   useDashboardRefresh({
 *     onTaskCompleted: async () => {
 *       // Refresh dashboard
 *     },
 *     onWeekUnlocked: async (event) => {
 *       // Show week unlock celebration
 *     },
 *   });
 *
 *   return <div>Dashboard content</div>;
 * }
 * ```
 */
export function useDashboardRefresh(options: UseDashboardRefreshOptions = {}): void {
  const unsubscribersRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    console.log('[useDashboardRefresh] Subscribing to execution pipeline events');

    if (options.onTaskCompleted) {
      const unsub = executionPipelineEvents.subscribe('task_completed', options.onTaskCompleted);
      unsubscribersRef.current.push(unsub);
    }

    if (options.onDayCompleted) {
      const unsub = executionPipelineEvents.subscribe('day_completed', options.onDayCompleted);
      unsubscribersRef.current.push(unsub);
    }

    if (options.onWeekUnlocked) {
      const unsub = executionPipelineEvents.subscribe('week_unlocked', options.onWeekUnlocked);
      unsubscribersRef.current.push(unsub);
    }

    if (options.onAchievementUnlocked) {
      const unsub = executionPipelineEvents.subscribe('achievement_unlocked', options.onAchievementUnlocked);
      unsubscribersRef.current.push(unsub);
    }

    if (options.onProgressUpdated) {
      const unsub = executionPipelineEvents.subscribe('progress_updated', options.onProgressUpdated);
      unsubscribersRef.current.push(unsub);
    }

    if (options.onXPAwarded) {
      const unsub = executionPipelineEvents.subscribe('xp_awarded', options.onXPAwarded);
      unsubscribersRef.current.push(unsub);
    }

    return () => {
      console.log('[useDashboardRefresh] Unsubscribing from execution pipeline events');
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
    };
  }, [
    options.onTaskCompleted,
    options.onDayCompleted,
    options.onWeekUnlocked,
    options.onAchievementUnlocked,
    options.onProgressUpdated,
    options.onXPAwarded,
  ]);
}
