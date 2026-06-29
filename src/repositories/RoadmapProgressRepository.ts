import type { RoadmapProgress } from '../types/roadmapProgress';

export interface RoadmapProgressRepository {
  /** Returns current roadmap progress, or null if not initialised. */
  getProgress(): Promise<RoadmapProgress | null>;
  /** Overwrites the stored progress. */
  saveProgress(progress: RoadmapProgress): Promise<void>;
  /** Clears progress (on new roadmap generation). */
  resetProgress(): Promise<void>;
}
