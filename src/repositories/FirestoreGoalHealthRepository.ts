import {
  doc, getDoc, setDoc,
  collection, getDocs, query, orderBy,
  type Firestore,
} from 'firebase/firestore';
import type { GoalHealthRepository }     from './GoalHealthRepository';
import type {
  GoalHealthScore,
  GoalHealthHistoryEntry,
} from '../ai/goalHealth/goalHealth.schema';
import {
  goalHealthDoc,
  goalHealthHistoryCollection,
  goalHealthHistoryDoc,
} from '../config/firestorePaths';

export class FirestoreGoalHealthRepository implements GoalHealthRepository {
  private readonly db: Firestore;
  private readonly uid: string;

  constructor(db: Firestore, uid: string) { this.db = db; this.uid = uid; }

  async saveHealth(score: GoalHealthScore): Promise<void> {
    try { await setDoc(doc(this.db, goalHealthDoc(this.uid)), score); }
    catch (e) { console.error('[FirestoreGoalHealthRepository] saveHealth:', e); }
  }

  async saveHistory(entry: GoalHealthHistoryEntry): Promise<void> {
    try {
      const ref = doc(this.db, goalHealthHistoryDoc(this.uid, entry.evaluatedAt));
      // Write-once — never overwrite
      const existing = await getDoc(ref);
      if (!existing.exists()) await setDoc(ref, entry);
    } catch (e) { console.error('[FirestoreGoalHealthRepository] saveHistory:', e); }
  }

  async getHealth(): Promise<GoalHealthScore | null> {
    try {
      const snap = await getDoc(doc(this.db, goalHealthDoc(this.uid)));
      return snap.exists() ? snap.data() as GoalHealthScore : null;
    } catch (e) {
      console.error('[FirestoreGoalHealthRepository] getHealth:', e);
      return null;
    }
  }

  async getHistory(): Promise<GoalHealthHistoryEntry[]> {
    try {
      const col  = collection(this.db, goalHealthHistoryCollection(this.uid));
      const snap = await getDocs(query(col, orderBy('evaluatedAt', 'asc')));
      return snap.docs.map((d) => d.data() as GoalHealthHistoryEntry);
    } catch (e) {
      console.error('[FirestoreGoalHealthRepository] getHistory:', e);
      return [];
    }
  }
}
