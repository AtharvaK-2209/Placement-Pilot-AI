/**
 * @file useRepository.ts
 *
 * React hook that returns the correct ProgressRepository for the
 * currently authenticated user.
 *
 * - Signed in  → FirestoreProgressRepository (cloud)
 * - Signed out → LocalStorageProgressRepository (local)
 *
 * Components and hooks that need a repository import this.
 * They never import Firebase or repository classes directly.
 */

import { useMemo }                         from 'react';
import { useAuth }                         from '../contexts/AuthContext';
import { FirestoreProgressRepository }     from '../repositories/FirestoreProgressRepository';
import { LocalStorageProgressRepository } from '../repositories/LocalStorageProgressRepository';
import type { ProgressRepository }         from '../repositories/ProgressRepository';
import { db }                              from '../config/firebase';

export function useRepository(): ProgressRepository {
  const { user } = useAuth();

  return useMemo<ProgressRepository>(() => {
    if (user) {
      return new FirestoreProgressRepository(db, user.uid);
    }
    return new LocalStorageProgressRepository();
  }, [user]);
}
