/**
 * @file AuthContext.tsx
 *
 * React context that exposes the current Firebase Auth user to the component tree.
 * Wrap the app with <AuthProvider> once in App.tsx.
 * Consume with the useAuth() hook anywhere below it.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthChanged } from '../services/authService';

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

  useEffect(() => {
    const unsubscribe = onAuthChanged((firebaseUser) => {
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
