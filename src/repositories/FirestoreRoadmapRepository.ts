/**
 * @file FirestoreRoadmapRepository.ts
 *
 * Firestore implementation of RoadmapRepository.
 * Drop-in replacement for LocalStorageRoadmapRepository.
 *
 * Storage layout:
 *   users/{uid}/roadmaps/v1   → RoadmapVersion  (immutable, never overwritten)
 *   users/{uid}/roadmaps/v2   → RoadmapVersion
 *   ...
 *   users/{uid}/roadmaps/current  → ActiveRoadmapPointer
 *
 * "current" is a stable pointer document — updated atomically when the
 * active version changes. Version documents are write-once.
 */

import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  type Firestore,
} from 'firebase/firestore';
import type { RoadmapRepository }   from './RoadmapRepository';
import type {
  RoadmapVersion,
  ActiveRoadmapPointer,
  Roadmap,
} from '../types/domain';
import {
  roadmapVersionDoc,
  roadmapVersionsCollection,
  activeRoadmapPointerDoc,
} from '../config/firestorePaths';

export class FirestoreRoadmapRepository implements RoadmapRepository {
  private readonly db: Firestore;
  private readonly uid: string;

  constructor(db: Firestore, uid: string) {
    this.db  = db;
    this.uid = uid;
  }

  async saveRoadmapVersion(version: RoadmapVersion): Promise<void> {
    try {
      const ref = doc(this.db, roadmapVersionDoc(this.uid, version.version));
      // Check idempotency — never overwrite
      const existing = await getDoc(ref);
      if (existing.exists()) {
        console.warn(`[FirestoreRoadmapRepository] Version ${version.version} already exists — skipping.`);
        return;
      }
      await setDoc(ref, version);
      // Advance pointer to new version
      await this.setActiveVersion(version.version);
    } catch (e) {
      console.error('[FirestoreRoadmapRepository] saveRoadmapVersion failed:', e);
    }
  }

  async getRoadmapVersion(version: number): Promise<RoadmapVersion | null> {
    try {
      const snap = await getDoc(doc(this.db, roadmapVersionDoc(this.uid, version)));
      return snap.exists() ? (snap.data() as RoadmapVersion) : null;
    } catch (e) {
      console.error('[FirestoreRoadmapRepository] getRoadmapVersion failed:', e);
      return null;
    }
  }

  async listRoadmapVersions(): Promise<RoadmapVersion[]> {
    try {
      // Exclude the "current" pointer document — it's not a version
      const col  = collection(this.db, roadmapVersionsCollection(this.uid));
      const snap = await getDocs(query(col, orderBy('version', 'asc')));
      return snap.docs
        .filter((d) => d.id !== 'current')
        .map((d) => d.data() as RoadmapVersion);
    } catch (e) {
      console.error('[FirestoreRoadmapRepository] listRoadmapVersions failed:', e);
      return [];
    }
  }

  async getActiveRoadmap(): Promise<Roadmap | null> {
    try {
      const pointer = await this.getActivePointer();
      if (!pointer) return null;
      const version = await this.getRoadmapVersion(pointer.activeVersion);
      return version?.roadmap ?? null;
    } catch (e) {
      console.error('[FirestoreRoadmapRepository] getActiveRoadmap failed:', e);
      return null;
    }
  }

  async setActiveVersion(version: number): Promise<void> {
    try {
      const pointer: ActiveRoadmapPointer = {
        activeVersion: version,
        updatedAt:     new Date().toISOString(),
      };
      await setDoc(doc(this.db, activeRoadmapPointerDoc(this.uid)), pointer);
    } catch (e) {
      console.error('[FirestoreRoadmapRepository] setActiveVersion failed:', e);
    }
  }

  async getActivePointer(): Promise<ActiveRoadmapPointer | null> {
    try {
      const snap = await getDoc(doc(this.db, activeRoadmapPointerDoc(this.uid)));
      return snap.exists() ? (snap.data() as ActiveRoadmapPointer) : null;
    } catch (e) {
      console.error('[FirestoreRoadmapRepository] getActivePointer failed:', e);
      return null;
    }
  }

  async restoreVersion(version: number): Promise<void> {
    return this.setActiveVersion(version);
  }
}
