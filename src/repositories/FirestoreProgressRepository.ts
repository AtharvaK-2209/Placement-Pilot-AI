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

/**
 * Sanitize an object for Firestore by removing undefined values.
 * Firestore does not allow undefined — we must omit such fields entirely.
 */
function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      sanitized[key] = sanitizeForFirestore(value);
    }
  }
  return sanitized;
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
      if (snap.exists()) {
        const progress = snap.data() as UserProgress;
        console.log(`[FirestoreProgressRepository] ✓ Read progress from Firestore, days count: ${Object.keys(progress.days).length}`);
        return progress;
      } else {
        console.log(`[FirestoreProgressRepository] No progress document found in Firestore`);
        return null;
      }
    } catch (e) {
      console.error('[FirestoreProgressRepository] ✗ read failed:', e);
      throw new Error(`Firestore read failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }

  private async write(progress: UserProgress): Promise<void> {
    try {
      progress.updatedAt = new Date().toISOString();
      console.log(`[FirestoreProgressRepository] Writing progress to Firestore, days count: ${Object.keys(progress.days).length}`);
      
      // Sanitize the progress object to remove any undefined values
      // Firestore does not allow undefined — they must be omitted entirely
      const sanitized = sanitizeForFirestore(progress);
      
      console.log(`[FirestoreProgressRepository] Sanitized payload before Firestore write`);
      await setDoc(this.ref(), sanitized);
      console.log(`[FirestoreProgressRepository] ✓ Progress written successfully to Firestore`);
    } catch (e) {
      console.error('[FirestoreProgressRepository] ✗ write failed:', e);
      // Re-throw the error so it can be caught by calling code
      throw new Error(`Firestore write failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
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
    const key = dayKey(day.weekNumber, day.dayNumber);
    console.log(`[FirestoreProgressRepository] Saving day progress for ${key}`);
    await this.write(progress);
    console.log(`[FirestoreProgressRepository] ✓ Day progress saved successfully for ${key}`);
  }

  async updateTask(
    weekNumber: number,
    dayNumber:  number,
    taskTitle:  string,
    completed:  boolean,
  ): Promise<DayProgress> {  // ✅ CHANGED: Return DayProgress instead of void
    const progress = await this.readOrInit();
    const key = dayKey(weekNumber, dayNumber);
    const day = progress.days[key];
    
    console.log(`[FirestoreProgressRepository] updateTask for ${key}, taskTitle: "${taskTitle}", completed: ${completed}`);
    console.log(`[FirestoreProgressRepository] Day exists in progress:`, !!day);
    console.log(`[FirestoreProgressRepository] Total days in progress:`, Object.keys(progress.days).length);
    
    if (!day) {
      console.error(`[FirestoreProgressRepository] ✗ updateTask: day ${key} not found in progress.days`);
      console.error(`[FirestoreProgressRepository] Available days:`, Object.keys(progress.days));
      throw new Error(`Failed to persist task completion: day ${key} not found. This may be a Firestore permissions issue or the day was never initialized.`);
    }

    const updatedTasks: TaskCompletion[] = day.tasks.map((t) => {
      if (t.taskTitle === taskTitle) {
        // Only include completedAt if the task is now complete
        const updated: TaskCompletion = { 
          ...t, 
          completed 
        };
        if (completed) {
          updated.completedAt = new Date().toISOString();
        }
        return updated;
      }
      return t;
    });

    const completedCount    = updatedTasks.filter((t) => t.completed).length;
    const completionPercent = updatedTasks.length > 0
      ? Math.round((completedCount / updatedTasks.length) * 100)
      : 0;
    const allDone = completedCount === updatedTasks.length && updatedTasks.length > 0;

    const updatedDay: DayProgress = {  // ✅ CHANGED: Store updated day in variable
      ...day,
      tasks: updatedTasks,
      completionPercent,
      // Only include completedAt if all tasks are done
      ...(allDone && !day.completedAt ? { completedAt: new Date().toISOString() } : 
           day.completedAt ? { completedAt: day.completedAt } : {}),
    };
    
    progress.days[key] = updatedDay;

    console.log(`[FirestoreProgressRepository] Writing updated progress for ${key}`);
    await this.write(progress);
    console.log(`[FirestoreProgressRepository] ✓ Task update persisted successfully for ${key}`);
    
    // ✅ CHANGED: Return the updated day directly from memory (not from Firestore cache)
    return updatedDay;
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
