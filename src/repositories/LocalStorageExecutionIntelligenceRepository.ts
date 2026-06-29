import type { ExecutionIntelligenceRepository } from './ExecutionIntelligenceRepository';
import type {
  ExecutionIntelligenceScore,
  ExecutionIntelligenceHistoryEntry,
} from '../ai/executionIntelligence/executionIntelligence.schema';

const LATEST_KEY  = 'pp_execution_intelligence'         as const;
const HISTORY_KEY = 'pp_execution_intelligence_history' as const;

export class LocalStorageExecutionIntelligenceRepository implements ExecutionIntelligenceRepository {

  async saveIntelligence(analysis: ExecutionIntelligenceScore): Promise<void> {
    try { localStorage.setItem(LATEST_KEY, JSON.stringify(analysis)); }
    catch (e) { console.error('[LocalStorageExecutionIntelligenceRepository] saveIntelligence:', e); }
  }

  async saveHistory(entry: ExecutionIntelligenceHistoryEntry): Promise<void> {
    try {
      const existing = await this.getHistory();
      // Idempotent — skip if entry with same evaluatedAt already exists
      if (existing.some((e) => e.evaluatedAt === entry.evaluatedAt)) return;
      existing.push(entry);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(existing));
    } catch (e) { console.error('[LocalStorageExecutionIntelligenceRepository] saveHistory:', e); }
  }

  async getIntelligence(): Promise<ExecutionIntelligenceScore | null> {
    try {
      const raw = localStorage.getItem(LATEST_KEY);
      return raw ? JSON.parse(raw) as ExecutionIntelligenceScore : null;
    } catch { return null; }
  }

  async getHistory(): Promise<ExecutionIntelligenceHistoryEntry[]> {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const all: ExecutionIntelligenceHistoryEntry[] = raw ? JSON.parse(raw) : [];
      return all.sort((a, b) => a.evaluatedAt.localeCompare(b.evaluatedAt));
    } catch { return []; }
  }
}
