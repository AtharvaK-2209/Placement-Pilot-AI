/**
 * @file executionIntelligence.schema.ts
 *
 * Schema for the Execution Intelligence Agent.
 *
 * ── AGENT RESPONSIBILITY ─────────────────────────────────────────────
 *   ✓ Analyzes how the user is executing their roadmap
 *   ✓ Identifies behavioral patterns and learning trends
 *   ✓ Provides personalized coaching recommendations
 *   ✓ Acts as an intelligent placement mentor
 *   ✗ Does NOT regenerate roadmaps or analysis
 *   ✗ Does NOT modify progress data
 * ─────────────────────────────────────────────────────────────────────
 */

// ─── Risk levels ───────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high';

// ─── ExecutionIntelligenceScore ────────────────────────────────────────────────

/**
 * Comprehensive execution analysis returned by the AI agent.
 * This is the coaching intelligence layer that evaluates HOW the user executes,
 * not just what they've completed.
 */
export interface ExecutionIntelligenceScore {
  /** High-level execution assessment (e.g., "Excellent execution", "Behind schedule") */
  overallPerformance: string;

  /** Topics where the user shows consistent strong performance */
  strengths: string[];

  /** Topics that need attention based on execution patterns */
  weaknesses: string[];

  /** AI-detected behavioral patterns (e.g., "Skips revision tasks", "Strong weekday consistency") */
  behaviourPatterns: string[];

  /** Personalized, actionable coaching recommendations */
  recommendations: string[];

  /** Risk of burnout based on execution patterns */
  burnoutRisk: RiskLevel;

  /** Risk of missing deadline based on current pace */
  deadlineRisk: RiskLevel;

  /** Estimated interview readiness score (0-100) */
  interviewReadiness: number;

  /** Encouraging message referencing actual progress */
  motivationalMessage: string;

  /** AI confidence in this analysis (0-100) */
  confidence: number;

  /** ISO timestamp of when this analysis was generated */
  computedAt: string;
}

// ─── ExecutionIntelligenceResponse ────────────────────────────────────────────

export interface ExecutionIntelligenceResponse {
  success: boolean;
  data: ExecutionIntelligenceScore;
}

// ─── ExecutionIntelligenceHistoryEntry ────────────────────────────────────────

/**
 * Immutable snapshot appended to history on every new evaluation.
 * Stored at users/{uid}/executionIntelligence/history/{timestamp}.
 */
export interface ExecutionIntelligenceHistoryEntry {
  overallPerformance: string;
  strengths: string[];
  weaknesses: string[];
  behaviourPatterns: string[];
  recommendations: string[];
  burnoutRisk: RiskLevel;
  deadlineRisk: RiskLevel;
  interviewReadiness: number;
  motivationalMessage: string;
  confidence: number;
  evaluatedAt: string; // ISO timestamp — used as document id
  roadmapVersion: number;
  currentWeek: number;
  overallCompletion: number;
}

// ─── ExecutionIntelligenceInput ───────────────────────────────────────────────

/**
 * All data needed for the Execution Intelligence Agent to perform its analysis.
 * This includes goal context, roadmap data, execution history, and behavioral signals.
 */
export interface ExecutionIntelligenceInput {
  // Goal & Analysis
  currentGoal: string;
  goalType: string;
  deadline: string;
  difficulty: string;
  feasibility: string;
  executionMode: string;

  // Roadmap
  roadmapVersion: number;
  totalWeeks: number;
  completedWeeks: number;
  currentWeek: number;
  remainingWeeks: number;

  // Time
  remainingDays: number;
  remainingHours: number;
  weeklyHours: number;

  // Progress
  overallCompletionPct: number;
  completedTasks: number;
  totalTasks: number;
  completedDays: number;

  // XP & Gamification
  totalXP: number;
  level: number;
  achievementCount: number;

  // Streaks
  currentStreak: number;
  longestStreak: number;
  streakActiveToday: boolean;
  totalActiveDays: number;

  // Consistency
  consistencyRate: number; // % of started days that were completed

  // Goal Health
  goalHealthScore: number;
  goalHealthLevel: string;

  // Weekly Completion Pattern (last 4 weeks)
  weeklyCompletionPattern: number[]; // array of completion %s

  // Replanning
  replanCount: number;

  // Daily Mission History (for pattern detection)
  missedTasksCount: number;
  revisionTasksCompletedCount: number;
  revisionTasksTotalCount: number;
  projectTasksCompletedCount: number;
  projectTasksTotalCount: number;
  practiceTasksCompletedCount: number;
  practiceTasksTotalCount: number;

  // Strong/Weak Topics (from completed tasks)
  topicsWithHighCompletion: string[]; // topics where >80% tasks completed
  topicsWithLowCompletion: string[]; // topics where <50% tasks completed
}
