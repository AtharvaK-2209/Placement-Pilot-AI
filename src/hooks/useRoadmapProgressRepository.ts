import { useMemo }                                    from 'react';
import { useAuth }                                    from '../contexts/AuthContext';
import { FirestoreRoadmapProgressRepository }         from '../repositories/FirestoreRoadmapProgressRepository';
import { LocalStorageRoadmapProgressRepository }      from '../repositories/LocalStorageRoadmapProgressRepository';
import type { RoadmapProgressRepository }             from '../repositories/RoadmapProgressRepository';
import { db }                                         from '../config/firebase';

export function useRoadmapProgressRepository(): RoadmapProgressRepository {
  const { user } = useAuth();
  return useMemo<RoadmapProgressRepository>(() => {
    if (user) return new FirestoreRoadmapProgressRepository(db, user.uid);
    return new LocalStorageRoadmapProgressRepository();
  }, [user]);
}
