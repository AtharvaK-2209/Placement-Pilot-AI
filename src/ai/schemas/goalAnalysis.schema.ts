/**
 * Schema layer for Goal Analysis AI responses.
 *
 * AGENT RESPONSIBILITY — Goal Analysis Agent
 * ─────────────────────────────────────────────────────────────────────────────
 * The Goal Analysis Agent is responsible for:
 *   ✓ Evaluating goal difficulty
 *   ✓ Assessing feasibility
 *   ✓ Identifying strengths and skill gaps
 *   ✓ Recommending execution intensity (executionMode)
 *   ✓ Recommending weekly commitment (recommendedWeeklyHours)
 *   ✓ Calculating execution confidence (goalHealthPrediction)
 *   ✓ Providing a summary and actionable recommendations
 *
 * The Goal Analysis Agent does NOT:
 *   ✗ Estimate total hours required
 *   ✗ Generate a roadmap
 *   ✗ Break goals into tasks
 *   ✗ Reject goals based on deadlines
 *
 * Those responsibilities belong to:
 *   • Roadmap Agent        — generates and compresses the learning roadmap
 *   • Daily Mission Agent  — breaks roadmap into daily tasks
 *   • Progress Agent       — tracks execution and suggests replanning
 *
 * Architecture note:
 * Every future AI module should follow the same two-interface pattern:
 *   1. A domain interface  — the actual AI-generated content
 *   2. A response envelope — { success, data } wrapper for safe consumption
 */

// ─── Difficulty ───────────────────────────────────────────────────────────────

/**
 * Qualitative difficulty rating assigned by the AI.
 * - "Easy"   — achievable with moderate effort given the user's profile
 * - "Medium" — requires consistent effort and upskilling
 * - "Hard"   — significant gaps; aggressive preparation needed
 */
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

// ─── Feasibility ──────────────────────────────────────────────────────────────

/**
 * AI assessment of whether the goal is achievable within the deadline.
 * - "High"     — timeline and effort are well-aligned
 * - "Moderate" — achievable but requires tight discipline
 * - "Low"      — timeline or capacity may be insufficient
 */
export type Feasibility = 'High' | 'Moderate' | 'Low';

// ─── ExecutionMode ────────────────────────────────────────────────────────────

/**
 * Recommended learning intensity mode for this user's goal.
 *
 * The Roadmap Agent will use this to calibrate pacing, task density,
 * and weekly workload across the generated roadmap.
 *
 * - "Relaxed"   — light pace, suits long deadlines or part-time learners
 * - "Balanced"  — steady pace, sustainable over several months
 * - "Focused"   — higher intensity, suits moderate deadlines
 * - "Intensive" — high intensity, suits short deadlines or strong motivation
 * - "Extreme"   — maximum intensity, only for very short deadlines
 */
export type ExecutionMode =
  | 'Relaxed'
  | 'Balanced'
  | 'Focused'
  | 'Intensive'
  | 'Extreme';

// ─── GoalAnalysis ─────────────────────────────────────────────────────────────

/**
 * Core domain interface — the structured payload returned by the
 * Goal Analysis Agent after evaluating a user's GoalInput.
 */
export interface GoalAnalysis {
  /**
   * Qualitative difficulty of reaching the stated goal.
   * Used to surface motivational context and calibrate roadmap complexity.
   */
  difficulty: Difficulty;

  /**
   * Whether the goal is realistically achievable within the deadline.
   * Used to surface early warnings before the Roadmap Agent runs.
   */
  feasibility: Feasibility;

  /**
   * Recommended learning intensity for this user and goal.
   * Passed to the Roadmap Agent to calibrate pacing and task density.
   */
  executionMode: ExecutionMode;

  /**
   * AI-recommended weekly study hours as a human-readable range.
   * Example: "15–20 hrs/week"
   * The AI derives this from goal complexity, deadline, and skill level.
   * The Roadmap Agent uses this to distribute tasks across weeks.
   */
  recommendedWeeklyHours: string;

  /**
   * Execution confidence score from 0–100.
   * Reflects the AI's assessment of how likely the user is to succeed
   * based on: skill level, strengths, skill gaps, deadline, and commitment.
   *
   * This is NOT an effort score and does NOT depend on hour estimates.
   * It is a holistic confidence signal for the execution strategy.
   */
  goalHealthPrediction: number;

  /**
   * Skills the user currently lacks but needs to achieve their goal.
   * Passed directly to the Roadmap Agent to build the curriculum.
   */
  skillGaps: string[];

  /**
   * Skills and traits the user already has that are relevant to the goal.
   * Used to skip redundant roadmap topics and personalise encouragement.
   */
  strengths: string[];

  /**
   * Prioritised, actionable suggestions to improve execution chances.
   * Displayed to the user and later wired to the Daily Mission system.
   */
  recommendations: string[];

  /**
   * Short natural-language summary of the full analysis.
   * The primary human-readable output shown at the top of the Analysis Page.
   */
  summary: string;
}

// ─── GoalAnalysisResponse ─────────────────────────────────────────────────────

/**
 * Standard response envelope for every AI module result.
 *
 * { success, data } ensures:
 * - Safe, predictable consumption across all UI components
 * - Consistent error handling without throwing exceptions
 * - Easy extensibility (add `error`, `meta`, `cached` fields later)
 */
export interface GoalAnalysisResponse {
  /** True if the Gemini call and JSON parsing both succeeded. */
  success: boolean;

  /**
   * The structured analysis payload.
   * Always present; check `success` before trusting field values.
   */
  data: GoalAnalysis;
}
