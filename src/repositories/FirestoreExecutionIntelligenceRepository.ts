import {
  doc, getDoc, setDoc,
  collection, getDocs, query, orderBy,
  type Firestore,
} from 'firebase/firestore';
import type { ExecutionIntelligenceRepository } from './ExecutionIntelligenceRepository';
import type {
  ExecutionIntelligenceScore,
  ExecutionIntelligenceHistoryEntry,
} from '../ai/executionIntelligence/executionIntelligence.schema';
import {
  executionIntelligenceDoc,
  executionIntelligenceHistoryCollection,
  executionIntelligenceHistoryDoc,
} from '../config/firestorePaths';

export class FirestoreExecutionIntelligenceRepository implements ExecutionIntelligenceRepository {
  private readonly db: Firestore;
  private readonly uid: string;

  constructor(db: Firestore, uid: string) { this.db = db; this.uid = uid; }

  async saveIntelligence(analysis: ExecutionIntelligenceScore): Promise<void> {
    try { await setDoc(doc(this.db, executionIntelligenceDoc(this.uid)), analysis); }
    catch (e) { console.error('[FirestoreExecutionIntelligenceRepository] saveIntelligence:', e); }
  }

  async saveHistory(entry: ExecutionIntelligenceHistoryEntry): Promise<void> {
    try {
      const ref = doc(this.db, executionIntelligenceHistoryDoc(this.uid, entry.evaluatedAt));
      // Write-once — never overwrite
      const existing = await getDoc(ref);
      if (!existing.exists()) await setDoc(ref, entry);
    } catch (e) { console.error('[FirestoreExecutionIntelligenceRepository] saveHistory:', e); }
  }

  async getIntelligence(): Promise<ExecutionIntelligenceScore | null> {
    try {
      const snap = await getDoc(doc(this.db, executionIntelligenceDoc(this.uid)));
      return snap.exists() ? snap.data() as ExecutionIntelligenceScore : null;
    } catch (e) {
      console.error('[FirestoreExecutionIntelligenceRepository] getIntelligence:', e);
      return null;
    }
  }

  async getHistory(): Promise<ExecutionIntelligenceHistoryEntry[]> {
    try {
      const col  = collection(this.db, executionIntelligenceHistoryCollection(this.uid));
      const snap = await getDocs(query(col, orderBy('evaluatedAt', 'asc')));
      return snap.docs.map((d) => d.data() as ExecutionIntelligenceHistoryEntry);
    } catch (e) {
      console.error('[FirestoreExecutionIntelligenceRepository] getHistory:', e);
      return [];
    }
  }
}
