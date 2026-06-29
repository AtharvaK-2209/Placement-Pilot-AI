/**
 * @file LocalStorageFutureYouRepository.ts
 *
 * LocalStorage implementation of FutureYouRepository.
 */

import type { FutureYouRepository } from './FutureYouRepository';
import type {
  FutureYouPrediction,
  FutureYouHistoryEntry,
} from '../ai/futureYou/futureYou.schema';

const LATEST_KEY = 'futureYou_latest';
const HISTORY_KEY = 'futureYou_history';

export class LocalStorageFutureYouRepository implements FutureYouRepository {
  async saveLatest(prediction: FutureYouPrediction): Promise<void> {
    try {
      localStorage.setItem(LATEST_KEY, JSON.stringify(prediction));
    } catch (error) {
      console.error('[LocalStorageFutureYouRepository] saveLatest failed:', error);
      throw error;
    }
  }

  async getLatest(): Promise<FutureYouPrediction | null> {
    try {
      const raw = localStorage.getItem(LATEST_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as FutureYouPrediction;
    } catch (error) {
      console.error('[LocalStorageFutureYouRepository] getLatest failed:', error);
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
      const history = await this.getHistory();
      
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

      // Add to beginning (newest first)
      history.unshift(entry);

      // Keep only last 30 entries
      const trimmed = history.slice(0, 30);

      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('[LocalStorageFutureYouRepository] appendHistory failed:', error);
      throw error;
    }
  }

  async getHistory(limit?: number): Promise<FutureYouHistoryEntry[]> {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      
      const history = JSON.parse(raw) as FutureYouHistoryEntry[];
      
      if (limit && limit > 0) {
        return history.slice(0, limit);
      }
      
      return history;
    } catch (error) {
      console.error('[LocalStorageFutureYouRepository] getHistory failed:', error);
      return [];
    }
  }

  async clearLatest(): Promise<void> {
    try {
      localStorage.removeItem(LATEST_KEY);
    } catch (error) {
      console.error('[LocalStorageFutureYouRepository] clearLatest failed:', error);
      throw error;
    }
  }
}
