/**
 * @file roadmap.schema.ts
 *
 * Schema layer for Roadmap Agent responses.
 *
 * AGENT RESPONSIBILITY — Roadmap Agent
 * ─────────────────────────────────────────────────────────────────────────────
 * The Roadmap Agent is responsible for:
 *   ✓ Consuming blueprint modules + GoalAnalysis output
 *   ✓ Deciding which modules to include, skip, compress, or expand
 *   ✓ Allocating modules across weeks to fit the deadline
 *   ✓ Inserting revision weeks, project milestones, and interview prep
 *   ✓ Personalizing based on execution mode and known skills
 *
 * The Roadmap Agent does NOT:
 *   ✗ Invent learning sequences (blueprint provides the order)
 *   ✗ Generate daily tasks (Daily Mission Agent's job)
 *   ✗ Track progress (Progress Agent's job)
 */

// ─── RoadmapModule ────────────────────────────────────────────────────────────

/**
 * A single learning module placed inside a roadmap week.
 * Derived from a BlueprintModule but may be subset/compressed by the AI.
 */
export interface RoadmapModule {
  /** Matches the BlueprintModule.id for cross-reference. */
  blueprintId: string;

  /** Display title for the module inside the week card. */
  title: string;

  /** Subset of blueprint concepts selected by the AI for this user. */
  concepts: string[];

  /** Subset of practice items assigned for this week. */
  practice: string[];

  /** Milestone label shown as a badge on completion. */
  milestone: string;

  /** Estimated hours for this module at the user's execution pace. */
  estimatedHours: number;
}

// ─── RoadmapWeek ──────────────────────────────────────────────────────────────

/**
 * A single week in the execution roadmap.
 * Contains one or more modules and a weekly goal.
 */
export interface RoadmapWeek {
  /** 1-indexed week number. */
  week: number;

  /**
   * Short descriptive title for the week.
   * Example: "Arrays & Strings", "Spring Security & JWT"
   */
  title: string;

  /** Total estimated study hours for this week. */
  estimatedHours: number;

  /**
   * Type tag for the week — allows UI to render special badges.
   * - "learning"  — standard module week
   * - "revision"  — consolidation / review week
   * - "project"   — capstone or mini-project delivery
   * - "interview" — mock interview / aptitude prep
   */
  type: 'learning' | 'revision' | 'project' | 'interview';

  /** One or more modules covered this week. */
  modules: RoadmapModule[];

  /**
   * Optional single-line focus note for the week.
   * Example: "This week sets the foundation — do not skip revision."
   */
  focusNote?: string;
}

// ─── Roadmap ──────────────────────────────────────────────────────────────────

/**
 * The complete execution roadmap returned by the Roadmap Agent.
 * This is the primary data structure consumed by:
 *   • RoadmapPage  (UI rendering)
 *   • Daily Mission Agent (breaks weeks into daily tasks)
 *   • Progress Agent (tracks weekly completion)
 *   • Replanning Agent (adjusts roadmap on missed weeks)
 */
export interface Roadmap {
  /**
   * Human-readable title for the roadmap.
   * Example: "Amazon SDE Internship — 6 Month Roadmap"
   */
  title: string;

  /** Total number of weeks in the roadmap. */
  totalWeeks: number;

  /** Total estimated hours across all weeks. */
  totalHours: number;

  /**
   * The execution mode this roadmap was calibrated for.
   * Passed from GoalAnalysis.executionMode.
   */
  executionMode: string;

  /** The ordered list of weeks. Never reorder — sequence is fixed by blueprints. */
  weeks: RoadmapWeek[];

  /**
   * Short summary of the roadmap strategy.
   * Example: "Focused 12-week plan prioritizing DSA and Core Java."
   */
  summary: string;
}

// ─── RoadmapResponse ─────────────────────────────────────────────────────────

/**
 * Standard response envelope — same { success, data } pattern used
 * across all PlacementPilot AI agents.
 */
export interface RoadmapResponse {
  success: boolean;
  data: Roadmap;
}
