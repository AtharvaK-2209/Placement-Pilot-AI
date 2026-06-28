/**
 * @file roadmap.ts — Roadmap Agent (Architecture v2)
 *
 * NEW PIPELINE:
 *   Goal + Analysis
 *     ↓
 *   Coverage Planning Engine  (deterministic — domainRules + coveragePlanner)
 *     ↓
 *   Week Allocation Engine     (deterministic — weekAllocator)
 *     ↓
 *   Prompt Builder             (deterministic — promptBuilder)
 *     ↓
 *   Gemini                     (expands pre-allocated weeks only)
 *     ↓
 *   JSON parse + schema validate
 *     ↓
 *   RoadmapResponse
 *
 * Gemini can no longer decide which subjects to study or in which order.
 * It only fills in concepts, practice items, and focus notes for the
 * weeks that the deterministic engine has already structured.
 */

import { safeGenerateContent }    from './safeGenerate';
import { GENERATION_CONFIG }       from './modelConfig';
import { ROADMAP_SYSTEM_PROMPT }   from '../prompts/roadmapPrompt';
import type { Roadmap, RoadmapResponse } from './schemas/roadmap.schema';
import type { GoalInput }          from '../types/goal';
import type { GoalAnalysis }       from './schemas/goalAnalysis.schema';

// ─── Planner layer ────────────────────────────────────────────────────────────
import { buildCoveragePlan }       from './roadmap/planner/coveragePlanner';
import { allocateWeeks, summariseAllocation } from './roadmap/planner/weekAllocator';
import { buildAllocatedPrompt }    from './roadmap/planner/promptBuilder';

// ─── Token estimator ──────────────────────────────────────────────────────────

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ─── Schema validator ──────────────────────────────────────────────────────────

function validateRoadmap(obj: unknown): string[] {
  const issues: string[] = [];

  if (typeof obj !== 'object' || obj === null) {
    issues.push(`root: expected object, got ${obj === null ? 'null' : typeof obj}`);
    return issues;
  }

  const r = obj as Record<string, unknown>;

  if (typeof r['title'] !== 'string')
    issues.push(`title: expected string, got ${typeof r['title']}`);
  if (typeof r['totalWeeks'] !== 'number')
    issues.push(`totalWeeks: expected number, got ${typeof r['totalWeeks']}`);
  if (typeof r['totalHours'] !== 'number')
    issues.push(`totalHours: expected number, got ${typeof r['totalHours']}`);
  if (typeof r['executionMode'] !== 'string')
    issues.push(`executionMode: expected string, got ${typeof r['executionMode']}`);
  if (typeof r['summary'] !== 'string')
    issues.push(`summary: expected string, got ${typeof r['summary']}`);

  if (!Array.isArray(r['weeks'])) {
    issues.push(`weeks: expected array, got ${typeof r['weeks']}`);
    return issues;
  }

  (r['weeks'] as unknown[]).forEach((w, wi) => {
    if (typeof w !== 'object' || w === null) {
      issues.push(`weeks[${wi}]: expected object, got ${typeof w}`);
      return;
    }
    const week = w as Record<string, unknown>;
    if (typeof week['week'] !== 'number')
      issues.push(`weeks[${wi}].week: expected number, got ${typeof week['week']}`);
    if (typeof week['title'] !== 'string')
      issues.push(`weeks[${wi}].title: expected string, got ${typeof week['title']}`);
    if (typeof week['estimatedHours'] !== 'number')
      issues.push(`weeks[${wi}].estimatedHours: expected number, got ${typeof week['estimatedHours']}`);
    if (!['learning', 'revision', 'project', 'interview'].includes(week['type'] as string))
      issues.push(`weeks[${wi}].type: expected learning|revision|project|interview, got "${String(week['type'])}"`);
    if (!Array.isArray(week['modules']))
      issues.push(`weeks[${wi}].modules: expected array, got ${typeof week['modules']}`);
  });

  return issues;
}

// ─── Main agent function ───────────────────────────────────────────────────────

/**
 * Roadmap Agent — generates a guaranteed multi-domain execution roadmap.
 *
 * Step 1: Coverage planner decides which domains must appear (deterministic).
 * Step 2: Week allocator distributes modules across weeks (deterministic).
 * Step 3: Prompt builder serialises the plan for Gemini (deterministic).
 * Step 4: Gemini expands concepts/practice per week (AI only).
 * Step 5: Parse + validate JSON response.
 *
 * Returns:
 *   { success: true,  data: Roadmap }  — on success
 *   { success: false, data: null }     — on any failure (never throws)
 */
