/**
 * @file domain.ts
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║          PlacementPilot AI — Unified Domain Model                ║
 * ║          Single Source of Truth for ALL shared types             ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Every feature in the application imports its types from here.
 * No feature defines its own duplicate interfaces.
 *
 * File-level sections:
 *   1.  Primitive / scalar types
 *   2.  Goal domain
 *   3.  Goal Analysis domain
 *   4.  Roadmap domain
 *   5.  Daily Mission domain
 *   6.  Progress domain
 *   7.  XP domain
 *   8.  Streak domain
 *   9.  Achievement domain
 *   10. User & settings domain
 *   11. Future agent placeholders
 *
 * ── DEPENDENCY RULE ──────────────────────────────────────────────────
 * This file has ZERO imports from the rest of the project.
 * It is a pure type definition file.
 * Everything else imports FROM here — never the other way around.
 * ─────────────────────────────────────────────────────────────────────
 */

// ══════════════════════════════════════════════════════════════════════
// 1. PRIMITIVE / SCALAR TYPES
// ══════════════════════════════════════════════════════════════════════

/** ISO 8601 date string — "YYYY-MM-DD" */
export type ISODate = string;

/** ISO 8601 datetime string — "YYYY-MM-DDTHH:mm:ss.sssZ" */
export type ISODateTime = string;

/** UUID v4 or timestamp-based unique identifier string */
export type ID = string;

// ══════════════════════════════════════════════════════════════════════
// 2. GOAL DOMAIN
// ══════════════════════════════════════════════════════════════════════

export type GoalType =
  | 'placement'
  | 'internship'
  | 'upskill'
  | 'career-switch';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export type LearningStyle =
  | 'visual'
  | 'reading'
  | 'hands-on'
  | 'mixed';

export type Skill =
  | 'DSA'
  | 'Java'
  | 'Spring Boot'
  | 'SQL'
  | 'DBMS'
  | 'Operating Systems'
  | 'Computer Networks'
  | 'Aptitude'
  | 'Communication'
  | 'Projects';

/**
 * The user's raw goal input from the Goal Form.
 * Used as the primary input to the Goal Analysis Agent.
 */
export interface GoalInput {
  goal:           string;
  goalType:       GoalType;
  deadline:       ISODate;
  skillLevel:     SkillLevel;
  knownSkills:    Skill[];
  weeklyHours:    number;
  learningStyle:  LearningStyle;
  targetCompany?: string;
}

// ══════════════════════════════════════════════════════════════════════
// 3. GOAL ANALYSIS DOMAIN
// ══════════════════════════════════════════════════════════════════════

/** How hard the goal is to achieve. */
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

/** Whether the goal is achievable within the deadline. */
export type Feasibility = 'High' | 'Moderate' | 'Low';

/** Recommended learning intensity. Drives roadmap pacing. */
export type ExecutionMode =
  | 'Relaxed'
  | 'Balanced'
  | 'Focused'
  | 'Intensive'
  | 'Extreme';

/**
 * Structured result returned by the Goal Analysis Agent.
 * Persisted as part of PlacementPilotState so future agents
 * (Goal Health, Deadline Rescue) can read it without re-calling Gemini.
 */
export interface GoalAnalysis {
  difficulty:             Difficulty;
  feasibility:            Feasibility;
  executionMode:          ExecutionMode;
  recommendedWeeklyHours: string;
  /** Execution confidence score 0–100. NOT an hours estimate. */
  goalHealthPrediction:   number;
  skillGaps:              string[];
  strengths:              string[];
  recommendations:        string[];
  summary:                string;
  /** ISO timestamp of when this analysis was generated. */
  generatedAt:            ISODateTime;
}

/** Standard agent response envelope for GoalAnalysis. */
export interface GoalAnalysisResponse {
  success: boolean;
  data:    GoalAnalysis;
}

// ══════════════════════════════════════════════════════════════════════
// 4. ROADMAP DOMAIN
// ══════════════════════════════════════════════════════════════════════

/**
 * A single learning module within a roadmap week.
 * Derived from a BlueprintModule but shaped by the Roadmap Agent.
 */
export interface RoadmapModule {
  /** Cross-references the blueprint module by id. */
  blueprintId:    string;
  title:          string;
  concepts:       string[];
  practice:       string[];
  milestone:      string;
  estimatedHours: number;
}

/** Type tag for a roadmap week — drives UI badges and mission generation strategy. */
export type RoadmapWeekType = 'learning' | 'revision' | 'project' | 'interview';

