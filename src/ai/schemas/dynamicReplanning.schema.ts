/**
 * @file dynamicReplanning.schema.ts
 *
 * Re-exports Dynamic Replanning types from the unified domain model
 * and defines agent-specific response types.
 *
 * ── AGENT RESPONSIBILITY — Dynamic Replanning Agent ──────────────────
 *   ✓ Reads current roadmap + progress context
 *   ✓ Produces an updated roadmap that fits remaining time
 *   ✓ Explains what changed and why
 *   ✓ Adjusts execution mode if needed
 *   ✗ Does NOT re-run Goal Analysis
 *   ✗ Does NOT change the user's goal or deadline
 *   ✗ Does NOT generate daily missions
 * ─────────────────────────────────────────────────────────────────────
 */

import type { Roadmap } from '../../types/domain';

// ─── Risk level ────────────────────────────────────────────────────────────────

/**
 * AI-assessed risk that the user will miss their deadline given current pace.
 * - "low"      — on track, replanning is optimisation
 * - "moderate" — some adjustment needed
 * - "high"     — significant behind, aggressive compression required
 * - "critical" — deadline may not be achievable without major changes
 */
export type ReplanRiskLevel = 'low' | 'moderate' | 'high' | 'critical';

// ─── Change record ─────────────────────────────────────────────────────────────

/**
 * Describes one specific change made to the roadmap during replanning.
 * Displayed to the user as a human-readable diff.
 */
export interface RoadmapChange {
  /** Type of change performed. */
  type: 'compressed' | 'skipped' | 'reordered' | 'expanded' | 'added' | 'removed';
  /** Which week number was affected (1-indexed). */
  weekNumber: number;
  /** Short human-readable description of the change. */
  description: string;
}

// ─── Priority adjustment ───────────────────────────────────────────────────────

/**
 * A topic-level priority change — tells the user what to focus on more/less.
 */
export interface PriorityAdjustment {
  /** Module title or topic name. */
  topic: string;
  /** Direction of priority change. */
  direction: 'increased' | 'decreased' | 'removed';
  /** One-sentence rationale. */
  reason: string;
}

// ─── ReplanResult ──────────────────────────────────────────────────────────────

/**
 * The structured result returned by the Dynamic Replanning Agent.
 * Contains the full updated roadmap alongside diagnostic metadata.
 */
export interface ReplanResult {
  /** The complete updated roadmap replacing the current one. */
  updatedRoadmap: Roadmap;

  /**
   * One-paragraph explanation of why replanning was triggered
   * and what the overall strategy change is.
   */
  reason: string;

  /**
   * Ordered list of specific changes made to the roadmap.
   * Displayed as a diff to the user.
   */
  changes: RoadmapChange[];

  /** AI-assessed deadline risk level given current progress pace. */
  riskLevel: ReplanRiskLevel;

  /**
   * AI-recommended weekly hours for the updated plan.
   * May differ from original if deadline pressure has increased.
   * Format: "15–20 hrs/week"
   */
  recommendedWeeklyHours: string;

  /**
   * Topic-level priority adjustments.
   * Tells the user what to focus on more or less after replanning.
   */
  priorityAdjustments: PriorityAdjustment[];
}

// ─── ReplanResponse ────────────────────────────────────────────────────────────

/**
 * Standard { success, data } envelope — same pattern as every other agent.
 */
export interface ReplanResponse {
  success: boolean;
  data:    ReplanResult;
}

// ─── ReplanInput ──────────────────────────────────────────────────────────────

/**
 * Everything the Dynamic Replanning Agent needs to produce an updated roadmap.
 * Assembled by the UI from router state + repository reads.
 */
export interface ReplanInput {
  /** The user's original goal. */
  goalText:       string;
  goalType:       string;
  deadline:       string;    // ISO date
  weeklyHours:    number;

  /** Key outputs from Goal Analysis (not re-run — read from state). */
  executionMode:        string;
  skillGaps:            string[];
  strengths:            string[];

  /** The roadmap being replaced. */
  currentRoadmap:       Roadmap;

  /** Completion summary: how many weeks done, overall % complete. */
  completedWeeks:       number;
  totalWeeks:           number;
  overallCompletionPct: number;

  /** Gamification context — AI uses these to calibrate intensity. */
  totalXP:              number;
  currentStreak:        number;

  /** Days remaining until deadline (computed by UI). */
  remainingDays:        number;

  /** Optional trigger reason — defaults to 'manual'. */
  triggerReason?: 'manual' | 'missed_days' | 'deadline_change' | 'week_complete';
}
