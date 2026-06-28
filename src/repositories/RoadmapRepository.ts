/**
 * @file RoadmapRepository.ts
 *
 * Abstract interface for immutable roadmap version storage.
 *
 * ─── ARCHITECTURE RULE ────────────────────────────────────────────────────────
 * Every roadmap write MUST go through this interface.
 * UI pages and AI agents must NEVER call Firestore directly.
 *
 * Implementations:
 *   LocalStorageRoadmapRepository  — src/repositories/LocalStorageRoadmapRepository.ts
 *   FirestoreRoadmapRepository     — src/repositories/FirestoreRoadmapRepository.ts
 *
 * The instantiation site (src/repositories/index.ts) is the ONLY place
 * that decides which backend is active.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { RoadmapVersion, ActiveRoadmapPointer, Roadmap } from '../types/domain';

export interface RoadmapRepository {

  /**
   * Saves a new immutable roadmap version.
   * Version numbers are 1-indexed and must be unique.
   * Existing versions are NEVER overwritten.
   */
  saveRoadmapVersion(version: RoadmapVersion): Promise<void>;

  /**
   * Returns the version document for a specific version number,
   * or null if that version does not exist.
   */
  getRoadmapVersion(version: number): Promise<RoadmapVersion | null>;

  /**
   * Returns all saved roadmap versions in ascending version order.
   * Returns an empty array if no versions have been saved.
   */
  listRoadmapVersions(): Promise<RoadmapVersion[]>;

  /**
   * Returns the full Roadmap object from the currently active version,
   * or null if no roadmap has been saved yet.
   */
  getActiveRoadmap(): Promise<Roadmap | null>;

  /**
   * Updates the active version pointer to the given version number.
   * Does NOT create a new version — only moves the pointer.
   */
  setActiveVersion(version: number): Promise<void>;

  /**
   * Returns the active version pointer, or null if not initialised.
   */
  getActivePointer(): Promise<ActiveRoadmapPointer | null>;

  /**
   * Restores a previous version by setting it as active.
   * The version document itself is never modified.
   * Future roadmap generations will still create new version numbers.
   */
  restoreVersion(version: number): Promise<void>;
}