/**
 * One week in the execution roadmap.
 * Consumed by: RoadmapPage, Daily Mission Agent, Progress Service.
 */
export interface RoadmapWeek {
  week:           number;        // 1-indexed
  title:          string;
  estimatedHours: number;
  type:           RoadmapWeekType;
  modules:        RoadmapModule[];
  focusNote?:     string;
}

/**
 * The complete execution roadmap.
 * Persisted in PlacementPilotState so the user's plan survives page refresh
 * and is available to all future agents without regeneration.
 */
export interface Roadmap {
  title:          string;
  totalWeeks:     number;
  totalHours:     number;
  executionMode:  string;
  weeks:          RoadmapWeek[];
  summary:        string;
  /** ISO timestamp of when this roadmap was generated. */
  generatedAt:    ISODateTime;
}

/** Standard agent response envelope for Roadmap. */
export interface RoadmapResponse {
  success: boolean;
  data:    Roadmap;
}

// ══════════════════════════════════════════════════════════════════════
// 5. DAILY MISSION DOMAIN
// ══════════════════════════════════════════════════════════════════════

/** Category tag for a mission task — drives icon and XP reward. */
export type MissionTaskType = 'learning' | 'practice' | 'revision' | 'project';

/**
 * A single atomic task inside a daily mission.
 * Extended by Progress Agent with completion metadata.
 */
export interface MissionTask {
  title:            string;
  estimatedMinutes: number;
  type:             MissionTaskType;
  // Phase 4+ persistence fields:
  completed?:       boolean;
  completedAt?:     ISODateTime;
  xpReward?:        number;
}

/**
 * A complete daily mission generated for one day of a roadmap week.
 * Persisted keyed by `"w${weekNumber}-d${dayNumber}"`.
 */
export interface DailyMission {
  title:          string;
  estimatedHours: number;
  learningTasks:  MissionTask[];
  practiceTasks:  MissionTask[];
  revisionTasks:  MissionTask[];
  milestone:      string;
  motivation?:    string;
  // Persistence fields (populated when saving to state):
  weekNumber?:    number;
  dayNumber?:     number;
  completed?:     boolean;
  generatedAt?:   ISODateTime;
}

/**
 * Input contract for generateDailyMission().
 * Only accepts what is already available — never regenerates roadmap.
 */
export interface DailyMissionInput {
  week:          RoadmapWeek;
  dayNumber:     number;
  executionMode: string;
  weeklyHours:   number;
}

/** Standard agent response envelope for DailyMission. */
export interface DailyMissionResponse {
  success: boolean;
  data:    DailyMission;
}

// ══════════════════════════════════════════════════════════════════════
// 6. PROGRESS DOMAIN
// ══════════════════════════════════════════════════════════════════════

/**
 * Completion state of a single task within a saved day.
 * TaskTitle is the stable key — never changes for the lifetime of the day.
 */
export interface TaskCompletion {
  taskTitle:    string;
  completed:    boolean;
  completedAt?: ISODateTime;
}

/**
 * Progress record for one day.
 * Stored at key `"w${weekNumber}-d${dayNumber}"` inside UserProgress.days.
 */
export interface DayProgress {
  weekNumber:        number;
  dayNumber:         number;
  missionTitle:      string;
  tasks:             TaskCompletion[];
  completionPercent: number; // 0–100, recomputed on every update
  startedAt:         ISODateTime;
  completedAt?:      ISODateTime;
}

/**
 * Aggregated view of one week's completion.
 * Derived from DayProgress records — never stored independently.
 */
export interface WeekProgress {
  weekNumber:        number;
  weekTitle:         string;
  completedDays:     number;
  totalDays:         number; // always 7
  completionPercent: number;
  completed:         boolean;
  completedAt?:      ISODateTime;
}

/**
 * Overall goal completion summary.
 * Computed on demand from all DayProgress records.
 */
export interface OverallProgress {
  totalWeeks:        number;
  completedWeeks:    number;
  totalTasks:        number;
  completedTasks:    number;
  completionPercent: number;
}

// ══════════════════════════════════════════════════════════════════════
// 7. XP DOMAIN
// ══════════════════════════════════════════════════════════════════════

/** Source event that triggered an XP award. */
export type XPSource =
  | 'task_complete'
  | 'day_complete'
  | 'week_complete'
  | 'streak_bonus'
  | 'milestone'
  | 'achievement';

/**
 * Immutable XP ledger entry.
 * Append-only — never mutated after creation.
 */
