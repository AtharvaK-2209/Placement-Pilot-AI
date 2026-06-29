import type { MissionRepository } from './MissionRepository';
import type { DailyMission }      from '../ai/dailyMission/dailyMission.schema';

const PREFIX = 'pp_mission_' as const;

function key(w: number, d: number) { return `${PREFIX}w${w}-d${d}`; }

export class LocalStorageMissionRepository implements MissionRepository {
  async saveMission(w: number, d: number, mission: DailyMission): Promise<void> {
    const storageKey = key(w, d);
    try { 
      const data = JSON.stringify(mission);
      localStorage.setItem(storageKey, data);
      console.log(`[LocalStorageMissionRepository] ✓ Saved mission to key: ${storageKey}, title: "${mission.title}"`);
    }
    catch (e) { 
      console.error(`[LocalStorageMissionRepository] ✗ Save failed for key ${storageKey}:`, e);
    }
  }

  async getMission(w: number, d: number): Promise<DailyMission | null> {
    const storageKey = key(w, d);
    try {
      const raw = localStorage.getItem(storageKey);
      
      // Debug: List all localStorage keys that match our pattern
      const allKeys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX));
      console.log(`[LocalStorageMissionRepository] All mission keys in storage:`, allKeys);
      
      if (raw) {
        const mission = JSON.parse(raw) as DailyMission;
        console.log(`[LocalStorageMissionRepository] ✓ Found mission at key: ${storageKey}, title: "${mission.title}"`);
        return mission;
      } else {
        console.log(`[LocalStorageMissionRepository] ✗ No mission found at key: ${storageKey}`);
        return null;
      }
    } catch (e) {
      console.error(`[LocalStorageMissionRepository] ✗ Load failed for key ${storageKey}:`, e);
      return null;
    }
  }

  async hasMission(w: number, d: number): Promise<boolean> {
    const storageKey = key(w, d);
    const exists = localStorage.getItem(storageKey) !== null;
    console.log(`[LocalStorageMissionRepository] Mission exists check for ${storageKey}: ${exists}`);
    return exists;
  }
}
