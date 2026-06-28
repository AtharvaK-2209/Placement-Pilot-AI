/**
 * @file progressService.ts
 *
 * Business logic for tracking daily and weekly progress.
 *
 * ─── DEPENDENCY RULE ─────────────────────────────────────────────────────────
 * This service depends ONLY on ProgressRepository.
 * It has ZERO knowledge of localStorage, Firestore, or any storage detail.
 * Storage is injected via the repository — never referenced directly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { ProgressRepository }  from '../repositories/ProgressRepository';
import type { DailyMission }        from '../ai/dailyMission/dailyMission.schema';
import type { DayProgress, TaskCompletion, UserProgress, WeekProgress } from '../types/progress';

// ─── Progress Service ─────────────────────────────────────────────────────────

export class ProgressService {
  private readonly repo: ProgressRepository;
  constructor(repo: ProgressRepository) { this.repo = repo; }

  // ── Initialisation ──────────────────────────────────────────────────────────

  /**
   * Initialises a UserProgress record for a new roadmap.
   * Should be called once when the roadmap is first generated.
   * No-op if progress already exists for this roadmap title.
   */
  async initProgress(roadmapTitle: string): Promise<void> {
    const existing = await this.repo.getProgress();
    if (existing?.roadmapTitle === roadmapTitle) return;

    const fresh: UserProgress = {
      roadmapTitle,
      startedAt:    new Date().toISOString(),
      days:         {},
      totalXP:      0,
      xpLog:        [],
      streak: {
        currentStreak:   0,
        longestStreak:   0,
        lastActiveDate:  '',
        totalActiveDays: 0,
      },
      achievements: [],
      updatedAt:    new Date().toISOString(),
    };

    await this.repo.saveProgress(fresh);
  }

  // ── Day progress ────────────────────────────────────────────────────────────

  /**
   * Opens a new day by creating a DayProgress record from a generated mission.
   * If the day already exists, returns the existing record without overwriting.
   */
  async openDay(
    weekNumber:   number,
    dayNumber:    number,
    mission:      DailyMission,
  ): Promise<DayProgress> {
    const existing = await this.repo.getDayProgress(weekNumber, dayNumber);
    if (existing) return existing;

    const allTasks: TaskCompletion[] = [
      ...mission.learningTasks.map((t) => ({ taskTitle: t.title, completed: false })),
      ...mission.practiceTasks.map((t) => ({ taskTitle: t.title, completed: false })),
      ...mission.revisionTasks.map((t) => ({ taskTitle: t.title, completed: false })),
    ];

    const day: DayProgress = {
      weekNumber,
      dayNumber,
      missionTitle:      mission.title,
      tasks:             allTasks,
      completionPercent: 0,
      startedAt:         new Date().toISOString(),
    };

    await this.repo.saveDayProgress(day);
    return day;
  }

  /**
   * Marks a single task as complete or incomplete.
   * Returns the updated DayProgress after the write.
   */
  async completeTask(
    weekNumber: number,
    dayNumber:  number,
    taskTitle:  string,
    completed = true,
  ): Promise<DayProgress | null> {
    await this.repo.updateTask(weekNumber, dayNumber, taskTitle, completed);
    return this.repo.getDayProgress(weekNumber, dayNumber);
  }

  // ── Week progress ────────────────────────────────────────────────────────────

  /**
   * Computes WeekProgress by aggregating DayProgress records.
   * Derived — never stored separately.
   */
  async getWeekProgress(weekNumber: number, weekTitle: string): Promise<WeekProgress> {
    const progress = await this.repo.getProgress();
    if (!progress) {
      return {
        weekNumber,
        weekTitle,
        completedDays:     0,
        totalDays:         7,
        completionPercent: 0,
        completed:         false,
      };
    }

    let completedDays = 0;
    for (let d = 1; d <= 7; d++) {
      const key = `w${weekNumber}-d${d}`;
      const day = progress.days[key];
      if (day?.completionPercent === 100) completedDays++;
    }

    const completionPercent = Math.round((completedDays / 7) * 100);
    const completed = completedDays === 7;

    return {
      weekNumber,
      weekTitle,
      completedDays,
      totalDays:         7,
      completionPercent,
      completed,
      completedAt:       completed ? new Date().toISOString() : undefined,
    };
  }

  // ── Reset ────────────────────────────────────────────────────────────────────

  async resetAll(): Promise<void> {
    await this.repo.resetProgress();
  }
}