export interface XPEntry {
  id:          ID;
  source:      XPSource;
  amount:      number;
  earnedAt:    ISODateTime;
  description: string;
}

/** Level info derived from totalXP (every 500 XP = 1 level). */
export interface LevelInfo {
  level:        number;
  currentXP:    number;
  nextLevelXP:  number;
  progress:     number; // 0–100 %
}

// ══════════════════════════════════════════════════════════════════════
// 8. STREAK DOMAIN
// ══════════════════════════════════════════════════════════════════════

/**
 * Tracks the user's consecutive daily activity.
 * Persisted as part of UserProgress.
 */
export interface StreakState {
  currentStreak:   number;
  longestStreak:   number;
  lastActiveDate:  ISODate;   // "YYYY-MM-DD"
  totalActiveDays: number;
}

// ══════════════════════════════════════════════════════════════════════
// 9. ACHIEVEMENT DOMAIN
// ══════════════════════════════════════════════════════════════════════

/**
 * A single unlocked achievement.
 * Append-only — once unlocked, never removed.
 */
export interface Achievement {
  id:          string;
  title:       string;
  description: string;
  unlockedAt:  ISODateTime;
  icon?:       string; // emoji or asset key
}

// ══════════════════════════════════════════════════════════════════════
// 9b. GAMIFICATION DOMAIN — PHASE 10
// ══════════════════════════════════════════════════════════════════════

/**
 * Badge definition and unlock state.
 * Locked badges are shown grayed out in the UI.
 */
export interface Badge {
  id:          string;
  title:       string;
  description: string;
  icon:        string;      // emoji or asset key
  locked:      boolean;
  unlockedAt?: ISODateTime;
  category:    'milestone' | 'streak' | 'completion' | 'special';
}

/**
 * Weekly goal state — auto-generated at the start of each week.
 * Tracks mission completion and XP targets.
 */
export interface WeeklyGoal {
  weekStartDate:    ISODate;   // Monday of the week
  weekEndDate:      ISODate;   // Sunday of the week
  targetMissions:   number;    // e.g., 5 missions
  completedMissions: number;
  targetXP:         number;    // e.g., 500 XP
  earnedXP:         number;
  completed:        boolean;
  completedAt?:     ISODateTime;
}

/**
 * Milestone tracker — key events in the user's journey.
 * Unlocks badges and drives gamification progression.
 */
export interface Milestone {
  id:          string;
  title:       string;
  description: string;
  icon:        string;
  unlocked:    boolean;
  unlockedAt?: ISODateTime;
}

/**
 * Extended streak state with weekly/monthly tracking.
 * Extends the base StreakState with additional metrics.
 */
export interface ExtendedStreakState extends StreakState {
  weeklyStreak:   number;  // consecutive weeks with 5+ active days
  monthlyStreak:  number;  // consecutive months with 20+ active days
  missedDays:     number;  // total days missed since start
}

/**
 * Level configuration — defines XP thresholds for each level.
 * Configurable via gamificationConfig.ts.
 */
export interface LevelThreshold {
  level:   number;
  xpRequired: number;
  title?:  string;  // e.g., "Beginner", "Intermediate", "Expert"
}

/**
 * Current level state with progress to next level.
 * Derived from totalXP using level thresholds.
 */
export interface LevelState {
  level:        number;
  currentXP:    number;  // XP within current level
  nextLevelXP:  number;  // XP needed to reach next level
  progress:     number;  // 0-100%
  title?:       string;  // level title if configured
}

// ══════════════════════════════════════════════════════════════════════
// 10. USER & SETTINGS DOMAIN
// ══════════════════════════════════════════════════════════════════════

/**
 * User identity — minimal for MVP (anonymous local user).
 * Extended with Firebase UID, email, photoURL in Phase 6.
 */
export interface User {
  /** Client-generated UUID. Becomes Firebase UID in Phase 6. */
  id:           ID;
  displayName?: string;
  createdAt:    ISODateTime;
  // Phase 6 Firebase fields:
  // email?:       string;
  // photoURL?:    string;
  // provider?:    'google' | 'anonymous';
}

/**
 * User-configurable application settings.
 * Persisted per-user in Phase 6 via Firestore.
 */
export interface UserSettings {
  /** Preferred UI theme. Always 'dark' for MVP. */
  theme:                 'dark' | 'light';
  /** Whether to show daily reminder notifications (future). */
  notificationsEnabled?: boolean;
  /** Preferred language code, e.g. "en". */
  language?:             string;
}

