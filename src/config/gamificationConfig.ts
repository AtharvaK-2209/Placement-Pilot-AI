/**
 * @file gamificationConfig.ts
 *
 * Configuration for the gamification system.
 * Defines level thresholds, badge definitions, and milestone templates.
 *
 * ── PHASE 10 ─────────────────────────────────────────────────────────
 * Backend-only gamification configuration.
 * UI components import from here to render levels, badges, and milestones.
 * ─────────────────────────────────────────────────────────────────────
 */

import type { Badge, Milestone, LevelThreshold } from '../types/domain';

// ─── Level Configuration ──────────────────────────────────────────────────────

/**
 * Level thresholds — XP required to reach each level.
 * Each level requires progressively more XP.
 */
export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1,  xpRequired: 0,     title: 'Beginner' },
  { level: 2,  xpRequired: 500,   title: 'Beginner' },
  { level: 3,  xpRequired: 1200,  title: 'Beginner' },
  { level: 4,  xpRequired: 2000,  title: 'Intermediate' },
  { level: 5,  xpRequired: 3000,  title: 'Intermediate' },
  { level: 6,  xpRequired: 4500,  title: 'Intermediate' },
  { level: 7,  xpRequired: 6500,  title: 'Advanced' },
  { level: 8,  xpRequired: 9000,  title: 'Advanced' },
  { level: 9,  xpRequired: 12000, title: 'Expert' },
  { level: 10, xpRequired: 15500, title: 'Expert' },
  { level: 11, xpRequired: 20000, title: 'Master' },
  { level: 12, xpRequired: 25000, title: 'Master' },
  { level: 13, xpRequired: 30000, title: 'Legend' },
  { level: 14, xpRequired: 36000, title: 'Legend' },
  { level: 15, xpRequired: 43000, title: 'Legend' },
];

// ─── Badge Definitions ────────────────────────────────────────────────────────

/**
 * All available badges.
 * Badges start locked and are unlocked by the BadgeService.
 */
export const BADGE_DEFINITIONS: Omit<Badge, 'locked' | 'unlockedAt'>[] = [
  // Milestone badges
  {
    id: 'first-mission',
    title: 'First Mission',
    description: 'Complete your first daily mission',
    icon: '🎯',
    category: 'milestone',
  },
  {
    id: 'roadmap-completed',
    title: 'Roadmap Master',
    description: 'Complete your entire roadmap',
    icon: '🏆',
    category: 'milestone',
  },
  {
    id: 'future-you-generated',
    title: 'Time Traveler',
    description: 'Generate your Future You simulation',
    icon: '🔮',
    category: 'milestone',
  },
  {
    id: 'deadline-survivor',
    title: 'Deadline Survivor',
    description: 'Successfully recover from being behind schedule',
    icon: '⏰',
    category: 'milestone',
  },
  {
    id: 'goal-analysis-complete',
    title: 'Strategic Planner',
    description: 'Complete goal analysis',
    icon: '📊',
    category: 'milestone',
  },

  // Streak badges
  {
    id: '7-day-streak',
    title: '7 Day Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    category: 'streak',
  },
  {
    id: '14-day-streak',
    title: '2 Week Champion',
    description: 'Maintain a 14-day streak',
    icon: '💪',
    category: 'streak',
  },
  {
    id: '30-day-streak',
    title: 'Monthly Legend',
    description: 'Maintain a 30-day streak',
    icon: '⚡',
    category: 'streak',
  },
  {
    id: '100-day-streak',
    title: 'Century Master',
    description: 'Maintain a 100-day streak',
    icon: '🌟',
    category: 'streak',
  },

  // Completion badges
  {
    id: '10-tasks-complete',
    title: 'Getting Started',
    description: 'Complete 10 tasks',
    icon: '✅',
    category: 'completion',
  },
  {
    id: '50-tasks-complete',
    title: 'Task Master',
    description: 'Complete 50 tasks',
    icon: '📝',
    category: 'completion',
  },
  {
    id: '100-tasks-complete',
    title: 'Century Club',
    description: 'Complete 100 tasks',
    icon: '💯',
    category: 'completion',
  },
  {
    id: '250-tasks-complete',
    title: 'Elite Performer',
    description: 'Complete 250 tasks',
    icon: '🎖️',
    category: 'completion',
  },
  {
    id: '500-tasks-complete',
    title: 'Legendary',
    description: 'Complete 500 tasks',
    icon: '👑',
    category: 'completion',
  },

  // Special badges
  {
    id: 'first-week-complete',
    title: 'Week One Champion',
    description: 'Complete your first week',
    icon: '🎉',
    category: 'special',
  },
  {
    id: 'level-10-reached',
    title: 'Level 10 Hero',
    description: 'Reach level 10',
    icon: '🌠',
    category: 'special',
  },
  {
    id: 'perfect-week',
    title: 'Perfect Week',
    description: 'Complete all 7 days in a week',
    icon: '⭐',
    category: 'special',
  },
  {
    id: 'execution-intelligence',
    title: 'Intelligence Unlocked',
    description: 'Use Execution Intelligence feature',
    icon: '🧠',
    category: 'special',
  },
];

// ─── Milestone Definitions ────────────────────────────────────────────────────

/**
 * All available milestones.
 * Milestones track major journey events and unlock badges.
 */
export const MILESTONE_DEFINITIONS: Omit<Milestone, 'unlocked' | 'unlockedAt'>[] = [
  {
    id: 'first-login',
    title: 'First Login',
    description: 'Welcome to PlacementPilot AI!',
    icon: '👋',
  },
  {
    id: 'goal-analysis-complete',
    title: 'Goal Analyzed',
    description: 'Completed goal analysis',
    icon: '📊',
  },
  {
    id: 'roadmap-generated',
    title: 'Roadmap Created',
    description: 'Generated your personalized roadmap',
    icon: '🗺️',
  },
  {
    id: 'first-mission-complete',
    title: 'First Mission Complete',
    description: 'Completed your first daily mission',
    icon: '🎯',
  },
  {
    id: 'first-week-complete',
    title: 'First Week Done',
    description: 'Completed your first week',
    icon: '📅',
  },
  {
    id: 'future-you-generated',
    title: 'Future Simulated',
    description: 'Generated your Future You projection',
    icon: '🔮',
  },
  {
    id: 'deadline-rescue-used',
    title: 'Deadline Rescue',
    description: 'Used Deadline Rescue to get back on track',
    icon: '⏰',
  },
  {
    id: 'execution-intelligence-used',
    title: 'Intelligence Activated',
    description: 'Used Execution Intelligence',
    icon: '🧠',
  },
  {
    id: 'roadmap-complete',
    title: 'Roadmap Completed',
    description: 'Completed your entire roadmap!',
    icon: '🏆',
  },
];

// ─── Weekly Goal Configuration ────────────────────────────────────────────────

/**
 * Weekly goal targets based on execution mode.
 * Auto-generated at the start of each week.
 */
export const WEEKLY_GOAL_TARGETS = {
  missions: 5,  // Complete 5 missions per week
  xp: 500,      // Earn 500 XP per week
};

/**
 * Helper to get the start and end dates for a given week (Monday-Sunday).
 */
export function getWeekBounds(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  
  const monday = new Date(d.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
}
