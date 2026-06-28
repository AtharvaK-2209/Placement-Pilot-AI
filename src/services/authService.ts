/**
 * @file authService.ts
 *
 * Authentication service — the ONLY file that calls Firebase Auth directly.
 * UI components call these functions; they never import firebase/auth.
 *
 * Supported methods:
 *   • Google Sign-In (popup)
 *   • Email / Password Sign-In
 *   • Email / Password Registration
 *   • Sign Out
 *   • Current user observable (onAuthStateChanged)
 */

import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../config/firebase';

const googleProvider = new GoogleAuthProvider();

// ─── Public API ───────────────────────────────────────────────────────────────

/** Sign in with Google popup. Returns the Firebase user on success. */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/** Sign in with email and password. Returns the Firebase user on success. */
export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/** Register a new account with email and password. */
export async function registerWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

/** Sign out the current user. */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/** Returns the currently authenticated Firebase user, or null. */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Subscribes to auth state changes.
 * Returns an unsubscribe function — call it on component unmount.
 */
export function onAuthChanged(
  callback: (user: FirebaseUser | null) => void,
): () => void {
  return onAuthStateChanged(auth, callback);
}
