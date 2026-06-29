import type { RoadmapProgressRepository } from './RoadmapProgressRepository';
import type { RoadmapProgress }            from '../types/roadmapProgress';

const KEY = 'pp_roadmap_progress' as const;

export class LocalStorageRoadmapProgressRepository implements RoadmapProgressRepository {
  async getProgress(): Promise<RoadmapProgress | null> {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) as RoadmapProgress : null;
    } catch { return null; }
  }
  async saveProgress(p: RoadmapProgress): Promise<void> {
    try { localStorage.setItem(KEY, JSON.stringify(p)); }
    catch (e) { console.error('[LocalStorageRoadmapProgressRepository] save:', e); }
  }
  async resetProgress(): Promise<void> {
    try { localStorage.removeItem(KEY); }
    catch (e) { console.error('[LocalStorageRoadmapProgressRepository] reset:', e); }
  }
}
