/**
 * @file pipelineDownstreamHandlers.ts
 *
 * Handlers that subscribe to execution pipeline events and trigger downstream systems.
 * This is the glue that connects task completion to Goal Health, Deadline Rescue, etc.
 *
 * Called once during app initialization (typically in main.tsx or App.tsx).
 */

import { executionPipelineEvents } from './executionPipelineEvents';

/**
 * Initializes all downstream handlers.
 * Should be called once when the app starts.
 */
export function initializePipelineDownstreamHandlers(): void {
  console.log('[PipelineDownstream] Initializing downstream handlers...');

  // ── STAGE 8: Goal Health refresh after task completion ────────────────────
  // We invalidate cached Goal Health so the next read will refresh it
  executionPipelineEvents.subscribe('task_completed', async () => {
    try {
      console.log('[PipelineDownstream] task_completed: Invalidating Goal Health cache');
      
      // Invalidate Goal Health caches at all levels
      // Memory cache is cleared via aiRequestManager (handled internally)
      // LocalStorage cache can be cleared here
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('ai_cache_GoalHealth:')) {
          localStorage.removeItem(key);
          console.log('[PipelineDownstream] ✓ Cleared Goal Health cache:', key);
        }
      }
    } catch (error) {
      console.warn('[PipelineDownstream] Goal Health cache invalidation failed:', error);
    }
  });

  // ── STAGE 9: Check Deadline Rescue activation after day completion ────────
  executionPipelineEvents.subscribe('day_completed', async () => {
    try {
      console.log('[PipelineDownstream] day_completed: Checking Deadline Rescue activation');
      // Dynamic import to avoid circular dependencies
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { checkRescueActivation: _unused } = await import('../ai/deadlineRescue/deadlineRescue');
      
      // We can't fully execute this here without access to current state
      // This is a placeholder - the actual check happens in the dashboard or a dedicated page
      console.log('[PipelineDownstream] Deadline Rescue check should be triggered manually or via dashboard');
    } catch (error) {
      console.warn('[PipelineDownstream] Deadline Rescue check failed:', error);
    }
  });

  // ── STAGE 10: Invalidate Future You cache when progress changes significantly ──
  executionPipelineEvents.subscribe('week_unlocked', async () => {
    try {
      console.log('[PipelineDownstream] week_unlocked: Invalidating Future You cache');
      
      // Invalidate Future You caches
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('ai_cache_FutureYou:')) {
          localStorage.removeItem(key);
          console.log('[PipelineDownstream] ✓ Cleared Future You cache:', key);
        }
      }
    } catch (error) {
      console.warn('[PipelineDownstream] Future You cache invalidation failed:', error);
    }
  });

  // ── STAGE 11: Log progress updates for dashboard sync ─────────────────────
  executionPipelineEvents.subscribe('progress_updated', async () => {
    try {
      console.log('[PipelineDownstream] progress_updated - Ready for dashboard refresh');
      
      // Dashboard components that are listening via useDashboardRefresh will
      // receive this event and refresh their data as needed
    } catch (error) {
      console.warn('[PipelineDownstream] Progress update handling failed:', error);
    }
  });

  // ── STAGE 12: Log milestone unlocks ──────────────────────────────────────
  executionPipelineEvents.subscribe('milestone_unlocked', async (event) => {
    console.log('[PipelineDownstream] milestone_unlocked fired:', event.data);
  });

  // ── Diagnostic logging for all events ──────────────────────────────────────
  executionPipelineEvents.subscribe('task_completed', async (event) => {
    console.log('[PipelineDownstream] [DIAGNOSTIC] task_completed fired:', event);
  });

  executionPipelineEvents.subscribe('day_completed', async (event) => {
    console.log('[PipelineDownstream] [DIAGNOSTIC] day_completed fired:', event);
  });

  executionPipelineEvents.subscribe('week_unlocked', async (event) => {
    console.log('[PipelineDownstream] [DIAGNOSTIC] week_unlocked fired:', event);
  });

  executionPipelineEvents.subscribe('achievement_unlocked', async (event) => {
    console.log('[PipelineDownstream] [DIAGNOSTIC] achievement_unlocked fired:', event);
  });

  executionPipelineEvents.subscribe('xp_awarded', async (event) => {
    console.log('[PipelineDownstream] [DIAGNOSTIC] xp_awarded fired:', event);
  });

  console.log('[PipelineDownstream] ✓ All downstream handlers initialized');
}
