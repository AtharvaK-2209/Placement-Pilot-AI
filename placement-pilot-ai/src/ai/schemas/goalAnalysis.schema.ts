/**
 * Schema layer for Goal Analysis AI responses.
 *
 * All interfaces defined here represent the exact shape of data
 * returned by the Gemini model after analyzing a user's GoalInput.
 *
 * Architecture note:
 * Every future AI module (Roadmap Generation, Daily Missions,
 * Future Simulation, Rescue Mode) should follow the same two-interface
 * pattern used here:
 *   1. A domain interface  — the actual AI-generated content
 *   2. A response envelope — { success, data } wrapper for safe consumption
 */

// ─── Difficulty ──────────────────────────────────────────────────────────────

/**
 * Qualitative difficulty rating assigned by the AI to the user's goal.
 *
 * - "Easy"   — achievable with minimal effort given the user's current profile
 * - "Medium" — requires consistent effort and some upskilling
 * - "Hard"   — significant gaps exist; aggressive preparation needed
 */
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

// ─── Feasibility ─────────────────────────────────────────────────────────────

/**
 * AI assessment of whether the goal is realistically achievable
 * within the user's stated deadline and weekly hours.
 *
 * - "High"     — timeline and effort are well-aligned with the goal
 * - "Moderate" — achievable but will require tight discipline
 * - "Low"      — timeline or capacity appears insufficient
 */
export type Feasibility = 'High' | 'Moderate' | 'Low';

// ─── GoalAnalysis ─────────────────────────────────────────────────────────────

/**
 * Core domain interface representing the AI's full analysis of a user's goal.
 * This is the payload populated by the Gemini model inside goalAnalysis.ts.
 */
export interface GoalAnalysis {
  /**
   * Qualitative difficulty of reaching the stated goal.
   * Used to surface motivational context and calibrate the learning roadmap.
   */
  difficulty: Difficulty;

  /**
   * Whether the goal is realistically feasible given the user's
   * deadline, weekly hours, and current skill level.
   * Used to warn users early if their timeline is too aggressive.
   */
  feasibility: Feasibility;

  /**
   * Estimated total hours required to reach the goal from the user's
   * current skill level. Used to validate the user's stated weekly hours
   * and provide a realistic completion timeline.
   */
  estimatedHours: number;

  /**
   * A score from 0–100 predicting the likelihood of goal success
   * based on the user's profile, effort commitment, and deadline.
   * Used to render a visual health indicator on the dashboard.
   */
  goalHealthPrediction: number;

  /**
   * List of skills or knowledge areas the user currently lacks
   * but needs to achieve their goal.
   * Used to drive the Roadmap Generation module.
   */
  skillGaps: string[];

  /**
   * List of existing skills or traits the user already has
   * that are relevant to their goal.
   * Used to personalise encouragement and skip redundant roadmap steps.
   */
  strengths: string[];

  /**
   * Actionable suggestions from the AI for improving the user's
   * chances of reaching their goal.
   * Used to populate the "Next Steps" section of the dashboard.
   */
  recommendations: string[];

  /**
   * A short natural-language paragraph summarising the full analysis.
   * Used as the primary readable output displayed to the user.
   */
  summary: string;
}

// ─── GoalAnalysisResponse ─────────────────────────────────────────────────────

/**
 * Standard response envelope wrapping every AI module result.
 *
 * Using a { success, data } envelope instead of throwing errors ensures:
 * - Safe, predictable consumption across all UI components
 * - Consistent error handling patterns for future AI modules
 * - Easy extension (e.g. adding `error`, `meta`, or `cached` fields later)
 */
export interface GoalAnalysisResponse {
  /**
   * Indicates whether the Gemini call and response parsing succeeded.
   * When false, `data` should be treated as empty / default values.
   */
  success: boolean;

  /**
   * The structured goal analysis returned by the AI.
   * Always present in the response object; consumers should check
   * `success` before trusting the field values.
   */
  data: GoalAnalysis;
}
