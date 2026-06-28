/**
 * @file appState.ts
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║       PlacementPilotState — Root Application State Model         ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * This is the single root entity that will be persisted to Firestore
 * in Phase 6 as a user document with sub-collections.
 *
 * localStorage (Phase 5): the entire object is serialised to
 *   "pp_app_state" alongside the existing "pp_progress" key.
 *
 * Firestore (Phase 6) mapping:
 *   users/{userId}                     → User
 *   users/{userId}/goals/{goalId}      → Goal
 *   users/{userId}/analysis/{goalId}   → GoalAnalysis
 *   users/{userId}/roadmaps/{goalId}   → Roadmap
 *   users/{userId}/missions/{key}      → DailyMission
 *   users/{userId}/progress            → UserProgress
 *
 * All optional properties use the `?` modifier so that:
 *   • Partial state (e.g. goal entered but roadmap not yet generated)
 *     is always valid.
 *   • Future agents can add their fields without touching existing ones.
 *   • Zero breaking changes when new phases extend the model.
 */

import type {
  User,
  UserSettings,
  GoalInput,
  GoalAnalysis,
  Roadmap,
  DailyMission,
  UserProgress,
  GoalHealthScore,
  FutureSimulationResult,
  DeadlineRescuePlan,
  ReplanningHistoryEntry,
  ISODateTime,
  ID,
} from './domain';

// ─── PlacementPilotState ───────────────────────────────────────────────────────

/**
 * The single root state object for a user's entire PlacementPilot session.
 *
 * Design principles:
 *   • All top-level fields are optional — state builds up phase by phase.
 *   • Future phases add optional fields — never change existing ones.
 *   • The `meta` block carries persistence metadata readable by any agent.
 */
export interface PlacementPilotState {

  // ── Identity ────────────────────────────────────────────────────────────────

  /** Unique state instance id (client UUID, becomes Firestore document id). */
  id:        ID;

  /** The user who owns this state. Populated on first launch. */
  user?:     User;

  /** User-configurable preferences. */
  settings?: UserSettings;

  // ── Goal pipeline ────────────────────────────────────────────────────────────

  /**
   * Phase 1 — the raw goal submitted via the Goal Form.
   * Populated when the user clicks "Continue" on GoalPage.
   */
  goal?: GoalInput;

  /**
   * Phase 2 — structured analysis produced by the Goal Analysis Agent.
   * Populated after Gemini returns a successful GoalAnalysisResponse.
   */
  goalAnalysis?: GoalAnalysis;

  /**
   * Phase 3 — the execution roadmap produced by the Roadmap Agent.
   * Populated after Gemini returns a successful RoadmapResponse.
   */
  roadmap?: Roadmap;

  /**
   * Phase 3b — index of daily missions keyed by `"w${week}-d${day}"`.
   * Populated lazily as the user generates missions on DailyMissionPage.
   */
  dailyMissions?: Record<string, DailyMission>;

  // ── Progress & gamification ───────────────────────────────────────────────

  /**
   * Phase 4 — the full progress aggregate (XP, streak, achievements, tasks).
   * Managed exclusively by ProgressRepository — never written directly by UI.
   */
  progress?: UserProgress;

  // ── Future agent outputs ────────────────────────────────────────────────────

  /**
   * Phase 5 — Goal Health Agent output.
   * Tracks execution confidence evolution over time.
   * Undefined until the Goal Health Agent runs for the first time.
   */
  goalHealth?: GoalHealthScore;

  /**
   * Phase 5 — Future Simulation Agent output.
   * Projects where the user will be at their deadline given current pace.
   * Refreshed automatically when progress milestones are hit.
   */
  futureSimulation?: FutureSimulationResult;

  /**
   * Phase 6 — Deadline Rescue Agent output.
   * Populated only when the user is significantly behind schedule.
   * Replaces the existing roadmap if the user accepts the rescue plan.
   */
  deadlineRescue?: DeadlineRescuePlan;

  /**
   * Phase 6 — Immutable log of every dynamic replanning event.
   * Append-only. Used by the Adaptive AI Coach to explain changes.
   */
  replanningHistory?: ReplanningHistoryEntry[];

  // ── Persistence metadata ──────────────────────────────────────────────────

  meta: StateMeta;
}

/**
 * Persistence and sync metadata attached to every PlacementPilotState.
 * Readable by any agent to understand the current lifecycle stage.
 */
export interface StateMeta {
  /** Schema version — increment when a breaking change is made to the model. */
  schemaVersion:  number;

  /** ISO timestamp of when this state was first created. */
  createdAt:      ISODateTime;

  /** ISO timestamp of last write to any field. */
  updatedAt:      ISODateTime;

  /**
   * Tracks which phases have been completed.
   * Allows agents to gate on prerequisites without reading deep into the state.
   */
  completedPhases: PhaseStatus[];

  /**
   * Current active pipeline stage.
   * UI can read this to decide which page to render on app launch.
   */
  currentStage: AppStage;
}

/**
 * Ordered list of pipeline stages.
 * Each stage maps to one or more pages/agents in the application.
 */
export type AppStage =
  | 'idle'             // No goal entered
  | 'goal_entered'     // Goal Form submitted
  | 'analysis_done'    // Goal Analysis complete
  | 'roadmap_done'     // Roadmap generated
  | 'missions_active'  // At least one daily mission generated
  | 'in_progress'      // Tasks being completed
  | 'completed';       // All roadmap weeks marked complete

export interface PhaseStatus {
  phase:       string;        // e.g. "goal_analysis", "roadmap", "daily_mission"
  completed:   boolean;
  completedAt?: ISODateTime;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates a fresh, empty PlacementPilotState.
 * Used when a user launches the app for the first time.
 * LocalStorageAppRepository will call this if no state is found.
 */
export function createInitialState(id: ID): PlacementPilotState {
  const now = new Date().toISOString();
  return {
    id,
    meta: {
      schemaVersion:   1,
      createdAt:       now,
      updatedAt:       now,
      completedPhases: [],
      currentStage:    'idle',
    },
  };
}

// ─── Type guards ──────────────────────────────────────────────────────────────

/** True if the state has a goal and completed goal analysis. */
export function hasAnalysis(s: PlacementPilotState): s is PlacementPilotState & { goal: GoalInput; goalAnalysis: GoalAnalysis } {
  return s.goal !== undefined && s.goalAnalysis !== undefined;
}

/** True if the state has a generated roadmap. */
export function hasRoadmap(s: PlacementPilotState): s is PlacementPilotState & { roadmap: Roadmap } {
  return s.roadmap !== undefined;
}

/** True if the user has started making progress. */
export function hasProgress(s: PlacementPilotState): s is PlacementPilotState & { progress: UserProgress } {
  return s.progress !== undefined;
}
