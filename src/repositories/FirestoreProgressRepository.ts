/**
 * @file FirestoreProgressRepository.ts
 *
 * Firestore implementation of ProgressRepository.
 * Drop-in replacement for LocalStorageProgressRepository.
 *
 * Storage layout:
 *   users/{uid}/progress/current  →  UserProgress (full aggregate)
 *
 * Single-document strategy mirrors the localStorage approach:
 * the entire UserProgress object is read/written atomically.
 * This keeps the implementation simple and offline-friendly.
 *
 * Activate by changing ONE line in src/repositories/index.ts:
 *   new LocalStorageProgressRepository(uid)
 *   → new FirestoreProgressRepository(uid)
 */

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  type Firestore,
} from 'firebase/firestore';
import type { ProgressRepository }  from './ProgressRepository';
import type {
  UserProgress,
  DayProgress,
  TaskCompletion,
  XPEntry,
  StreakState,
  Achievement,
} from '../types/progress';
import { progressDoc } from '../config/firestorePaths';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dayKey(weekNumber: number, dayNumber: number): string {
  return `w${weekNumber}-d${dayNumber}`;
}

function defaultStreak(): StreakState {
  return { currentStreak: 0, longestStreak: 0, lastActiveDate: '', totalActiveDays: 0 };
}

function defaultProgress(roadmapTitle: string): UserProgress {
  const now = new Date().toISOString();
  return {
    roadmapTitle,
    startedAt:    now,
    days:         {},
    totalXP:      0,
    xpLog:        [],
    streak:       defaultStreak(),
    achievements: [],
    updatedAt:    now,
  };
}

// ─── Implementation ────────────────────────────────────────────────────────────

export class FirestoreProgressRepository implements ProgressRepository {
  private readonly db: Firestore;
  private readonly uid: string;

  constructor(db: Firestore, uid: string) {
    this.db  = db;
    this.uid = uid;
  }

  // ── Internal helpers ────────────────────────────────────────────────────────

  private ref() {
    return doc(this.db, progressDoc(this.uid));
  }

  private async read(): Promise<UserProgress | null> {
    try {
      const snap = await getDoc(this.ref());
      return snap.exists() ? (snap.data() as UserProgress) : null;
    } catch (e) {
      console.error('[FirestoreProgressRepository] read failed:', e);
      return null;
    }
  }

  private async write(progress: UserProgress): Promise<void> {
    try {
      progress.updatedAt = new Date().toISOString();
      await setDoc(this.ref(), progress);
    } catch (e) {
      console.error('[FirestoreProgressRepository] write failed:', e);
    }
  }

  private async readOrInit(roadmapTitle = 'My Roadmap'): Promise<UserProgress> {
    return (await this.read()) ?? defaultProgress(roadmapTitle);
  }

  // ── Full aggregate ──────────────────────────────────────────────────────────

  async getProgress(): Promise<UserProgress | null> {
    return this.read();
  }

  async saveProgress(progress: UserProgress): Promise<void> {
    return this.write(progress);
  }

  async resetProgress(): Promise<void> {
    try {
      await deleteDoc(this.ref());
    } catch (e) {
      console.error('[FirestoreProgressRepository] resetProgress failed:', e);
    }
  }

  // ── Day & task granularity ───────────────────────────────────────────────────

  async getDayProgress(weekNumber: number, dayNumber: number): Promise<DayProgress | null> {
    const progress = await this.read();
    if (!progress) return null;
    return progress.days[dayKey(weekNumber, dayNumber)] ?? null;
  }

  async saveDayProgress(day: DayProgress): Promise<void> {
    const progress = await this.readOrInit();
    progress.days[dayKey(day.weekNumber, day.dayNumber)] = day;
    return this.write(progress);
  }

  async updateTask(
    weekNumber: number,
    dayNumber:  number,
    taskTitle:  string,
    completed:  boolean,
  ): Promise<void> {
    const progress = await this.readOrInit();
    const key = dayKey(weekNumber, dayNumber);
    const day = progress.days[key];
    if (!day) {
      console.warn(`[FirestoreProgressRepository] updateTask: day ${key} not found`);
      return;
    }

    const updatedTasks: TaskCompletion[] = day.tasks.map((t) =>
      t.taskTitle === taskTitle
        ? { ...t, completed, completedAt: completed ? new Date().toISOString() : undefined }
        : t,
    );

    const completedCount    = updatedTasks.filter((t) => t.completed).length;
    const completionPercent = updatedTasks.length > 0
      ? Math.round((completedCount / updatedTasks.length) * 100)
      : 0;
    const allDone = completedCount === updatedTasks.length && updatedTasks.length > 0;

    progress.days[key] = {
      ...day,
      tasks: updatedTasks,
      completionPercent,
      completedAt: allDone && !day.completedAt ? new Date().toISOString() : day.completedAt,
    };

    return this.write(progress);
  }

  // ── XP ──────────────────────────────────────────────────────────────────────

  async getTotalXP(): Promise<number> {
    return (await this.read())?.totalXP ?? 0;
  }

  async addXP(entry: XPEntry): Promise<void> {
    const progress   = await this.readOrInit();
    progress.xpLog   = [...progress.xpLog, entry];
    progress.totalXP = progress.totalXP + entry.amount;
    return this.write(progress);
  }

  async getXPLog(): Promise<XPEntry[]> {
    return (await this.read())?.xpLog ?? [];
  }

  // ── Streak ──────────────────────────────────────────────────────────────────

  async getStreak(): Promise<StreakState> {
    return (await this.read())?.streak ?? defaultStreak();
  }

  async updateStreak(streak: StreakState): Promise<void> {
    const progress  = await this.readOrInit();
    progress.streak = streak;
    return this.write(progress);
  }

  // ── Achievements ────────────────────────────────────────────────────────────

  async getAchievements(): Promise<Achievement[]> {
    return (await this.read())?.achievements ?? [];
  }

  async addAchievement(achievement: Achievement): Promise<void> {
    const progress = await this.readOrInit();
    if (progress.achievements.some((a) => a.id === achievement.id)) return;
    progress.achievements = [...progress.achievements, achievement];
    return this.write(progress);
  }

  // ── Gamification (Phase 10) ─────────────────────────────────────────────────

  async getXPHistory(startDate: string, endDate: string): Promise<XPEntry[]> {
    const xpLog = await this.getXPLog();
    return xpLog.filter(entry => {
      const entryDate = entry.earnedAt.split('T')[0];
      return entryDate >= startDate && entryDate <= endDate;
    });
  }

  async getTotalTasksCompleted(): Promise<number> {
    const progress = await this.read();
    if (!progress) return 0;
    return Object.values(progress.days).reduce(
      (sum, day) => sum + day.tasks.filter(t => t.completed).length,
      0
    );
  }
}
