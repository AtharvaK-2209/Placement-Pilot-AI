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
};

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Builds a deterministic coverage plan from the user's goal profile.
 *
 * @param goalType      - User's selected goal category
 * @param knownSkills   - Skills the user already has (may skip domains)
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
  let domains = profile.domains.filter((d) => {
    // Skip fully mastered domains
    if (masteredKeys.has(d.key)) return false;
    // Drop optional domains when timeline is tight and mode is aggressive
    if (d.optional && isAggressive && learningWeeks <= 4) return false;
    return true;
  });

  // If we somehow have no domains, fall back to mandatory ones ignoring mastery
  if (domains.length === 0) {
    domains = profile.domains.filter((d) => !d.optional);
  }

  // Sort by priority descending
  domains = [...domains].sort((a, b) => b.priority - a.priority);

  // Distribute learning weeks across domains proportionally to priority
  const totalPriority = domains.reduce((s, d) => s + d.priority, 0);

  const coverageDomains: DomainCoverage[] = domains.map((d) => {
    // Proportional share, floored, but never below minimumWeeks
    const proportional = Math.floor((d.priority / totalPriority) * learningWeeks);
    const allocatedWeeks = Math.max(d.minimumWeeks, proportional);
    return { key: d.key, priority: d.priority, allocatedWeeks };
  });

  // If total allocated > learning weeks, trim optional domains from the back
  let totalAllocated = coverageDomains.reduce((s, d) => s + d.allocatedWeeks, 0);
  for (let i = coverageDomains.length - 1; i >= 0 && totalAllocated > learningWeeks; i--) {
    const domain = profile.domains.find((d) => d.key === coverageDomains[i].key);
    if (domain?.optional) {
      const excess = totalAllocated - learningWeeks;
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

  // If relaxed and we have spare weeks, give extra to the top-priority domain
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
