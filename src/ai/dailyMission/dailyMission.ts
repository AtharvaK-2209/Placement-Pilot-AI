/**
 * @file dailyMission.ts — Daily Mission Agent
 *
 * Public API:
 *   generateDailyMission(input: DailyMissionInput): Promise<DailyMissionResponse>
 *
 * This function is the ONLY export of this module.
 * All internal logic (prompt building, validation) is private.
 *
 * Reuse contract:
 *   Any future agent or UI component that needs today's mission
 *   should import and call generateDailyMission() — never inline this logic.
 *
 * Consumers:
 *   • DailyMissionPage       — renders today's mission
 *   • Progress Tracking Agent (future) — reads tasks for completion tracking
 *   • Replanning Agent        (future) — regenerates after missed days
 */

import { safeGenerateContent }        from '../safeGenerate';
import { GENERATION_CONFIG }           from '../modelConfig';
import {
  DAILY_MISSION_SYSTEM_PROMPT,
  DAILY_MISSION_JSON_SCHEMA,
} from './dailyMissionPrompt';
import type {
  DailyMission,
  DailyMissionInput,
  DailyMissionResponse,
  MissionTask,
} from './dailyMission.schema';
import type { RoadmapModule }          from '../schemas/roadmap.schema';

// ─── Prompt builder ────────────────────────────────────────────────────────────

function buildDailyMissionPrompt(input: DailyMissionInput): string {
  const { week, dayNumber, executionMode, weeklyHours } = input;

  // Per-day hour budget — assume 5 active study days per week
  const dailyBudget = Math.round((weeklyHours / 5) * 10) / 10;

  // Compact module block: only the fields Gemini needs to select tasks from
  const moduleBlock = week.modules
    .map((m: RoadmapModule) =>
      `[${m.title}]\n` +
      `concepts: ${m.concepts.join(' | ')}\n` +
      `practice: ${m.practice.join(' | ')}\n` +
      `milestone: ${m.milestone}`,
    )
    .join('\n\n');

  return [
    `Return JSON matching this schema exactly:`,
    DAILY_MISSION_JSON_SCHEMA,
    ``,
    `WEEK ${week.week}: ${week.title} (${week.type}) — ${week.estimatedHours}h total`,
    week.focusNote ? `note: ${week.focusNote}` : '',
    `DAY ${dayNumber}/7 | budget: ${dailyBudget}h | mode: ${executionMode}`,
    ``,
    `MODULES:`,
    moduleBlock,
  ]
    .filter(Boolean)
    .join('\n');
}

// ─── Schema validator ──────────────────────────────────────────────────────────

