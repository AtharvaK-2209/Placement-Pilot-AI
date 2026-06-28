/**
 * @file LocalStorageRoadmapRepository.ts
 *
 * localStorage implementation of RoadmapRepository.
 *
 * ─── STRICT RULE ──────────────────────────────────────────────────────────────
 * This is the ONLY file (alongside LocalStorageProgressRepository) allowed
 * to call localStorage directly.
 *
 * Storage layout:
 *   "pp_roadmap_versions"  → RoadmapVersion[]  (all versions, ordered by version #)
 *   "pp_roadmap_active"    → ActiveRoadmapPointer
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { RoadmapRepository }   from './RoadmapRepository';
import type {
  RoadmapVersion,
  ActiveRoadmapPointer,
  Roadmap,
} from '../types/domain';

const VERSIONS_KEY = 'pp_roadmap_versions' as const;
const POINTER_KEY  = 'pp_roadmap_active'   as const;

export class LocalStorageRoadmapRepository implements RoadmapRepository {

  private readVersions(): RoadmapVersion[] {
    try {
      const raw = localStorage.getItem(VERSIONS_KEY);
      return raw ? (JSON.parse(raw) as RoadmapVersion[]) : [];
    } catch {
      return [];
    }
  }

  private writeVersions(versions: RoadmapVersion[]): void {
    try {
      localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
    } catch (e) {
      console.error('[LocalStorageRoadmapRepository] writeVersions failed:', e);
    }
  }

  private readPointer(): ActiveRoadmapPointer | null {
    try {
      const raw = localStorage.getItem(POINTER_KEY);
      return raw ? (JSON.parse(raw) as ActiveRoadmapPointer) : null;
    } catch {
      return null;
    }
  }

  private writePointer(pointer: ActiveRoadmapPointer): void {
    try {
      localStorage.setItem(POINTER_KEY, JSON.stringify(pointer));
    } catch (e) {
      console.error('[LocalStorageRoadmapRepository] writePointer failed:', e);
    }
  }

  async saveRoadmapVersion(version: RoadmapVersion): Promise<void> {
    const versions = this.readVersions();
    // Idempotent — skip if this version number already exists
    if (versions.some((v) => v.version === version.version)) {
      console.warn(`[LocalStorageRoadmapRepository] Version ${version.version} already exists — skipping.`);
      return;
    }
    versions.push(version);
    versions.sort((a, b) => a.version - b.version);
    this.writeVersions(versions);
    // Auto-advance pointer to the new version
    this.writePointer({ activeVersion: version.version, updatedAt: new Date().toISOString() });
  }

  async getRoadmapVersion(version: number): Promise<RoadmapVersion | null> {
    const versions = this.readVersions();
    return versions.find((v) => v.version === version) ?? null;
  }

  async listRoadmapVersions(): Promise<RoadmapVersion[]> {
    return this.readVersions();
  }

  async getActiveRoadmap(): Promise<Roadmap | null> {
    const pointer  = this.readPointer();
    if (!pointer) return null;
    const versions = this.readVersions();
    const active   = versions.find((v) => v.version === pointer.activeVersion);
    return active?.roadmap ?? null;
  }

  async setActiveVersion(version: number): Promise<void> {
    this.writePointer({ activeVersion: version, updatedAt: new Date().toISOString() });
  }

  async getActivePointer(): Promise<ActiveRoadmapPointer | null> {
    return this.readPointer();
  }

  async restoreVersion(version: number): Promise<void> {
    return this.setActiveVersion(version);
  }
}
