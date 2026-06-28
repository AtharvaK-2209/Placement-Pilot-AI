/**
 * @file repositories/index.ts
 *
 * ─── THE SINGLE SWAP POINT ────────────────────────────────────────────────────
 * This is the ONLY file that decides which storage backend is active.
 *
 * To migrate from localStorage to Firestore, change ONE line:
 *
 *   CURRENT (Phase 5):
 *     export const progressRepository = new LocalStorageProgressRepository();
 *
 *   FUTURE (Phase 6):
 *     export const progressRepository = new FirestoreProgressRepository();
 *
 * All services, agents, and components import `progressRepository` from here.
 * They never instantiate a repository directly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type { ProgressRepository } from './ProgressRepository';
export { LocalStorageProgressRepository } from './LocalStorageProgressRepository';
export { FirestoreProgressRepository }    from './FirestoreProgressRepository';

import { LocalStorageProgressRepository } from './LocalStorageProgressRepository';

/**
 * The active repository instance used by all services.
 *
 * ↓ Change this one line to switch storage backends.
 */
export const progressRepository = new LocalStorageProgressRepository();
