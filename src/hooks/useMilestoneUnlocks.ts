/**
 * @file useMilestoneUnlocks.ts
 *
 * Hook that sets up automatic milestone unlocking based on key lifecycle events.
 * This hook integrates with the execution pipeline to unlock milestones
 * when users complete significant actions.
 *
 * Milestones unlocked:
 * - first-login: After successful authentication
 * - goal-analysis-complete: After goal analysis is generated
 * - roadmap-generated: After roadmap is generated
 * - first-mission-complete: After first daily mission is generated OR first task completed
 *
 * Unlocking is fully idempotent — repeating the same action won't create duplicates.
 */

import { useEffect, useRef } from 'react';
import { GamificationService } from '../services/gamificationService';
import { getProgressRepository } from '../repositories';
import { executionPipelineEvents } from '../services/executionPipelineEvents';

// Singleton instance
let gamificationService: GamificationService | null = null;

function getGamificationService(): GamificationService {
  if (!gamificationService) {
    const repo = getProgressRepository();
    gamificationService = new GamificationService(repo);
  }
  return gamificationService;
}

export function useMilestoneUnlocks(): void {
  const unsubscribersRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    console.log('[useMilestoneUnlocks] Setting up milestone unlock handlers');
    const service = getGamificationService();

    // ── Handler: Unlock "first-login" on successful authentication ──
    const unsubLogin = executionPipelineEvents.subscribe('first_login', async () => {
      try {
        console.log('[useMilestoneUnlocks] Attempting to unlock first-login milestone');
        const milestone = await service.unlockMilestone('first-login');
        if (milestone) {
          console.log('[useMilestoneUnlocks] ✓ Unlocked first-login milestone');
          // Emit event for any listeners
          await executionPipelineEvents.emit({
            type: 'milestone_unlocked',
            timestamp: new Date().toISOString(),
            data: {
              milestoneId: milestone.id,
              title: milestone.title,
            },
          });
        }
      } catch (error) {
        console.error('[useMilestoneUnlocks] Error unlocking first-login:', error);
      }
    });

    unsubscribersRef.current.push(unsubLogin);

    // ── Handler: Unlock "goal-analysis-complete" when goal analysis completes ──
    // This is emitted from GoalPage after analyzeGoal returns successfully
    const unsubGoal = executionPipelineEvents.subscribe('goal_analysis_complete', async () => {
      try {
        console.log('[useMilestoneUnlocks] Attempting to unlock goal-analysis-complete milestone');
        const milestone = await service.unlockMilestone('goal-analysis-complete');
        if (milestone) {
          console.log('[useMilestoneUnlocks] ✓ Unlocked goal-analysis-complete milestone');
          await executionPipelineEvents.emit({
            type: 'milestone_unlocked',
            timestamp: new Date().toISOString(),
            data: {
              milestoneId: milestone.id,
              title: milestone.title,
            },
          });
        }
      } catch (error) {
        console.error('[useMilestoneUnlocks] Error unlocking goal-analysis-complete:', error);
      }
    });

    unsubscribersRef.current.push(unsubGoal);

    // ── Handler: Unlock "roadmap-generated" when roadmap is generated ──
    const unsubRoadmap = executionPipelineEvents.subscribe('roadmap_generated', async () => {
      try {
        console.log('[useMilestoneUnlocks] Attempting to unlock roadmap-generated milestone');
        const milestone = await service.unlockMilestone('roadmap-generated');
        if (milestone) {
          console.log('[useMilestoneUnlocks] ✓ Unlocked roadmap-generated milestone');
          await executionPipelineEvents.emit({
            type: 'milestone_unlocked',
            timestamp: new Date().toISOString(),
            data: {
              milestoneId: milestone.id,
              title: milestone.title,
            },
          });
        }
      } catch (error) {
        console.error('[useMilestoneUnlocks] Error unlocking roadmap-generated:', error);
      }
    });

    unsubscribersRef.current.push(unsubRoadmap);

    // ── Handler: Unlock "first-mission-complete" when first mission is generated ──
    // This is emitted from DailyMissionPage after generateDailyMission returns
    const unsubMission = executionPipelineEvents.subscribe('first_mission_generated', async () => {
      try {
        console.log('[useMilestoneUnlocks] Attempting to unlock first-mission-complete milestone');
        const milestone = await service.unlockMilestone('first-mission-complete');
        if (milestone) {
          console.log('[useMilestoneUnlocks] ✓ Unlocked first-mission-complete milestone');
          await executionPipelineEvents.emit({
            type: 'milestone_unlocked',
            timestamp: new Date().toISOString(),
            data: {
              milestoneId: milestone.id,
              title: milestone.title,
            },
          });
        }
      } catch (error) {
        console.error('[useMilestoneUnlocks] Error unlocking first-mission-complete:', error);
      }
    });

    unsubscribersRef.current.push(unsubMission);

    return () => {
      console.log('[useMilestoneUnlocks] Cleaning up milestone unlock handlers');
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
    };
  }, []);
}

/**
 * Immediately emits a milestone unlock event.
 * Used to trigger milestone unlocks from specific pages where events occur.
 */
export async function emitMilestoneEvent(eventName: string, data: Record<string, unknown>): Promise<void> {
  await executionPipelineEvents.emit({
    type: eventName as any,
    timestamp: new Date().toISOString(),
    data,
  });
}
