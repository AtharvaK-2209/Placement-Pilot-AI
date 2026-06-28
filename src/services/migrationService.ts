/**
 * @file migrationService.ts
 *
 * One-time migration from localStorage → Firestore.
 * Called when a user signs in for the first time on a device
 * that has existing localStorage progress data.
 *
 * Strategy:
 *   1. Read "pp_progress" from localStorage.
 *   2. Check if Firestore already has data for this user.
 *   3. If localStorage has data AND Firestore is empty → copy to Firestore.
 *   4. After successful copy → remove the localStorage key.
 *   5. Mark migration complete in localStorage so it never runs again.
 *
 * This is idempotent: if the migration has already run, it exits immediately.
 */

import { FirestoreProgressRepository } from '../repositories/FirestoreProgressRepository';
import type { UserProgress }           from '../types/progress';
import { db }                          from '../config/firebase';

const MIGRATION_FLAG_KEY = 'pp_migrated_to_firestore';
const LS_PROGRESS_KEY    = 'pp_progress';

/**
 * Runs the localStorage → Firestore migration for the given user.
 * Safe to call on every sign-in — exits immediately if already migrated.
 *
 * @param uid  Firebase Auth user id.
 */
export async function migrateLocalStorageToFirestore(uid: string): Promise<void> {
  // Already migrated on this device — skip
  if (localStorage.getItem(MIGRATION_FLAG_KEY) === 'true') return;

  const raw = localStorage.getItem(LS_PROGRESS_KEY);
  if (!raw) {
    // Nothing to migrate
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    return;
  }

  let localProgress: UserProgress;
  try {
    localProgress = JSON.parse(raw) as UserProgress;
  } catch {
    console.warn('[migrationService] localStorage data is corrupt — skipping migration.');
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    return;
  }

  const repo = new FirestoreProgressRepository(db, uid);

  // Only migrate if Firestore is empty for this user
  const existing = await repo.getProgress();
  if (existing) {
    // User already has Firestore data — don't overwrite
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    return;
  }

  try {
    await repo.saveProgress(localProgress);
    console.log('[migrationService] ✓ Migrated localStorage progress to Firestore.');
    // Clean up localStorage after successful migration
    localStorage.removeItem(LS_PROGRESS_KEY);
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
  } catch (e) {
    console.error('[migrationService] Migration failed — localStorage data preserved:', e);
    // Do NOT set the flag — will retry on next sign-in
  }
}
