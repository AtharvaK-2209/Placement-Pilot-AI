/**
 * @file roadmapProgressService.ts
 *
 * Deterministic week-unlock and progress tracking.
 * Zero AI — purely computation on saved DayProgress records.
 *
 * Unlock rule: when week N's completionPercent >= unlockThreshold (default 80%),
 * week N+1 is unlocked automatically.
 */

import type { RoadmapProgressRepository } from '../repositories/RoadmapProgressRepository';
import type { ProgressRepository }        from '../repositories/ProgressRepository';
import type { RoadmapProgress, WeekExecutionStatus } from '../types/roadmapProgress';

const DEFAULT_THRESHOLD = 80; // unlock next week at 80% current week

export class RoadmapProgressService {
  private readonly roadmapProgressRepo: RoadmapProgressRepository;
  private readonly progressRepo:        ProgressRepository;

  constructor(rpr: RoadmapProgressRepository, pr: ProgressRepository) {
    this.roadmapProgressRepo = rpr;
    this.progressRepo        = pr;
  }

  /**
   * Initialises roadmap progress for a new roadmap.
   * Week 1 starts unlocked; all others locked.
   * No-op if progress already exists with the same total weeks.
   */
  async initRoadmapProgress(totalWeeks: number): Promise<RoadmapProgress> {
    const existing = await this.roadmapProgressRepo.getProgress();
    
    console.log(`[RoadmapProgress] Initializing roadmap progress for ${totalWeeks} weeks`);
    
    if (existing) {
      console.log(`[RoadmapProgress] Found existing progress: ${existing.weekStatuses.length} weeks, unlockedWeek: ${existing.unlockedWeek}`);
      if (existing.weekStatuses.length === totalWeeks) {
        console.log(`[RoadmapProgress] Week count matches, using existing progress`);
        return existing;
      } else {
        console.log(`[RoadmapProgress] Week count changed (${existing.weekStatuses.length} -> ${totalWeeks}), reinitializing`);
      }
    } else {
      console.log(`[RoadmapProgress] No existing progress found, creating fresh progress`);
    }

    const weekStatuses: WeekExecutionStatus[] = Array.from({ length: totalWeeks }, (_, i) => ({
      weekNumber:        i + 1,
      generatedDays:     0,
      completedDays:     0,
      completionPercent: 0,
      status:            i === 0 ? 'unlocked' : 'locked',
    }));

    const fresh: RoadmapProgress = {
      currentWeek:       1,
      unlockedWeek:      1,
      completedWeeks:    0,
      completedTasks:    0,
      completedDays:     0,
      overallCompletion: 0,
      weekStatuses,
      unlockThreshold:   DEFAULT_THRESHOLD,
      updatedAt:         new Date().toISOString(),
    };

    console.log(`[RoadmapProgress] Created fresh progress with unlock threshold: ${DEFAULT_THRESHOLD}%`);

    await this.roadmapProgressRepo.saveProgress(fresh);
    return fresh;
  }

