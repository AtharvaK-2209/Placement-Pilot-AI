/**
 * @file dashboard.types.ts
 *
 * Type definitions for the Dashboard Service.
 * Aggregates all user information into a single object.
 *
 * ─── ARCHITECTURE RULE ────────────────────────────────────────────────────────
 * Dashboard types are VIEW MODELS — not domain entities.
 * They shape data for optimal UI consumption without coupling to storage details.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type {
  ISODate,
  ISODateTime,
} from '../types/domain';
import type { HealthLevel, BurnoutRisk, DeadlineStatus } from '../ai/goalHealth/goalHealth.schema';
import type { RescueStatus } from '../ai/deadlineRescue/deadlineRescue.schema';

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD AGGREGATE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * The complete dashboard data object.
 * All information needed to render the Dashboard page without additional queries.
 */
export interface DashboardData {
  /** User greeting with time of day */
  greeting:              UserGreeting;
  /** Current goal summary */
  goal:                  GoalSummary | null;
  /** Current roadmap summary */
  roadmap:               RoadmapSummary | null;
  /** Today's mission summary */
  mission:               MissionSummary | null;
  /** Goal health summary */
  goalHealth:            GoalHealthSummary | null;
  /** XP and level summary */
  xp:                    XPSummary;
  /** Streak summary */
  streak:                StreakSummary;
  /** Deadline summary */
  deadline:              DeadlineSummary | null;
  /** Deadline rescue status */
  deadlineRescue:        DeadlineRescueSummary | null;
  /** Execution intelligence summary */
  executionIntelligence: ExecutionIntelligenceSummary | null;
  /** Future You availability and summary */
  futureYou:             FutureYouSummary | null;
  /** Quick action buttons */
  quickActions:          QuickActions;
  /** Overall completion and progress */
  progress:              ProgressSummary;
  /** Data freshness metadata */
  meta:                  DashboardMeta;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── User Greeting ─────────────────────────────────────────────────────────────

export interface UserGreeting {
  /** Time-based greeting: "Good Morning", "Good Afternoon", "Good Evening" */
  message:      string;
  /** User's display name if available */
  displayName?: string;
  /** Current local time */
  currentTime:  string;
  /** Current date in human-readable format */
  currentDate:  string;
}

// ─── Goal Summary ──────────────────────────────────────────────────────────────

export interface GoalSummary {
  /** User's goal statement */
  goal:              string;
  /** Goal type */
  goalType:          string;
  /** Deadline as ISO date */
  deadline:          ISODate;
  /** Days remaining until deadline */
  remainingDays:     number;
  /** Execution mode */
  executionMode:     string;
  /** Difficulty assessment */
  difficulty:        string;
  /** Feasibility assessment */
  feasibility:       string;
  /** Weekly hours commitment */
  weeklyHours:       number;
  /** Goal entered timestamp */
  createdAt?:        ISODateTime;
}

// ─── Roadmap Summary ───────────────────────────────────────────────────────────

export interface RoadmapSummary {
  /** Roadmap title */
  title:          string;
  /** Current active week (1-indexed) */
  currentWeek:    number;
  /** Total weeks in roadmap */
  totalWeeks:     number;
  /** Number of completed weeks */
  completedWeeks: number;
  /** Number of remaining weeks */
  remainingWeeks: number;
  /** Current week progress (0-100) */
  currentWeekProgress: number;
  /** Active roadmap version */
  version:        number;
  /** Roadmap generated timestamp */
  generatedAt?:   ISODateTime;
}

// ─── Mission Summary ───────────────────────────────────────────────────────────

export interface MissionSummary {
  /** Mission title */
  title:              string;
  /** Week number */
  weekNumber:         number;
  /** Day number */
  dayNumber:          number;
  /** Estimated hours */
  estimatedHours:     number;
  /** Total tasks */
  totalTasks:         number;
  /** Completed tasks */
  completedTasks:     number;
  /** Completion percentage (0-100) */
  completionPercent:  number;
  /** Whether the mission is complete */
  completed:          boolean;
  /** Mission generated timestamp */
  generatedAt?:       ISODateTime;
}

// ─── Goal Health Summary ───────────────────────────────────────────────────────

export interface GoalHealthSummary {
  /** Health score (0-100) */
  score:                      number;
  /** Health level */
  level:                      HealthLevel;
  /** One-line summary */
  summary:                    string;
  /** Burnout risk assessment */
  burnoutRisk:                BurnoutRisk;
  /** Deadline status indicator */
  deadlineStatus:             DeadlineStatus;
  /** Estimated completion date */
  estimatedCompletionDate:    ISODate;
  /** Estimated days remaining */
  estimatedDaysRemaining:     number;
  /** Overall completion percentage */
  overallCompletion:          number;
  /** Top 3 strengths */
  topStrengths:               string[];
  /** Top 3 weaknesses */
  topWeaknesses:              string[];
  /** Trend direction */
  trend?:                     'up' | 'down' | 'stable';
  /** Last evaluated timestamp */
  computedAt:                 ISODateTime;
}

// ─── XP Summary ────────────────────────────────────────────────────────────────

export interface XPSummary {
  /** Total XP earned */
  totalXP:      number;
  /** Current level */
  level:        number;
  /** XP in current level */
  currentXP:    number;
  /** XP needed for next level */
  nextLevelXP:  number;
  /** Progress to next level (0-100) */
  progress:     number;
}

// ─── Streak Summary ────────────────────────────────────────────────────────────

export interface StreakSummary {
  /** Current streak count */
  currentStreak:   number;
  /** Longest streak count */
  longestStreak:   number;
  /** Last active date */
  lastActiveDate:  ISODate;
  /** Total active days */
  totalActiveDays: number;
  /** Whether streak is active today */
  isActiveToday:   boolean;
  /** Whether streak bonus should be awarded */
  streakBonus:     boolean;
}

// ─── Deadline Summary ──────────────────────────────────────────────────────────

export interface DeadlineSummary {
  /** Deadline as ISO date */
  deadline:             ISODate;
  /** Days remaining until deadline */
  remainingDays:        number;
  /** Estimated completion date */
  estimatedCompletion:  ISODate;
  /** Days between estimated completion and deadline (negative = late) */
  buffer:               number;
  /** Deadline status */
  status:               DeadlineStatus;
  /** Whether user is on track */
  onTrack:              boolean;
}

// ─── Deadline Rescue Summary ───────────────────────────────────────────────────

export interface DeadlineRescueSummary {
  /** Whether rescue mode is active */
  active:                 boolean;
  /** Rescue status */
  status:                 RescueStatus;
  /** Reason for activation */
  reason:                 string;
  /** Days behind schedule */
  daysBehind:             number;
  /** Recovery probability (0-100) */
  recoveryProbability:    number;
  /** Top 3 recovery actions */
  topActions:             string[];
  /** Estimated completion after rescue */
  estimatedCompletion:    ISODate;
  /** Last computed timestamp */
  computedAt:             ISODateTime;
}

// ─── Execution Intelligence Summary ────────────────────────────────────────────

export interface ExecutionIntelligenceSummary {
  /** Overall performance assessment */
  overallPerformance:    string;
  /** Interview readiness score (0-100) */
  interviewReadiness:    number;
  /** Burnout risk level */
  burnoutRisk:           'low' | 'medium' | 'high';
  /** Deadline risk level */
  deadlineRisk:          'low' | 'medium' | 'high';
  /** Top 3 strengths */
  topStrengths:          string[];
  /** Top 3 weaknesses */
  topWeaknesses:         string[];
  /** Top 3 behavior patterns */
  topPatterns:           string[];
  /** Motivational message */
  motivationalMessage:   string;
  /** Last computed timestamp */
  computedAt:            ISODateTime;
}

// ─── Future You Summary ────────────────────────────────────────────────────────

export interface FutureYouSummary {
  /** Whether prediction is available */
  available:                      boolean;
  /** Career narrative summary */
  narrative?:                     string;
  /** Estimated interview confidence (0-100) */
  estimatedInterviewConfidence?:  number;
  /** Internship readiness */
  internshipReadiness?:           boolean;
  /** Top 3 predicted skills */
  topPredictedSkills?:            string[];
  /** Last predicted timestamp */
  predictedAt?:                   ISODateTime;
}

// ─── Quick Actions ─────────────────────────────────────────────────────────────

export interface QuickActions {
  /** Whether "Start Today's Mission" is available */
  canStartMission:      boolean;
  /** Whether "Continue Mission" is available */
  canContinueMission:   boolean;
  /** Whether "View Roadmap" is available */
  canViewRoadmap:       boolean;
  /** Whether "Check Goal Health" is available */
  canCheckGoalHealth:   boolean;
  /** Whether "View Future You" is available */
  canViewFutureYou:     boolean;
  /** Whether "Activate Deadline Rescue" is available */
  canActivateRescue:    boolean;
}

// ─── Progress Summary ──────────────────────────────────────────────────────────

export interface ProgressSummary {
  /** Overall completion percentage (0-100) */
  overallCompletion: number;
  /** Completed tasks */
  completedTasks:    number;
  /** Total tasks */
  totalTasks:        number;
  /** Completed days */
  completedDays:     number;
  /** Completed weeks */
  completedWeeks:    number;
  /** Total weeks */
  totalWeeks:        number;
  /** Achievement count */
  achievementCount:  number;
  /** Consistency rate (0-100) */
  consistencyRate:   number;
}

// ─── Dashboard Meta ────────────────────────────────────────────────────────────

export interface DashboardMeta {
  /** When this dashboard data was generated */
  generatedAt:  ISODateTime;
  /** Whether any data is stale (>24 hours old) */
  hasStaleData: boolean;
  /** List of data sources that failed to load */
  errors:       string[];
}
