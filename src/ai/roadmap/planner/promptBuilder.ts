/**
 * @file promptBuilder.ts
 *
 * Converts the deterministic AllocatedWeek[] structure into a
 * Gemini-ready prompt string.
 *
 * Gemini's only job is to fill in concepts and practice items for each
 * pre-allocated module. It cannot change the week structure, module order,
 * or domain coverage — those decisions are already made.
 */

import type { AllocatedWeek }  from './weekAllocator';
import type { GoalInput }      from '../../../types/goal';
import type { GoalAnalysis }   from '../../schemas/goalAnalysis.schema';
import { ROADMAP_JSON_SCHEMA } from '../../../prompts/roadmapPrompt';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function weekTitle(week: AllocatedWeek): string {
  if (week.type === 'revision')  return 'Revision & Consolidation';
  if (week.type === 'project')   return 'Capstone Project';
  if (week.type === 'interview') return 'Interview Preparation';
  const titles = week.slots.map((s) => s.module.title);
  return titles.join(' & ');
}

function hoursHint(week: AllocatedWeek, weeklyHours: number): number {
  if (week.type !== 'learning') return Math.min(weeklyHours, 10);
  return Math.min(weeklyHours + 5, week.slots.reduce((s, sl) => s + sl.module.estimatedHours, 0));
}

// ─── Main builder ─────────────────────────────────────────────────────────────

/**
 * Builds the user-turn prompt that is sent to Gemini.
 *
 * The prompt explicitly tells Gemini:
 *   - The week structure is already decided (do not change it)
 *   - For each week and each allocated module, expand concepts + practice
 *   - Respect the user's skill level, learning style, and execution mode
 */
export function buildAllocatedPrompt(
  goal:      GoalInput,
  analysis:  GoalAnalysis,
  weeks:     AllocatedWeek[],
  totalWeeks: number,
): string {
  const weekDescriptions = weeks
    .map((w) => {
      const base = `Week ${w.weekNumber} [type: ${w.type}]\nTitle: ${weekTitle(w)}\nEstimated Hours: ${hoursHint(w, goal.weeklyHours)}`;

      if (w.type !== 'learning' || w.slots.length === 0) {
        const special =
          w.type === 'revision'  ? 'Review all covered topics. Create summary notes. Attempt mixed practice problems.' :
          w.type === 'project'   ? 'Build an integration project using the skills learned so far.' :
          'Mock interviews, aptitude practice, HR preparation, system design basics.';
        return `${base}\nInstructions: ${special}`;
      }

      const moduleDescs = w.slots
        .map((slot) => {
          const m = slot.module;
          const knownConcepts = m.concepts.slice(0, 2).join(', ');
          return (
            `  Module: ${m.title} (blueprint: ${m.id})\n` +
            `    Base concepts available: ${m.concepts.join(' | ')}\n` +
            `    Base practice available: ${m.practice.join(' | ')}\n` +
            `    Base estimated hours: ${m.estimatedHours}\n` +
            `    Milestone: ${m.milestone}\n` +
            `    Select appropriate subset of concepts and practice for skill level: ${goal.skillLevel}\n` +
            (goal.knownSkills.some((s) => s.toLowerCase().includes(slot.domain))
              ? `    NOTE: User has partial knowledge — reduce concepts (skip: ${knownConcepts})\n`
              : '')
          );
        })
        .join('\n');

      return `${base}\nModules to expand:\n${moduleDescs}`;
    })
    .join('\n\n---\n\n');

  return `
You are expanding a pre-planned execution roadmap.
The week structure, module sequence, and domain coverage are ALREADY DECIDED.
Your ONLY job is to fill in the concepts, practice items, and focus notes for each week.

DO NOT change the week order.
DO NOT add or remove weeks.
DO NOT change which modules appear in which week.
DO NOT add modules from domains not listed in a week.

Return ONLY a valid JSON object matching this schema:

${ROADMAP_JSON_SCHEMA}

--- USER PROFILE ---
Goal: ${goal.goal}
Goal Type: ${goal.goalType}
Skill Level: ${goal.skillLevel}
Known Skills: ${goal.knownSkills.join(', ') || 'None'}
Weekly Hours Available: ${goal.weeklyHours}
Learning Style: ${goal.learningStyle}
Target Company: ${goal.targetCompany ?? 'Not specified'}
Execution Mode: ${analysis.executionMode}
Recommended Weekly Hours: ${analysis.recommendedWeeklyHours}

--- PRE-ALLOCATED WEEK PLAN (${totalWeeks} weeks total) ---
${weekDescriptions}

--- ROADMAP METADATA ---
title: Build a title like "Amazon SDE Internship — ${totalWeeks}-Week Roadmap"
totalWeeks: ${totalWeeks}
totalHours: compute from sum of week estimatedHours
executionMode: ${analysis.executionMode}
summary: Write a 1–2 sentence strategy summary

Intensity guidance:
- Execution Mode "${analysis.executionMode}" — ${
    analysis.executionMode === 'Intensive' || analysis.executionMode === 'Extreme'
      ? 'reduce concept depth, keep only highest-priority practice items, maximize weekly hours'
      : analysis.executionMode === 'Relaxed'
      ? 'expand concept depth, add extra practice, include tips and resources'
      : 'balanced depth, standard practice count'
  }
`.trim();
}