  /**
   * Recomputes all week statuses from DayProgress records and
   * unlocks the next week when the current week's threshold is met.
   * Call this after every task completion.
   */
  async recomputeAndUnlock(totalWeeks: number): Promise<RoadmapProgress> {
    const rp = await this.roadmapProgressRepo.getProgress()
      ?? await this.initRoadmapProgress(totalWeeks);

    const progress = await this.progressRepo.getProgress();
    const threshold = rp.unlockThreshold;

    console.log(`[RoadmapProgress] Recomputing unlock status. Threshold: ${threshold}%`);

    let completedWeeksCount = 0;
    let completedDaysTotal  = 0;
    let completedTasksTotal = 0;
    let maxUnlocked         = rp.unlockedWeek;

    const weekStatuses: WeekExecutionStatus[] = rp.weekStatuses.map((ws) => {
      // Count completed days for this week
      let completedDays  = 0;
      let generatedDays  = 0;
      let completedTasks = 0;

      for (let d = 1; d <= 7; d++) {
        const key = `w${ws.weekNumber}-d${d}`;
        const day = progress?.days[key];
        if (!day) continue;
        
        generatedDays++;
        completedTasks += day.tasks.filter((t) => t.completed).length;
        
        if (day.completionPercent === 100) {
          completedDays++;
        }
      }

      completedDaysTotal += completedDays;
      completedTasksTotal += completedTasks;

      // FIX: Calculate completion percentage - require substantial week progress
      // Use total 7 days as denominator but allow unlock if user has made good progress
      // This ensures users need to complete multiple days to unlock next week
      const completionPercent = Math.round((completedDays / 7) * 100);

      let status: WeekExecutionStatus['status'] = ws.status;
      
      // Mark week as completed if all generated days are 100% complete and at least 1 day generated
      if (completionPercent === 100 && generatedDays > 0) {
        status = 'completed';
        completedWeeksCount++;
      } else if (completedDays > 0 || generatedDays > 0) {
        status = 'in_progress';
      }

      console.log(`[RoadmapProgress] Week ${ws.weekNumber}: ${completedDays}/${generatedDays} days complete, ${completedTasks} tasks, ${completionPercent}% completion, status: ${status}`);

      // FIX: Unlock next week if current week meets threshold AND there is a next week
      if (completionPercent >= threshold && ws.weekNumber < totalWeeks) {
        const nextWeek = ws.weekNumber + 1;
        if (nextWeek > maxUnlocked) {
          maxUnlocked = nextWeek;
          console.log(`[RoadmapProgress] ✓ Week ${ws.weekNumber} reached ${completionPercent}% (>= ${threshold}%) - UNLOCKING Week ${nextWeek}`);
        } else {
          console.log(`[RoadmapProgress] Week ${ws.weekNumber} meets threshold (${completionPercent}% >= ${threshold}%) but Week ${nextWeek} already unlocked`);
        }
      } else if (ws.weekNumber < totalWeeks) {
        console.log(`[RoadmapProgress] Week ${ws.weekNumber}: ${completionPercent}% < ${threshold}% threshold, Week ${ws.weekNumber + 1} stays locked`);
      }

      return { 
        ...ws, 
        completedDays, 
        generatedDays, 
        completionPercent, 
        status 
      };
    });

    // Apply unlock propagation: ensure all weeks up to maxUnlocked are unlocked
    const finalStatuses = weekStatuses.map((ws) => {
      const newStatus = ws.weekNumber <= maxUnlocked && ws.status === 'locked'
        ? ('unlocked' as WeekExecutionStatus['status'])
        : ws.status;
      
      if (newStatus !== ws.status) {
        console.log(`[RoadmapProgress] Week ${ws.weekNumber}: ${ws.status} -> ${newStatus}`);
      }
      
      return { ...ws, status: newStatus };
    });

    const overallCompletion = totalWeeks > 0
      ? Math.round((completedWeeksCount / totalWeeks) * 100)
      : 0;

    const updated: RoadmapProgress = {
      ...rp,
      unlockedWeek:      maxUnlocked,
      completedWeeks:    completedWeeksCount,
      completedDays:     completedDaysTotal,
      completedTasks:    completedTasksTotal,
      overallCompletion,
      weekStatuses:      finalStatuses,
      updatedAt:         new Date().toISOString(),
    };

    console.log(`[RoadmapProgress] Final state: unlockedWeek=${maxUnlocked}, completedWeeks=${completedWeeksCount}`);

    await this.roadmapProgressRepo.saveProgress(updated);
    return updated;
  }

  /**
   * Records that a daily mission has been generated for a specific week/day.
   * This updates the generatedDays count in the roadmap progress.
   */
  async recordMissionGenerated(weekNumber: number, dayNumber: number): Promise<void> {
    const rp = await this.roadmapProgressRepo.getProgress();
    if (!rp) return;

    console.log(`[RoadmapProgress] Recording mission generated for Week ${weekNumber}, Day ${dayNumber}`);

    const updatedStatuses = rp.weekStatuses.map(ws => {
      if (ws.weekNumber === weekNumber) {
        // Increment generated days if this day wasn't already counted
        const alreadyGenerated = ws.generatedDays >= dayNumber;
        const newGeneratedDays = Math.max(ws.generatedDays, dayNumber);
        
        if (!alreadyGenerated) {
          console.log(`[RoadmapProgress] Week ${weekNumber} generatedDays: ${ws.generatedDays} -> ${newGeneratedDays}`);
        }
        
        return { ...ws, generatedDays: newGeneratedDays };
      }
      return ws;
    });

    const updated: RoadmapProgress = {
      ...rp,
      weekStatuses: updatedStatuses,
      updatedAt: new Date().toISOString(),
    };

    await this.roadmapProgressRepo.saveProgress(updated);
  }

  async getProgress(): Promise<RoadmapProgress | null> {
    return this.roadmapProgressRepo.getProgress();
  }

  async resetProgress(): Promise<void> {
    return this.roadmapProgressRepo.resetProgress();
  }
}
