/**
 * @file FirestoreFutureYouRepository.ts
 *
 * Firestore implementation of FutureYouRepository.
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
  limit as firestoreLimit,
  getDocs,
} from 'firebase/firestore';
import type { FutureYouRepository } from './FutureYouRepository';
import type {
  FutureYouPrediction,
  FutureYouHistoryEntry,
} from '../ai/futureYou/futureYou.schema';

export class FirestoreFutureYouRepository implements FutureYouRepository {
  private readonly db: Firestore;
  private readonly userId: string;

  constructor(db: Firestore, userId: string) {
    this.db = db;
    this.userId = userId;
  }

  private latestDocRef() {
    return doc(this.db, `users/${this.userId}/futureSimulation/latest`);
  }

  private historyCollectionRef() {
    return collection(this.db, `users/${this.userId}/futureSimulation/history`);
  }

  async saveLatest(prediction: FutureYouPrediction): Promise<void> {
    try {
      await setDoc(this.latestDocRef(), prediction);
    } catch (error) {
      console.error('[FirestoreFutureYouRepository] saveLatest failed:', error);
      throw error;
    }
  }

  async getLatest(): Promise<FutureYouPrediction | null> {
    try {
      const snapshot = await getDoc(this.latestDocRef());
      if (!snapshot.exists()) return null;
      return snapshot.data() as FutureYouPrediction;
    } catch (error) {
      console.error('[FirestoreFutureYouRepository] getLatest failed:', error);
      return null;
    }
  }

  async appendHistory(
    prediction: FutureYouPrediction,
    context: {
      roadmapVersion: number;
      currentWeek: number;
      overallCompletion: number;
      currentStreak: number;
      goalHealthScore: number;
      burnoutRisk: string;
    }
  ): Promise<void> {
    try {
      const entry: FutureYouHistoryEntry = {
        careerNarrative: prediction.careerNarrative,
        predictedSkills: prediction.predictedSkills,
        biggestStrengths: prediction.biggestStrengths,
        biggestWeaknesses: prediction.biggestWeaknesses,
        internshipReadiness: prediction.internshipReadiness,
        estimatedInterviewConfidence: prediction.estimatedInterviewConfidence,
        estimatedOffers: prediction.estimatedOffers,
        personalizedRecommendations: prediction.personalizedRecommendations,
        confidence: prediction.confidence,
        predictedAt: prediction.predictedAt,
        targetDays: prediction.targetDays,
        roadmapVersion: context.roadmapVersion,
        currentWeek: context.currentWeek,
        overallCompletion: context.overallCompletion,
        currentStreak: context.currentStreak,
        goalHealthScore: context.goalHealthScore,
        burnoutRisk: context.burnoutRisk,
      };

      // Use timestamp as document ID
      const historyDocRef = doc(this.historyCollectionRef(), prediction.predictedAt);
      await setDoc(historyDocRef, entry);
    } catch (error) {
      console.error('[FirestoreFutureYouRepository] appendHistory failed:', error);
      throw error;
    }
  }

  async getHistory(limit?: number): Promise<FutureYouHistoryEntry[]> {
    try {
      const historyQuery = query(
        this.historyCollectionRef(),
        orderBy('predictedAt', 'desc'),
        firestoreLimit(limit ?? 30)
      );

      const snapshot = await getDocs(historyQuery);
      return snapshot.docs.map(doc => doc.data() as FutureYouHistoryEntry);
    } catch (error) {
      console.error('[FirestoreFutureYouRepository] getHistory failed:', error);
      return [];
    }
  }

  async clearLatest(): Promise<void> {
    try {
      await deleteDoc(this.latestDocRef());
    } catch (error) {
      console.error('[FirestoreFutureYouRepository] clearLatest failed:', error);
      throw error;
    }
  }
}
