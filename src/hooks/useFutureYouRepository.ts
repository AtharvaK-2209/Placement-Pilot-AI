import { useMemo }                            from 'react';
import { useAuth }                             from '../contexts/AuthContext';
import { FirestoreFutureYouRepository }        from '../repositories/FirestoreFutureYouRepository';
import { LocalStorageFutureYouRepository }     from '../repositories/LocalStorageFutureYouRepository';
import type { FutureYouRepository }            from '../repositories/FutureYouRepository';
import { db }                                  from '../config/firebase';

export function useFutureYouRepository(): FutureYouRepository {
  const { user } = useAuth();
  return useMemo<FutureYouRepository>(() => {
    const repo = user 
      ? new FirestoreFutureYouRepository(db, user.uid)
      : new LocalStorageFutureYouRepository();
    
    console.log(`[useFutureYouRepository] Creating repository:`, user ? 'Firestore' : 'LocalStorage', user ? `(uid: ${user.uid})` : '');
    return repo;
  }, [user]);
}
