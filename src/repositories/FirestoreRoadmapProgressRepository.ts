import { doc, getDoc, setDoc, deleteDoc, type Firestore } from 'firebase/firestore';
import type { RoadmapProgressRepository }  from './RoadmapProgressRepository';
import type { RoadmapProgress }             from '../types/roadmapProgress';
import { roadmapProgressDoc }               from '../config/firestorePaths';

export class FirestoreRoadmapProgressRepository implements RoadmapProgressRepository {
  private readonly db: Firestore;
  private readonly uid: string;
  constructor(db: Firestore, uid: string) { this.db = db; this.uid = uid; }

  async getProgress(): Promise<RoadmapProgress | null> {
    try {
      const snap = await getDoc(doc(this.db, roadmapProgressDoc(this.uid)));
      return snap.exists() ? snap.data() as RoadmapProgress : null;
    } catch (e) { console.error('[FirestoreRoadmapProgressRepository] get:', e); return null; }
  }
  async saveProgress(p: RoadmapProgress): Promise<void> {
    try { await setDoc(doc(this.db, roadmapProgressDoc(this.uid)), p); }
    catch (e) { console.error('[FirestoreRoadmapProgressRepository] save:', e); }
  }
  async resetProgress(): Promise<void> {
    try { await deleteDoc(doc(this.db, roadmapProgressDoc(this.uid))); }
    catch (e) { console.error('[FirestoreRoadmapProgressRepository] reset:', e); }
  }
}
