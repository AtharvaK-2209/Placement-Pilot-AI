/**
 * @file repositories/index.ts
 *
 * ─── THE SINGLE SWAP POINT ────────────────────────────────────────────────────
 * This file decides which storage backend is active based on auth state.
 *
 * Authenticated user  → FirestoreProgressRepository (cloud, synced)
 * Unauthenticated     → LocalStorageProgressRepository (local, offline)
 *
 * All services import `getProgressRepository()` from here.
 * They never instantiate a repository directly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type { ProgressRepository }                     from './ProgressRepository';
export type { RoadmapRepository }                      from './RoadmapRepository';
export type { ExecutionIntelligenceRepository }        from './ExecutionIntelligenceRepository';
export { LocalStorageProgressRepository }              from './LocalStorageProgressRepository';
export { FirestoreProgressRepository }                 from './FirestoreProgressRepository';
export { LocalStorageRoadmapRepository }               from './LocalStorageRoadmapRepository';
export { FirestoreRoadmapRepository }                  from './FirestoreRoadmapRepository';
export { LocalStorageExecutionIntelligenceRepository } from './LocalStorageExecutionIntelligenceRepository';
export { FirestoreExecutionIntelligenceRepository }    from './FirestoreExecutionIntelligenceRepository';

import { LocalStorageProgressRepository }              from './LocalStorageProgressRepository';
import { FirestoreProgressRepository }                 from './FirestoreProgressRepository';
import { LocalStorageExecutionIntelligenceRepository } from './LocalStorageExecutionIntelligenceRepository';
import { FirestoreExecutionIntelligenceRepository }    from './FirestoreExecutionIntelligenceRepository';
import type { ProgressRepository }                     from './ProgressRepository';
import type { ExecutionIntelligenceRepository }        from './ExecutionIntelligenceRepository';
import { db }                                          from '../config/firebase';
import { getCurrentUser }                              from '../services/authService';

/**
 * Returns the correct repository for the current auth state.
 *
 * - Signed in  → FirestoreProgressRepository (data lives in Firestore under the user's uid)
 * - Signed out → LocalStorageProgressRepository (data lives in localStorage)
 *
 * Services call this once per operation so the correct backend is always used
 * even if auth state changes during the session.
 */
export function getProgressRepository(): ProgressRepository {
  const user = getCurrentUser();
  if (user) {
    return new FirestoreProgressRepository(db, user.uid);
  }
  return new LocalStorageProgressRepository();
}

/**
 * Static fallback used by the service singletons in services/index.ts.
 * Resolves to localStorage initially; services that need auth-aware
 * behaviour should call getProgressRepository() per operation instead.
 *
 * @deprecated  Prefer getProgressRepository() for auth-aware contexts.
 */
export const progressRepository: ProgressRepository = new LocalStorageProgressRepository();

/**
 * Returns the correct Execution Intelligence repository for the current auth state.
 *
 * - Signed in  → FirestoreExecutionIntelligenceRepository (data lives in Firestore under the user's uid)
 * - Signed out → LocalStorageExecutionIntelligenceRepository (data lives in localStorage)
 */
export function getExecutionIntelligenceRepository(): ExecutionIntelligenceRepository {
  const user = getCurrentUser();
  if (user) {
    return new FirestoreExecutionIntelligenceRepository(db, user.uid);
  }
  return new LocalStorageExecutionIntelligenceRepository();
}
