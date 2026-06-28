/**
 * @file weekAllocator.ts
 *
 * Week Allocation Engine — deterministically distributes blueprint modules
 * across numbered weeks, interleaving domains so every week contains
 * content from multiple subjects.
 *
 * This is fully deterministic. Gemini never touches this logic.
 *
 * Output is a structured AllocatedWeek[] that the prompt builder converts
 * into a Gemini-ready string.  Gemini then only fills in concepts/practice
 * for the pre-allocated modules — it cannot change the week structure.
 */

import type { BlueprintKey } from '../../../data/blueprints/index';
import type { CoveragePlan, DomainCoverage }  from './coveragePlanner';
import { BLUEPRINTS }                          from '../../../data/blueprints/index';
import type { BlueprintModule }                from '../../../data/blueprints/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AllocatedSlot {
  /** Blueprint domain this slot belongs to. */
  domain:    BlueprintKey;
  /** The specific module from that blueprint. */
  module:    BlueprintModule;
}

export interface AllocatedWeek {
  /** 1-indexed week number. */
  weekNumber: number;
  /** Week type — drives UI badge and Gemini instructions. */
  type: 'learning' | 'revision' | 'project' | 'interview';
  /** Slots for this week (1–3 modules from different domains). */
  slots: AllocatedSlot[];
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Allocates blueprint modules across weeks using a round-robin interleave
 * strategy. Each learning week receives modules from multiple domains,
 * weighted by the domain's allocatedWeeks share.
 *
 * @param plan       - Coverage plan from coveragePlanner
 * @param knownIds   - Set of module ids the user already knows (to skip)
 */
export function allocateWeeks(
  plan:       CoveragePlan,
  _totalWeeks: number,
  knownIds:   Set<string>,
): AllocatedWeek[] {
  const weeks: AllocatedWeek[] = [];
  let weekNum = 1;

  // ── Build module queues per domain (respecting blueprint order) ────────────
  const queues = new Map<BlueprintKey, BlueprintModule[]>();
  for (const dc of plan.domains) {
    const allModules = BLUEPRINTS[dc.key] ?? [];
    // Filter out already-known modules while preserving order
    const remaining = allModules.filter((m) => !knownIds.has(m.id));
    queues.set(dc.key, remaining);
  }

  // ── Interleave: distribute modules across learning weeks ──────────────────
  //
  // Strategy: for each learning week, pick at most 2 slots from different
  // domains, cycling through domains in priority order.
  // This guarantees every domain appears regularly rather than one domain
  // consuming all weeks before the next one starts.

  const domainOrder = plan.domains.map((d) => d.key);

  // Track how many weeks each domain has already received
  const weekCountPerDomain = new Map<BlueprintKey, number>(
    domainOrder.map((k) => [k, 0]),
  );

  for (let w = 0; w < plan.learningWeeks; w++) {
    const slots: AllocatedSlot[] = [];

    // Pick up to 2 domains for this week — choose the ones most behind
    // relative to their allocation budget
    const eligibleDomains = domainOrder
      .filter((key) => {
        const q = queues.get(key);
        return q && q.length > 0;
      })
      .sort((a, b) => {
        // Prioritise domain furthest behind its allocation
        const dcA  = plan.domains.find((d) => d.key === a)!;
        const dcB  = plan.domains.find((d) => d.key === b)!;
        const ratioA = (weekCountPerDomain.get(a) ?? 0) / dcA.allocatedWeeks;
        const ratioB = (weekCountPerDomain.get(b) ?? 0) / dcB.allocatedWeeks;
        return ratioA - ratioB;
      });

    const slotsPerWeek = plan.learningWeeks <= 4 ? 2 : 2; // max 2 domains/week
    const chosen = eligibleDomains.slice(0, slotsPerWeek);

    for (const key of chosen) {
      const queue = queues.get(key)!;
      if (queue.length === 0) continue;

      const module = queue.shift()!;
      slots.push({ domain: key, module });
      weekCountPerDomain.set(key, (weekCountPerDomain.get(key) ?? 0) + 1);
    }

    if (slots.length > 0) {
      weeks.push({ weekNumber: weekNum++, type: 'learning', slots });
    }
  }

  // ── Special weeks (always at the end, in this order) ──────────────────────
  if (plan.revisionWeeks > 0) {
    weeks.push({ weekNumber: weekNum++, type: 'revision', slots: [] });
  }
  if (plan.projectWeeks > 0) {
    weeks.push({ weekNumber: weekNum++, type: 'project', slots: [] });
  }
  if (plan.interviewWeeks > 0) {
    weeks.push({ weekNumber: weekNum++, type: 'interview', slots: [] });
  }

  return weeks;
}

// ─── Coverage summary (for logging) ──────────────────────────────────────────

export function summariseAllocation(
  weeks: AllocatedWeek[],
  plan:  CoveragePlan,
): void {
  console.group('[WeekAllocator] Allocation summary');
  const domainWeekCount = new Map<BlueprintKey, number>();
  weeks.forEach((w) => {
    if (w.type === 'learning') {
      w.slots.forEach(({ domain }) => {
        domainWeekCount.set(domain, (domainWeekCount.get(domain) ?? 0) + 1);
      });
    }
  });

  plan.domains.forEach((dc: DomainCoverage) => {
    const actual = domainWeekCount.get(dc.key) ?? 0;
    const status = actual >= dc.allocatedWeeks ? '✓' : '⚠';
    console.log(
      `  ${status} ${dc.key.padEnd(12)} allocated: ${dc.allocatedWeeks}  actual: ${actual}`,
    );
  });

  const special = weeks.filter((w) => w.type !== 'learning');
  special.forEach((w) =>
    console.log(`  ✓ week ${w.weekNumber} — ${w.type}`),
  );
  console.groupEnd();
}