export async function generateRoadmap(
  goal:     GoalInput,
  analysis: GoalAnalysis,
): Promise<RoadmapResponse> {

  // ── Step 1: Compute available weeks ───────────────────────────────────────
  const today      = new Date().toISOString().split('T')[0];
  const deadlineMs = new Date(goal.deadline).getTime() - new Date(today).getTime();
  const totalWeeks = Math.max(1, Math.floor(deadlineMs / (1000 * 60 * 60 * 24 * 7)));

  console.group('[Roadmap] Step 1 — Coverage Planning...');
  let coveragePlan: ReturnType<typeof buildCoveragePlan>;
  try {
    coveragePlan = buildCoveragePlan(
      goal.goalType,
      goal.knownSkills,
      totalWeeks,
      analysis.executionMode,
    );
    console.log('✓ Coverage plan built');
    console.log('  total weeks     :', totalWeeks);
    console.log('  learning weeks  :', coveragePlan.learningWeeks);
    console.log('  revision weeks  :', coveragePlan.revisionWeeks);
    console.log('  project weeks   :', coveragePlan.projectWeeks);
    console.log('  interview weeks :', coveragePlan.interviewWeeks);
    coveragePlan.domains.forEach((d) =>
      console.log(`  domain: ${d.key.padEnd(12)} priority: ${d.priority}  allocatedWeeks: ${d.allocatedWeeks}`),
    );
  } catch (e) {
    console.error('✗ Coverage planning failed:', e);
    console.groupEnd();
    return { success: false, data: null as unknown as Roadmap };
  }
  console.groupEnd();

  // ── Step 2: Week Allocation ────────────────────────────────────────────────
  console.group('[Roadmap] Step 2 — Week Allocation...');
  let allocatedWeeks: ReturnType<typeof allocateWeeks>;
  try {
    // Build the set of module IDs the user already knows (to skip in queues)
    const knownModuleIds = new Set(
      goal.knownSkills.map((s) => s.toLowerCase().replace(/\s+/g, '-')),
    );

    allocatedWeeks = allocateWeeks(coveragePlan, totalWeeks, knownModuleIds);
    summariseAllocation(allocatedWeeks, coveragePlan);

    console.log('✓ Week allocation complete');
    allocatedWeeks.forEach((w) => {
      const slotNames = w.slots.map((s) => `${s.domain}:${s.module.title}`).join(', ');
      console.log(`  Week ${String(w.weekNumber).padStart(2)} [${w.type.padEnd(9)}] ${slotNames || '(special week)'}`);
    });
  } catch (e) {
    console.error('✗ Week allocation failed:', e);
    console.groupEnd();
    return { success: false, data: null as unknown as Roadmap };
  }
  console.groupEnd();

  // ── Step 3: Build prompt ───────────────────────────────────────────────────
  console.group('[Roadmap] Step 3 — Building Prompt...');
  let userPrompt: string;
  try {
    userPrompt = buildAllocatedPrompt(goal, analysis, allocatedWeeks, totalWeeks);
    const userTokens = estimateTokens(userPrompt);
    const sysTokens  = estimateTokens(ROADMAP_SYSTEM_PROMPT);
    console.log('✓ Prompt built');
    console.log('  user prompt   :', userPrompt.length, 'chars,', userTokens, 'est. tokens');
    console.log('  system prompt :', ROADMAP_SYSTEM_PROMPT.length, 'chars,', sysTokens, 'est. tokens');
    console.log('  total est.    :', userTokens + sysTokens, 'tokens');
  } catch (e) {
    console.error('✗ Prompt build failed:', e);
    console.groupEnd();
    return { success: false, data: null as unknown as Roadmap };
  }
  console.groupEnd();

  // ── Step 4: Call Gemini ────────────────────────────────────────────────────
  console.group('[Roadmap] Step 4 — Calling Gemini...');
  let rawText: string;
  try {
    const response = await safeGenerateContent({
      config: {
        systemInstruction: ROADMAP_SYSTEM_PROMPT,
        ...GENERATION_CONFIG,
        maxOutputTokens: 8192,
      },
      contents: [
        { role: 'user', parts: [{ text: userPrompt }] },
      ],
    });

    rawText = response.text ?? '';
    console.log('✓ Gemini responded');
    console.log('  response length:', rawText.length, 'chars');
    console.log('  raw response.text:', rawText);
  } catch (e) {
    console.error('✗ Gemini request failed:', e);
    console.groupEnd();
    return { success: false, data: null as unknown as Roadmap };
  }
  console.groupEnd();

  // ── Step 5: Parse JSON ────────────────────────────────────────────────────
  console.group('[Roadmap] Step 5 — Parsing JSON...');
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  console.log('  cleaned (first 1000 chars):', cleaned.slice(0, 1000));

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
    console.log('✓ JSON.parse succeeded');
  } catch (parseError) {
    console.error('✗ JSON.parse failed:', parseError);
    console.error('  raw text (first 1000 chars):', rawText.slice(0, 1000));
    console.groupEnd();
    return { success: false, data: null as unknown as Roadmap };
  }
  console.groupEnd();

  // ── Step 6: Validate schema ───────────────────────────────────────────────
  console.group('[Roadmap] Step 6 — Validating Schema...');
  const issues = validateRoadmap(parsed);
  if (issues.length > 0) {
    console.warn(`⚠ ${issues.length} schema issue(s) — proceeding anyway (non-fatal):`);
    issues.forEach((issue, i) => console.warn(`  [${i + 1}] ${issue}`));
  } else {
    console.log('✓ Schema validation passed');
  }
  console.groupEnd();

  console.log('[Roadmap] ✓ Roadmap Generated successfully');
  return { success: true, data: parsed as Roadmap };
}
