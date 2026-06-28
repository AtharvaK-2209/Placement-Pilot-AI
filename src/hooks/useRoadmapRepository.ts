/**
 * @file useRoadmapRepository.ts
 *
 * Returns the correct RoadmapRepository for the current auth state.
 *
 * - Signed in  → FirestoreRoadmapRepository (cloud, versioned)
 * - Signed out → LocalStorageRoadmapRepository (local, versioned)
 */

import { useMemo }                          from 'react';
import { useAuth }                          from '../contexts/AuthContext';
import { FirestoreRoadmapRepository }       from '../repositories/FirestoreRoadmapRepository';
import { LocalStorageRoadmapRepository }    from '../repositories/LocalStorageRoadmapRepository';
import type { RoadmapRepository }           from '../repositories/RoadmapRepository';
import { db }                               from '../config/firebase';

export function useRoadmapRepository(): RoadmapRepository {
  const { user } = useAuth();

  return useMemo<RoadmapRepository>(() => {
    if (user) {
      return new FirestoreRoadmapRepository(db, user.uid);
    }
    return new LocalStorageRoadmapRepository();
  }, [user]);
}
