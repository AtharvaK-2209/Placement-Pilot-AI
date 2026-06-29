import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';
import type { MissionRepository }              from './MissionRepository';
import type { DailyMission }                   from '../ai/dailyMission/dailyMission.schema';
import { dailyMissionDoc }                     from '../config/firestorePaths';

export class FirestoreMissionRepository implements MissionRepository {
  private readonly db: Firestore;
  private readonly uid: string;
  constructor(db: Firestore, uid: string) { this.db = db; this.uid = uid; }

  async saveMission(w: number, d: number, mission: DailyMission): Promise<void> {
    const docPath = dailyMissionDoc(this.uid, w, d);
    try { 
      await setDoc(doc(this.db, docPath), mission);
      console.log(`[FirestoreMissionRepository] ✓ Saved mission to Firestore: ${docPath}, title: "${mission.title}"`);
    }
    catch (e) { 
      console.error(`[FirestoreMissionRepository] ✗ Save failed for ${docPath}:`, e);
    }
  }

  async getMission(w: number, d: number): Promise<DailyMission | null> {
    const docPath = dailyMissionDoc(this.uid, w, d);
    try {
      const snap = await getDoc(doc(this.db, docPath));
      if (snap.exists()) {
        const mission = snap.data() as DailyMission;
        console.log(`[FirestoreMissionRepository] ✓ Found mission in Firestore: ${docPath}, title: "${mission.title}"`);
        return mission;
      } else {
        console.log(`[FirestoreMissionRepository] ✗ No mission found in Firestore: ${docPath}`);
        return null;
      }
    } catch (e) {
      console.error(`[FirestoreMissionRepository] ✗ Get failed for ${docPath}:`, e);
      return null;
    }
  }

  async hasMission(w: number, d: number): Promise<boolean> {
    try {
      const snap = await getDoc(doc(this.db, dailyMissionDoc(this.uid, w, d)));
      return snap.exists();
    } catch { return false; }
  }
}
