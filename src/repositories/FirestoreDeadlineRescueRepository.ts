/**
 * @file FirestoreDeadlineRescueRepository.ts
 *
 * Firestore implementation of DeadlineRescueRepository.
 *
 * Storage structure:
 *   users/{uid}/deadlineRescue/
 *     latest          — current active rescue strategy (single document)
 *     history/{id}    — immutable history of all rescue activations
 */

import type { Firestore } from 'firebase/firestore';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import type { DeadlineRescueRepository } from './DeadlineRescueRepository';
import type {
  RescueStrategy,
  RescueHistoryEntry,
} from '../ai/deadlineRescue/deadlineRescue.schema';

export class FirestoreDeadlineRescueRepository implements DeadlineRescueRepository {
  private readonly db: Firestore;
  private readonly uid: string;

  constructor(db: Firestore, uid: string) {
    this.db = db;
    this.uid = uid;
  }

  // ─── Latest Strategy ─────────────────────────────────────────────────────────

  async getRescueStrategy(): Promise<RescueStrategy | null> {
    const ref = doc(this.db, `users/${this.uid}/deadlineRescue/latest`);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as RescueStrategy) : null;
  }

  async saveRescueStrategy(strategy: RescueStrategy): Promise<void> {
    const ref = doc(this.db, `users/${this.uid}/deadlineRescue/latest`);
    await setDoc(ref, strategy);
  }

  async clearRescueStrategy(): Promise<void> {
    const ref = doc(this.db, `users/${this.uid}/deadlineRescue/latest`);
    await deleteDoc(ref);
  }

  // ─── History ─────────────────────────────────────────────────────────────────

  async getHistory(): Promise<RescueHistoryEntry[]> {
    const colRef = collection(this.db, `users/${this.uid}/deadlineRescue/history`);
    const q = query(colRef, orderBy('activatedAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as RescueHistoryEntry);
  }

  async saveHistory(entry: RescueHistoryEntry): Promise<void> {
    const id = entry.activatedAt; // Use timestamp as document ID
    const ref = doc(this.db, `users/${this.uid}/deadlineRescue/history`, id);
    await setDoc(ref, entry);
  }
}