/**
 * Root progress aggregate owned by ProgressRepository.
 * Serialised to localStorage now; maps to a Firestore document in Phase 6.
 */
export interface UserProgress {
  roadmapTitle: string;
  startedAt:    ISODateTime;
  /** Keyed by `"w${week}-d${day}"` */
  days:         Record<string, DayProgress>;
  totalXP:      number;
  xpLog:        XPEntry[];
  streak:       StreakState;
  achievements: Achievement[];
  updatedAt:    ISODateTime;
  // Phase 10 gamification fields:
  badges?:      Badge[];
  weeklyGoals?: WeeklyGoal[];
  milestones?:  Milestone[];
  extendedStreak?: ExtendedStreakState;
}

// ══════════════════════════════════════════════════════════════════════
// 10b. ROADMAP VERSIONING DOMAIN
// ══════════════════════════════════════════════════════════════════════

/**
 * What caused this roadmap version to be created.
 * 'initial'        — first roadmap after Goal Analysis
 * 'manual'         — user clicked "Replan Roadmap"
 * 'missed_days'    — auto-trigger: user fell behind
 * 'week_complete'  — auto-trigger: week 100% complete
 * 'deadline_rescue'— Deadline Rescue Agent (future)
 */
export type RoadmapVersionTrigger =
  | 'initial'
  | 'manual'
  | 'missed_days'
  | 'week_complete'
  | 'deadline_rescue';

/**
 * An immutable snapshot of one roadmap version.
 * Every time a roadmap is generated or replanned, a new version is created.
 * Previous versions are never overwritten — they are preserved for history,
 * comparison, and rollback.
 */
export interface RoadmapVersion {
  /** 1-indexed version number. V1 = initial, V2 = first replan, etc. */
  version:    number;

  /** The full roadmap snapshot at the time this version was created. */
  roadmap:    Roadmap;

  /** What caused this version to be created. */
  trigger:    RoadmapVersionTrigger;

  /**
   * Human-readable reason for the change (empty string for V1).
   * Shown in the "Roadmap Updated" card and version history.
   */
  reason:     string;

  /**
   * Short description of what changed vs the previous version.
   * Empty string for V1.
   */
  summary:    string;

  /** ISO timestamp of when this version was created. */
  createdAt:  ISODateTime;
}

/**
 * Pointer that tracks which version is currently active.
 * Stored at a stable Firestore path so it can be updated without
 * touching any version document.
 */
export interface ActiveRoadmapPointer {
  /** The version number of the currently active roadmap. */
  activeVersion: number;
  /** ISO timestamp of when the active version was last changed. */
  updatedAt:     ISODateTime;
}

// ══════════════════════════════════════════════════════════════════════
// 11. FUTURE AGENT PLACEHOLDERS
// ══════════════════════════════════════════════════════════════════════

/**
 * GoalHealthScore — produced by the Goal Health Agent (Phase 5+).
 * Tracks how the user's execution confidence evolves over time.
 */
export interface GoalHealthScore {
  score:       number;       // 0–100
  trend:       'improving' | 'stable' | 'declining';
  computedAt:  ISODateTime;
  factors:     string[];     // human-readable contributing factors
}

/**
 * FutureSimulationResult — produced by the Future Simulation Agent.
 * Projects where the user will be at their deadline given current pace.
 */
export interface FutureSimulationResult {
  projectedCompletionDate: ISODate;
  projectedCompletionPct:  number;  // % of roadmap completed by deadline
  weeksBehind:             number;  // 0 = on track, >0 = behind
  recommendation:          string;
  simulatedAt:             ISODateTime;
}

/**
 * DeadlineRescuePlan — produced by the Deadline Rescue Agent.
 * A compressed re-plan for when the user is significantly behind.
 */
export interface DeadlineRescuePlan {
  triggeredAt:    ISODateTime;
  originalWeeks:  number;
  remainingWeeks: number;
  skippedModules: string[];    // blueprint module ids to drop
  intensifiedWeeks: RoadmapWeek[];
  summary:        string;
}

/**
 * ReplanningHistoryEntry — one entry per dynamic replanning event.
 * Append-only log; never overwritten.
 */
export interface ReplanningHistoryEntry {
  id:          ID;
  triggeredAt: ISODateTime;
  reason:      'missed_days' | 'deadline_change' | 'skill_update' | 'manual';
  previousExecutionMode: ExecutionMode;
  newExecutionMode:      ExecutionMode;
  weeksAdjusted:         number;
  summary:               string;
}
