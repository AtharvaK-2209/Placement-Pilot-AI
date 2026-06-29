/**
 * @file LocalStorageProgressRepository.ts
 *
 * localStorage implementation of ProgressRepository.
 *
 * ─── STRICT RULE ──────────────────────────────────────────────────────────────
 * This is the ONLY file in the entire project that is allowed to call:
 *   - localStorage.getItem()
 *   - localStorage.setItem()
 *   - localStorage.removeItem()
 *   - JSON.parse()
 *   - JSON.stringify()
 *
 * No service, agent, hook, or React component may access localStorage directly.
 * See docs/architecture/PROMPT_ENGINEERING.md and ProgressRepository.ts.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Storage layout (all values are JSON strings):
 *   Key: "pp_progress"  → UserProgress (full aggregate)
 *
 * A single key is used intentionally so the entire progress object is
 * atomically replaced on each write. This maps cleanly to a single Firestore
 * document when the migration happens.
 */

import type { ProgressRepository } from './ProgressRepository';
import type {
  UserProgress,
  DayProgress,
  TaskCompletion,
  XPEntry,
  StreakState,
  Achievement,
} from '../types/progress';

// ─── Storage key ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'pp_progress' as const;

// ─── Default state factories ───────────────────────────────────────────────────

function defaultStreak(): StreakState {
  return {
    currentStreak:   0,
    longestStreak:   0,
    lastActiveDate:  '',
    totalActiveDays: 0,
  };
}

function defaultProgress(roadmapTitle: string): UserProgress {
  return {
    roadmapTitle,
    startedAt:    new Date().toISOString(),
    days:         {},
    totalXP:      0,
    xpLog:        [],
    streak:       defaultStreak(),
    achievements: [],
    updatedAt:    new Date().toISOString(),
  };
}

// ─── Day key helper ────────────────────────────────────────────────────────────

function dayKey(weekNumber: number, dayNumber: number): string {
  return `w${weekNumber}-d${dayNumber}`;
}

// ─── Implementation ────────────────────────────────────────────────────────────

export class LocalStorageProgressRepository implements ProgressRepository {

  // ── Internal read/write ─────────────────────────────────────────────────────

  private read(): UserProgress | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as UserProgress;
    } catch (e) {
      console.error('[LocalStorageProgressRepository] read failed:', e);
      return null;
    }
  }

  private write(progress: UserProgress): void {
    try {
      progress.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('[LocalStorageProgressRepository] write failed:', e);
    }
  }

  /** Returns existing progress or initialises a blank record. */
  private readOrInit(roadmapTitle = 'My Roadmap'): UserProgress {
    return this.read() ?? defaultProgress(roadmapTitle);
  }

  // ── Full aggregate ──────────────────────────────────────────────────────────

  async getProgress(): Promise<UserProgress | null> {
    return Promise.resolve(this.read());
  }

  async saveProgress(progress: UserProgress): Promise<void> {
    this.write(progress);
    return Promise.resolve();
  }

  async resetProgress(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('[LocalStorageProgressRepository] resetProgress failed:', e);
    }
    return Promise.resolve();
  }

  // ── Day & task granularity ───────────────────────────────────────────────────

  async getDayProgress(weekNumber: number, dayNumber: number): Promise<DayProgress | null> {
    const progress = this.read();
    if (!progress) return Promise.resolve(null);
    const key = dayKey(weekNumber, dayNumber);
    return Promise.resolve(progress.days[key] ?? null);
  }

  async saveDayProgress(day: DayProgress): Promise<void> {
    const progress = this.readOrInit();
    const key = dayKey(day.weekNumber, day.dayNumber);
    progress.days[key] = day;
    this.write(progress);
    return Promise.resolve();
  }

  async updateTask(
    weekNumber: number,
    dayNumber:  number,
    taskTitle:  string,
    completed:  boolean,
  ): Promise<void> {
    const progress = this.readOrInit();
    const key = dayKey(weekNumber, dayNumber);
    const day = progress.days[key];

    if (!day) {
      console.warn(`[LocalStorageProgressRepository] updateTask: day ${key} not found`);
      return Promise.resolve();
    }

    // Update the matching task
    const updatedTasks: TaskCompletion[] = day.tasks.map((t) =>
      t.taskTitle === taskTitle
        ? { ...t, completed, completedAt: completed ? new Date().toISOString() : undefined }
        : t,
    );

    // Recompute completion percent
    const completedCount = updatedTasks.filter((t) => t.completed).length;
    const completionPercent =
      updatedTasks.length > 0
        ? Math.round((completedCount / updatedTasks.length) * 100)
        : 0;

    const allDone = completedCount === updatedTasks.length && updatedTasks.length > 0;

    progress.days[key] = {
      ...day,
      tasks:             updatedTasks,
      completionPercent,
      completedAt:       allDone && !day.completedAt ? new Date().toISOString() : day.completedAt,
    };

    this.write(progress);
    return Promise.resolve();
  }

  // ── XP ──────────────────────────────────────────────────────────────────────

  async getTotalXP(): Promise<number> {
    return Promise.resolve(this.read()?.totalXP ?? 0);
  }

  async addXP(entry: XPEntry): Promise<void> {
    const progress = this.readOrInit();
    progress.xpLog   = [...progress.xpLog, entry];
    progress.totalXP = progress.totalXP + entry.amount;
    this.write(progress);
    return Promise.resolve();
  }

  async getXPLog(): Promise<XPEntry[]> {
    return Promise.resolve(this.read()?.xpLog ?? []);
  }

  // ── Streak ──────────────────────────────────────────────────────────────────

  async getStreak(): Promise<StreakState> {
    return Promise.resolve(this.read()?.streak ?? defaultStreak());
  }

  async updateStreak(streak: StreakState): Promise<void> {
    const progress    = this.readOrInit();
    progress.streak   = streak;
    this.write(progress);
    return Promise.resolve();
  }

  // ── Achievements ────────────────────────────────────────────────────────────

  async getAchievements(): Promise<Achievement[]> {
    return Promise.resolve(this.read()?.achievements ?? []);
  }

  async addAchievement(achievement: Achievement): Promise<void> {
    const progress = this.readOrInit();
    // Idempotent — skip if already unlocked
    const alreadyUnlocked = progress.achievements.some((a) => a.id === achievement.id);
    if (alreadyUnlocked) return Promise.resolve();
    progress.achievements = [...progress.achievements, achievement];
    this.write(progress);
    return Promise.resolve();
  }

  // ── Gamification (Phase 10) ─────────────────────────────────────────────────

  async getXPHistory(startDate: string, endDate: string): Promise<XPEntry[]> {
    const xpLog = await this.getXPLog();
    return Promise.resolve(
      xpLog.filter(entry => {
        const entryDate = entry.earnedAt.split('T')[0];
        return entryDate >= startDate && entryDate <= endDate;
      })
    );
  }

  async getTotalTasksCompleted(): Promise<number> {
    const progress = this.read();
    if (!progress) return Promise.resolve(0);
    const total = Object.values(progress.days).reduce(
      (sum, day) => sum + day.tasks.filter(t => t.completed).length,
      0
    );
    return Promise.resolve(total);
  }
}
