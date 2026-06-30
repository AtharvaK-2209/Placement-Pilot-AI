/**
 * @file AuthContext.tsx
 *
 * React context that exposes the current Firebase Auth user to the component tree.
 * Wrap the app with <AuthProvider> once in App.tsx.
 * Consume with the useAuth() hook anywhere below it.
 *
 * On successful authentication, emits 'first-login' milestone event.
 */

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthChanged } from '../services/authService';
import { executionPipelineEvents } from '../services/executionPipelineEvents';

// ─── Context shape ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** The currently signed-in Firebase user, or null if not authenticated. */
  user:        FirebaseUser | null;
  /** True while the initial auth state is being resolved from Firebase. */
  authLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user:        null,
  authLoading: true,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,        setUser]        = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const previousUserRef = useRef<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChanged((firebaseUser) => {
      const wasNull = previousUserRef.current === null;
      const isNowAuth = firebaseUser !== null;

      // Detect successful login: transition from unauthenticated → authenticated
      if (wasNull && isNowAuth) {
        console.log('[AuthContext] ✓ User authenticated, emitting first-login event');
        executionPipelineEvents.emit({
          type: 'first_login',
          timestamp: new Date().toISOString(),
          data: { userId: firebaseUser.uid, email: firebaseUser.email },
        }).catch((err) => console.error('[AuthContext] Error emitting first-login event:', err));
      }

      previousUserRef.current = firebaseUser;
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return unsubscribe; // clean up listener on unmount
  }, []);

  return (
    <AuthContext.Provider value={{ user, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns the current auth state.
 * Must be called inside a component that is a descendant of <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
