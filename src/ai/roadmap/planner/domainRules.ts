/**
 * @file domainRules.ts
 *
 * Mandatory domain coverage rules per goal type.
 *
 * These mappings are PlacementPilot's product decisions — not AI decisions.
 * Adding a new goal profile requires only adding an entry here.
 * No other file needs to change.
 */

import type { BlueprintKey } from '../../../data/blueprints/index';
import type { GoalType }     from '../../../types/goal';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DomainRule {
  /** Blueprint key as registered in the blueprint registry. */
  key: BlueprintKey;

  /**
   * Scheduling priority — higher = scheduled earlier and given more weeks.
   * Range: 1–10.
   */
  priority: number;

  /**
   * Minimum number of weeks this domain MUST appear in.
   * The week allocator will never produce a roadmap that violates this.
   */
  minimumWeeks: number;

  /**
   * Whether this domain is optional when the deadline is very tight.
   * Mandatory domains (false) are always included regardless of timeline.
   */
  optional: boolean;
}

export interface GoalProfile {
  /** Human-readable label shown in logs. */
  label: string;
  domains: DomainRule[];
}

// ─── Goal Profiles ────────────────────────────────────────────────────────────

/**
 * Profiles for v1.  Keys align with GoalType union from types/goal.ts.
 * 'placement' and 'internship' share the SDE profile.
 * 'upskill' and 'career-switch' fall back to a generic Java backend profile.
 */
export const GOAL_PROFILES: Record<GoalType, GoalProfile> = {

  placement: {
    label: 'SDE Placement',
    domains: [
      { key: 'dsa',        priority: 10, minimumWeeks: 4, optional: false },
      { key: 'java',       priority: 9,  minimumWeeks: 2, optional: false },
      { key: 'sql',        priority: 7,  minimumWeeks: 1, optional: false },
      { key: 'springboot', priority: 5,  minimumWeeks: 1, optional: true  },
    ],
  },

  internship: {
    label: 'SDE Internship',
    domains: [
      { key: 'dsa',        priority: 10, minimumWeeks: 3, optional: false },
      { key: 'java',       priority: 9,  minimumWeeks: 2, optional: false },
      { key: 'sql',        priority: 7,  minimumWeeks: 1, optional: false },
      { key: 'springboot', priority: 5,  minimumWeeks: 1, optional: true  },
    ],
  },

  upskill: {
    label: 'Backend Upskill',
    domains: [
      { key: 'java',       priority: 10, minimumWeeks: 2, optional: false },
      { key: 'springboot', priority: 9,  minimumWeeks: 2, optional: false },
      { key: 'sql',        priority: 8,  minimumWeeks: 1, optional: false },
      { key: 'dsa',        priority: 5,  minimumWeeks: 1, optional: true  },
    ],
  },

  'career-switch': {
    label: 'Career Switch to SDE',
    domains: [
      { key: 'java',       priority: 10, minimumWeeks: 2, optional: false },
      { key: 'dsa',        priority: 9,  minimumWeeks: 3, optional: false },
      { key: 'sql',        priority: 8,  minimumWeeks: 1, optional: false },
      { key: 'springboot', priority: 6,  minimumWeeks: 1, optional: true  },
    ],
  },
};
