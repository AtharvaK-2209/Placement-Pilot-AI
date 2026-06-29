import type { GoalHealthRepository }     from './GoalHealthRepository';
import type {
  GoalHealthScore,
  GoalHealthHistoryEntry,
} from '../ai/goalHealth/goalHealth.schema';

const LATEST_KEY  = 'pp_goal_health'         as const;
const HISTORY_KEY = 'pp_goal_health_history' as const;

export class LocalStorageGoalHealthRepository implements GoalHealthRepository {

  async saveHealth(score: GoalHealthScore): Promise<void> {
    try { localStorage.setItem(LATEST_KEY, JSON.stringify(score)); }
    catch (e) { console.error('[LocalStorageGoalHealthRepository] saveHealth:', e); }
  }

  async saveHistory(entry: GoalHealthHistoryEntry): Promise<void> {
    try {
      const existing = await this.getHistory();
      // Idempotent — skip if entry with same evaluatedAt already exists
      if (existing.some((e) => e.evaluatedAt === entry.evaluatedAt)) return;
      existing.push(entry);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(existing));
    } catch (e) { console.error('[LocalStorageGoalHealthRepository] saveHistory:', e); }
  }

  async getHealth(): Promise<GoalHealthScore | null> {
    try {
      const raw = localStorage.getItem(LATEST_KEY);
      return raw ? JSON.parse(raw) as GoalHealthScore : null;
    } catch { return null; }
  }

  async getHistory(): Promise<GoalHealthHistoryEntry[]> {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const all: GoalHealthHistoryEntry[] = raw ? JSON.parse(raw) : [];
      return all.sort((a, b) => a.evaluatedAt.localeCompare(b.evaluatedAt));
    } catch { return []; }
  }
}
