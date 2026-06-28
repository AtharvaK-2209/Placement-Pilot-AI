/**
 * @file roadmapService.ts
 *
 * Business logic for roadmap versioning.
 * Depends ONLY on RoadmapRepository — zero storage knowledge.
 *
 * Used by:
 *   • AnalysisPage      — saves V1 after roadmap is generated
 *   • RoadmapPage       — saves V2+ after Dynamic Replanning
 *   • Future agents     — Deadline Rescue, Rollback UI
 */

import type { RoadmapRepository }       from '../repositories/RoadmapRepository';
import type {
  Roadmap,
  RoadmapVersion,
  RoadmapVersionTrigger,
} from '../types/domain';

export class RoadmapService {
  private readonly repo: RoadmapRepository;
  constructor(repo: RoadmapRepository) { this.repo = repo; }

  /**
   * Saves a roadmap as a new immutable version and advances the active pointer.
   *
   * Call this whenever a new roadmap is created or replanned:
   *   - V1: after initial Roadmap Agent generation
   *   - V2+: after each Dynamic Replanning
   *
   * @param roadmap  The full Roadmap object to version.
   * @param trigger  What caused this version.
   * @param reason   Human-readable reason (empty string for V1).
   * @param summary  Short description of changes vs previous version.
   */
  async saveVersion(
    roadmap:  Roadmap,
    trigger:  RoadmapVersionTrigger,
    reason:   string,
    summary:  string,
  ): Promise<RoadmapVersion> {
    const existing = await this.repo.listRoadmapVersions();
    const nextVersion = existing.length > 0
      ? Math.max(...existing.map((v) => v.version)) + 1
      : 1;

    const version: RoadmapVersion = {
      version:   nextVersion,
      roadmap,
      trigger,
      reason,
      summary,
      createdAt: new Date().toISOString(),
    };

    await this.repo.saveRoadmapVersion(version);
    console.log(`[RoadmapService] ✓ Saved roadmap version ${nextVersion} (trigger: ${trigger})`);
    return version;
  }

  /** Returns the active roadmap, or null if none saved. */
  async getActiveRoadmap(): Promise<Roadmap | null> {
    return this.repo.getActiveRoadmap();
  }

  /** Returns all versions in ascending order. */
  async listVersions(): Promise<RoadmapVersion[]> {
    return this.repo.listRoadmapVersions();
  }

  /** Returns the active version number, or null. */
  async getActiveVersionNumber(): Promise<number | null> {
    const pointer = await this.repo.getActivePointer();
    return pointer?.activeVersion ?? null;
  }

  /**
   * Restores a previous version as active.
   * The version document is not modified — only the pointer moves.
   */
  async restoreVersion(version: number): Promise<void> {
    await this.repo.restoreVersion(version);
    console.log(`[RoadmapService] ✓ Restored to version ${version}`);
  }
}
