/**
 * @file futureYou.schema.ts
 *
 * Schema for the Future You Agent.
 *
 * ── AGENT RESPONSIBILITY ─────────────────────────────────────────────
 *   ✓ Predicts user's future career state based on current execution
 *   ✓ Generates personalized career narrative
 *   ✓ Estimates skill development and interview readiness
 *   ✓ Provides actionable recommendations
 *   ✗ Does NOT regenerate roadmaps or analysis
 *   ✗ Does NOT modify progress data
 * ─────────────────────────────────────────────────────────────────────
 */

// ─── Future You Prediction ─────────────────────────────────────────────────────

/**
 * AI-generated future prediction based on current execution patterns.
 * This is a simulation of where the user will be if they continue at their current pace.
 */
export interface FutureYouPrediction {
  /** Personalized narrative describing the user's predicted future state */
  careerNarrative: string;

  /** Skills the user is predicted to have mastered */
  predictedSkills: string[];

  /** User's biggest strengths based on execution patterns */
  biggestStrengths: string[];

  /** User's biggest weaknesses that need attention */
  biggestWeaknesses: string[];

  /** Whether the user will be internship-ready by the target date */
  internshipReadiness: boolean;

  /** Estimated interview confidence score (0-100) */
  estimatedInterviewConfidence: number;

  /** Estimated number of potential offers (clearly marked as prediction) */
  estimatedOffers: number;

  /** Personalized recommendations to improve trajectory */
  personalizedRecommendations: string[];

  /** AI confidence in this prediction (0-100) */
  confidence: number;

  /** ISO timestamp of when this prediction was generated */
  predictedAt: string;

  /** Target days used for this prediction */
  targetDays: number;
}

// ─── Future You Response ───────────────────────────────────────────────────────

export interface FutureYouResponse {
  success: boolean;
  data: FutureYouPrediction;
}

// ─── Future You History Entry ──────────────────────────────────────────────────

/**
 * Immutable snapshot appended to history on every new prediction.
 * Stored at users/{uid}/futureSimulation/history/{timestamp}.
 */
export interface FutureYouHistoryEntry {
  careerNarrative: string;
  predictedSkills: string[];
  biggestStrengths: string[];
  biggestWeaknesses: string[];
  internshipReadiness: boolean;
  estimatedInterviewConfidence: number;
  estimatedOffers: number;
  personalizedRecommendations: string[];
  confidence: number;
  predictedAt: string; // ISO timestamp — used as document id
  targetDays: number;
  
  // Context snapshot for historical reference
  roadmapVersion: number;
  currentWeek: number;
  overallCompletion: number;
  currentStreak: number;
  goalHealthScore: number;
  burnoutRisk: string;
}

// ─── Future You Input ──────────────────────────────────────────────────────────

/**
 * All data needed for the Future You Agent to generate predictions.
 * Combines deterministic analytics with execution patterns.
 */
export interface FutureYouInput {
  // ─── Goal Context ──────────────────────────────────────────────────────────
  currentGoal: string;
  goalType: string;
  deadline: string;
  difficulty: string;
  feasibility: string;
  executionMode: string;

  // ─── Roadmap ───────────────────────────────────────────────────────────────
  roadmapVersion: number;
  totalWeeks: number;
  completedWeeks: number;
  currentWeek: number;
  remainingWeeks: number;
  remainingTopics: string[];

  // ─── Progress ──────────────────────────────────────────────────────────────
  overallCompletionPct: number;
  completedTasks: number;
  totalTasks: number;
  completedDays: number;
  averageCompletionRate: number; // % per week

  // ─── Time ──────────────────────────────────────────────────────────────────
  remainingDays: number;
  remainingHours: number;
  weeklyHours: number;
  predictedCompletionDate: string;
  targetDays: number; // Days until deadline or predicted completion

  // ─── XP & Gamification ─────────────────────────────────────────────────────
  totalXP: number;
  level: number;
  achievementCount: number;

  // ─── Streaks ───────────────────────────────────────────────────────────────
  currentStreak: number;
  longestStreak: number;
  streakActiveToday: boolean;
  totalActiveDays: number;

  // ─── Consistency ───────────────────────────────────────────────────────────
  consistencyRate: number; // % of started days that were completed
  executionConsistency: string; // 'excellent' | 'good' | 'moderate' | 'poor'

  // ─── Goal Health ───────────────────────────────────────────────────────────
  goalHealthScore: number;
  goalHealthLevel: string;
  healthTrend: string; // 'up' | 'down' | 'stable'

  // ─── Risk Assessment ───────────────────────────────────────────────────────
  burnoutRisk: string; // 'low' | 'medium' | 'high'
  deadlineRisk: string; // 'low' | 'medium' | 'high'
  deadlineStatus: string; // 'on_track' | 'slightly_behind' | 'rescue_active' | 'critical'

  // ─── Execution Intelligence ────────────────────────────────────────────────
  interviewReadinessScore: number;
  strengths: string[];
  weaknesses: string[];
  behaviourPatterns: string[];

  // ─── Daily Mission History ─────────────────────────────────────────────────
  missedTasksCount: number;
  revisionTasksCompletedCount: number;
  revisionTasksTotalCount: number;
  projectTasksCompletedCount: number;
  projectTasksTotalCount: number;
  practiceTasksCompletedCount: number;
  practiceTasksTotalCount: number;

  // ─── Topic Performance ─────────────────────────────────────────────────────
  topicsWithHighCompletion: string[];
  topicsWithLowCompletion: string[];

  // ─── Deadline Rescue ───────────────────────────────────────────────────────
  deadlineRescueActive: boolean;
  replanCount: number;
}
