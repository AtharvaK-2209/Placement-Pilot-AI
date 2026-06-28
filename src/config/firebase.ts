/**
 * @file firebase.ts
 *
 * Firebase SDK initialisation — App, Firestore, Auth.
 * This is the ONLY file in the project that initialises Firebase.
 *
 * Offline persistence is enabled so Firestore reads/writes work
 * while the user is disconnected (mobile, poor connectivity).
 */

import { initializeApp, type FirebaseApp }                from 'firebase/app';
import { getFirestore, type Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, type Auth }                             from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            as string,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        as string,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         as string,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             as string,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     as string,
};

const app: FirebaseApp = initializeApp(firebaseConfig);
const db: Firestore    = getFirestore(app);
const auth: Auth       = getAuth(app);

// Enable offline persistence (IndexedDB cache).
// Silently ignored if already enabled (e.g. hot-reload) or in SSR.
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open — persistence only works in one tab at a time.
    console.warn('[Firebase] Offline persistence unavailable: multiple tabs open.');
  } else if (err.code === 'unimplemented') {
    // Browser does not support IndexedDB.
    console.warn('[Firebase] Offline persistence not supported in this browser.');
  }
});

export { app, db, auth };