function validateMission(obj: unknown): string[] {
  const issues: string[] = [];
  if (typeof obj !== 'object' || obj === null) {
    issues.push(`root: expected object, got ${typeof obj}`);
    return issues;
  }
  const m = obj as Record<string, unknown>;

  if (typeof m['title'] !== 'string')
    issues.push(`title: expected string, got ${typeof m['title']}`);
  if (typeof m['estimatedHours'] !== 'number')
    issues.push(`estimatedHours: expected number, got ${typeof m['estimatedHours']}`);
  if (typeof m['milestone'] !== 'string')
    issues.push(`milestone: expected string, got ${typeof m['milestone']}`);

  for (const field of ['learningTasks', 'practiceTasks', 'revisionTasks']) {
    if (!Array.isArray(m[field]))
      issues.push(`${field}: expected array, got ${typeof m[field]}`);
  }

  // Validate individual tasks
  const allTaskFields = ['learningTasks', 'practiceTasks', 'revisionTasks'] as const;
  for (const field of allTaskFields) {
    const tasks = m[field] as unknown[];
    if (!Array.isArray(tasks)) continue;
    tasks.forEach((t, i) => {
      if (typeof t !== 'object' || t === null) {
        issues.push(`${field}[${i}]: expected object`);
        return;
      }
      const task = t as Record<string, unknown>;
      if (typeof task['title'] !== 'string')
        issues.push(`${field}[${i}].title: expected string, got ${typeof task['title']}`);
      if (typeof task['estimatedMinutes'] !== 'number')
        issues.push(`${field}[${i}].estimatedMinutes: expected number, got ${typeof task['estimatedMinutes']}`);
    });
  }

  return issues;
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Generates a daily execution mission from one roadmap week.
 *
 * This is the single public function of the Daily Mission Agent.
 * Call this from any component or future agent that needs today's plan.
 *
 * @param input — week, dayNumber, executionMode, weeklyHours
 * @returns     — DailyMissionResponse { success, data }
 *
 * Never throws — all errors are caught and returned as { success: false }.
 */
export async function generateDailyMission(
  input: DailyMissionInput,
): Promise<DailyMissionResponse> {

  // ── Step 1: Build prompt ───────────────────────────────────────────────────
  console.group('[DailyMission] Step 1 — Building Prompt...');
  let userPrompt: string;
  try {
    userPrompt = buildDailyMissionPrompt(input);
    console.log('✓ Prompt built');
    console.log('  week         :', input.week.week, '—', input.week.title);
    console.log('  day          :', input.dayNumber);
    console.log('  executionMode:', input.executionMode);
    console.log('  weeklyHours  :', input.weeklyHours);
    console.log('  prompt length:', userPrompt.length, 'chars');
  } catch (e) {
    console.error('✗ Prompt build failed:', e);
    console.groupEnd();
    return { success: false, data: null as unknown as DailyMission };
  }
  console.groupEnd();

  // ── Step 2: Call Gemini ────────────────────────────────────────────────────
  console.group('[DailyMission] Step 2 — Calling Gemini...');
  let rawText: string;
  try {
    const response = await safeGenerateContent({
      config: {
        systemInstruction: DAILY_MISSION_SYSTEM_PROMPT,
        ...GENERATION_CONFIG,
        maxOutputTokens: 2048,
      },
      contents: [
        { role: 'user', parts: [{ text: userPrompt }] },
      ],
    });

    rawText = response.text ?? '';
    console.log('✓ Gemini responded —', rawText.length, 'chars');
  } catch (e) {
    console.error('✗ Gemini request failed:', e);
    console.groupEnd();
    return { success: false, data: null as unknown as DailyMission };
  }
  console.groupEnd();

  // ── Step 3: Parse JSON ────────────────────────────────────────────────────
  console.group('[DailyMission] Step 3 — Parsing JSON...');
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
    console.log('✓ JSON.parse succeeded');
  } catch (parseError) {
    console.error('✗ JSON.parse failed:', parseError);
    console.error('  raw text (first 800 chars):', rawText.slice(0, 800));
    console.groupEnd();
    return { success: false, data: null as unknown as DailyMission };
  }
  console.groupEnd();

  // ── Step 4: Validate ──────────────────────────────────────────────────────
  console.group('[DailyMission] Step 4 — Validating Schema...');
  const issues = validateMission(parsed);
  if (issues.length > 0) {
    console.warn(`⚠ ${issues.length} schema issue(s) — proceeding anyway:`);
    issues.forEach((issue, i) => console.warn(`  [${i + 1}] ${issue}`));
  } else {
    console.log('✓ Schema validation passed');
  }
  console.groupEnd();

  console.log('[DailyMission] ✓ Mission generated successfully');
  return { success: true, data: parsed as DailyMission };
}

// ─── Task helpers (exported for UI use) ───────────────────────────────────────

/** Returns all tasks from a mission as a flat array, ordered: learning → practice → revision. */
export function allTasks(mission: DailyMission): MissionTask[] {
  return [
    ...mission.learningTasks,
    ...mission.practiceTasks,
    ...mission.revisionTasks,
  ];
}

/** Formats estimatedMinutes as a human-readable string. Example: 90 → "1h 30min" */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}
