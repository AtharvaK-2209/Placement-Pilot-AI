/**
 * @file coveragePlanner.ts
 *
 * Coverage Planning Engine — determines WHICH domains must appear,
 * in what priority order, and with what minimum week guarantee.
 *
 * This is fully deterministic.  Gemini never touches this logic.
 *
 * Inputs:
 *   goalType    — drives mandatory domain selection via domainRules
 *   knownSkills — removes already-mastered domains
 *   weekCount   — trims optional domains when timeline is very tight
 *
 * Output:
 *   CoveragePlan — ordered list of domains to include, with week budgets
 */

import type { GoalType, Skill } from '../../../types/goal';
import type { BlueprintKey }    from '../../../data/blueprints/index';
import { GOAL_PROFILES }        from './domainRules';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DomainCoverage {
  key:          BlueprintKey;
  priority:     number;
  /** Guaranteed minimum weeks this domain must appear in the roadmap. */
  allocatedWeeks: number;
}

export interface CoveragePlan {
  domains:       DomainCoverage[];
  /** Total weeks that must be covered by learning (excludes revision/project/interview). */
  learningWeeks: number;
  /** 1 if ≥ 4 weeks and not Intensive/Extreme, else 0. */
  revisionWeeks: number;
  /** 1 if placement or internship goal, else 0. */
  interviewWeeks: number;
  /** 1 if ≥ 6 weeks, else 0. */
  projectWeeks:  number;
}

// ─── Skill → Blueprint key mapping ───────────────────────────────────────────

const SKILL_TO_BLUEPRINT: Partial<Record<Skill, BlueprintKey>> = {
  'Java':        'java',
  'Spring Boot': 'springboot',
  'SQL':         'sql',
  'DSA':         'dsa',
  'DBMS':        'sql',   // DBMS maps to SQL blueprint
};

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Builds a deterministic coverage plan from the user's goal profile.
 *
 * IMPORTANT — knownSkills semantics:
 *   In the GoalPage UI, "known skills" are chips the user selects to indicate
 *   what they already know.
 *
 *   MANDATORY domains (defined by the goal profile) are ALWAYS included,
 *   regardless of knownSkills. This ensures that core requirements for the
 *   goal (e.g., DSA + Java + SQL for SDE internship) always appear in the
 *   roadmap title and weekly plan.
 *
 *   OPTIONAL domains (e.g., Spring Boot) can be excluded if:
 *     - They appear in knownSkills (user already knows them), OR
 *     - Timeline is tight and execution mode is aggressive
 *
 *   The knownSkills field affects module content depth and practice volume
 *   within the modules (handled by Gemini via promptBuilder), but does NOT
 *   remove mandatory domains from the roadmap structure.
 *
 * @param goalType      - User's selected goal category
 * @param knownSkills   - Skills the user already HAS (affects optional domains only)
 * @param totalWeeks    - Total available weeks from today to deadline
 * @param executionMode - Influences whether optional domains are kept
 */
export function buildCoveragePlan(
  goalType:      GoalType,
  knownSkills:   Skill[],
  totalWeeks:    number,
  executionMode: string,
): CoveragePlan {

  const profile    = GOAL_PROFILES[goalType];
  const isRelaxed  = ['Relaxed', 'Balanced'].includes(executionMode);
  const isAggressive = ['Intensive', 'Extreme'].includes(executionMode);

  // Domains the user already fully knows (entire blueprint can be skipped)
  const masteredKeys = new Set(
    knownSkills
      .map((s) => SKILL_TO_BLUEPRINT[s])
      .filter((k): k is BlueprintKey => k !== undefined),
  );

  // Reserve special weeks first
  const needsInterview = goalType === 'placement' || goalType === 'internship';
  const interviewWeeks = needsInterview && totalWeeks >= 3 ? 1 : 0;
  const projectWeeks   = totalWeeks >= 6 ? 1 : 0;
  const revisionWeeks  = totalWeeks >= 4 && !isAggressive ? 1 : 0;
  const reservedWeeks  = interviewWeeks + projectWeeks + revisionWeeks;
  const learningWeeks  = Math.max(1, totalWeeks - reservedWeeks);

  // Filter domains
  // FIX: Mandatory domains are ALWAYS included regardless of knownSkills
  //      Only optional domains can be filtered based on knownSkills
  let domains = profile.domains.filter((d) => {
    // ALWAYS include mandatory domains (they define the goal's core requirements)
    if (!d.optional) return true;
    // For optional domains, skip if already mastered
    if (masteredKeys.has(d.key)) return false;
    // Drop optional domains when timeline is tight and mode is aggressive
    if (d.optional && isAggressive && learningWeeks <= 4) return false;
    return true;
  });

  // Fallback: never produce an empty plan
  if (domains.length === 0) {
    domains = profile.domains.filter((d) => !d.optional);
  }

  // Sort by priority descending
  domains = [...domains].sort((a, b) => b.priority - a.priority);

  // Distribute learning weeks across domains proportionally to priority
  const totalPriority = domains.reduce((s, d) => s + d.priority, 0);

  const coverageDomains: DomainCoverage[] = domains.map((d) => {
    const proportional = Math.floor((d.priority / totalPriority) * learningWeeks);
    const allocatedWeeks = Math.max(d.minimumWeeks, proportional);
    return { key: d.key, priority: d.priority, allocatedWeeks };
  });

  // Trim over-allocation from optional domains at the back
  let totalAllocated = coverageDomains.reduce((s, d) => s + d.allocatedWeeks, 0);
  for (let i = coverageDomains.length - 1; i >= 0 && totalAllocated > learningWeeks; i--) {
    const domain = profile.domains.find((d) => d.key === coverageDomains[i].key);
    if (domain?.optional) {
      const excess    = totalAllocated - learningWeeks;
      const reducible = coverageDomains[i].allocatedWeeks - (domain.minimumWeeks ?? 1);
      const reduction = Math.min(excess, reducible);
      if (reduction > 0) {
        coverageDomains[i] = {
          ...coverageDomains[i],
          allocatedWeeks: coverageDomains[i].allocatedWeeks - reduction,
        };
        totalAllocated -= reduction;
      }
    }
  }

  // Give spare weeks to the top-priority domain when timeline is relaxed
  if (isRelaxed && totalAllocated < learningWeeks) {
    coverageDomains[0] = {
      ...coverageDomains[0],
      allocatedWeeks: coverageDomains[0].allocatedWeeks + (learningWeeks - totalAllocated),
    };
  }

  return {
    domains:        coverageDomains,
    learningWeeks,
    revisionWeeks,
    interviewWeeks,
    projectWeeks,
  };
}
