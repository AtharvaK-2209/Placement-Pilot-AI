import { useMemo }                            from 'react';
import { useAuth }                             from '../contexts/AuthContext';
import { FirestoreMissionRepository }          from '../repositories/FirestoreMissionRepository';
import { LocalStorageMissionRepository }       from '../repositories/LocalStorageMissionRepository';
import type { MissionRepository }              from '../repositories/MissionRepository';
import { db }                                  from '../config/firebase';

export function useMissionRepository(): MissionRepository {
  const { user } = useAuth();
  return useMemo<MissionRepository>(() => {
    const repo = user 
      ? new FirestoreMissionRepository(db, user.uid)
      : new LocalStorageMissionRepository();
    
    console.log(`[useMissionRepository] Creating repository:`, user ? 'Firestore' : 'LocalStorage', user ? `(uid: ${user.uid})` : '');
    return repo;
  }, [user]);
}
