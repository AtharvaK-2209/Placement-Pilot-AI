/**
 * @file dynamicReplanning.ts — Dynamic Replanning Agent
 *
 * Public API:
 *   replanRoadmap(input, uid?) → Promise<ReplanResponse>
 *
 * Architecture:
 *   1. Build compact user-turn prompt from ReplanInput (deterministic)
 *   2. Call Gemini via safeGenerateContent() (primary → fallback)
 *   3. Parse + validate JSON response
 *   4. Persist ReplanResult to Firestore users/{uid}/replanningHistory/{id}
 *      (only when uid is provided — skipped for unauthenticated users)
 *   5. Return ReplanResponse { success, data }
 *
 * Never throws. All errors are caught and returned as { success: false }.
 * Does NOT touch Goal Analysis, Roadmap generation, or Daily Mission logic.
 */

import { safeGenerateContent }      from './safeGenerate';
import { GENERATION_CONFIG }         from './modelConfig';
import {
  DYNAMIC_REPLANNING_SYSTEM_PROMPT,
  DYNAMIC_REPLANNING_JSON_SCHEMA,
} from '../prompts/dynamicReplanningPrompt';
import type {
  ReplanInput,
  ReplanResult,
  ReplanResponse,
} from './schemas/dynamicReplanning.schema';
import type { Roadmap }              from '../types/domain';

// Firestore — only imported for persistence; never used by AI logic
import { db }                        from '../config/firebase';
import { collection, doc, setDoc }   from 'firebase/firestore';

// ─── Firestore path ────────────────────────────────────────────────────────────

const replanHistoryPath = (uid: string) => `users/${uid}/replanningHistory`;

// ─── Prompt builder ────────────────────────────────────────────────────────────

function buildUserPrompt(input: ReplanInput): string {
  // Compact roadmap summary — only remaining (incomplete) weeks
  const remainingWeeks = input.currentRoadmap.weeks
    .slice(input.completedWeeks)
    .map((w) => {
      const modules = w.modules.map((m) =>
        `  [${m.title}] ${m.concepts.slice(0, 3).join(', ')} | est: ${m.estimatedHours}h`,
      ).join('\n');
      return `Week ${w.week} (${w.type}): ${w.title}\n${modules}`;
    })
    .join('\n\n');

  return [
    `Return JSON matching this schema:`,
    DYNAMIC_REPLANNING_JSON_SCHEMA,
    ``,
    `GOAL: ${input.goalText} (${input.goalType})`,
    `DEADLINE: ${input.deadline} | REMAINING DAYS: ${input.remainingDays}`,
    `WEEKLY HOURS: ${input.weeklyHours} | EXECUTION MODE: ${input.executionMode}`,
    ``,
    `PROGRESS: ${input.completedWeeks}/${input.totalWeeks} weeks done (${input.overallCompletionPct}%)`,
    `XP: ${input.totalXP} | STREAK: ${input.currentStreak} days`,
    `TRIGGER: ${input.triggerReason ?? 'manual'}`,
    ``,
    `STRENGTHS: ${input.strengths.join(', ')}`,
    `SKILL GAPS: ${input.skillGaps.join(', ')}`,
    ``,
    `REMAINING ROADMAP (${input.totalWeeks - input.completedWeeks} weeks left):`,
    remainingWeeks,
    ``,
    `Produce an updated roadmap using at most ${input.remainingDays > 0 ? Math.floor(input.remainingDays / 7) : 1} weeks.`,
  ]
    .filter((line) => line !== undefined)
    .join('\n');
}

// ─── Schema validator ──────────────────────────────────────────────────────────

function validateReplanResult(obj: unknown): string[] {
  const issues: string[] = [];
  if (typeof obj !== 'object' || obj === null) {
    issues.push(`root: expected object, got ${typeof obj}`);
    return issues;
  }
  const r = obj as Record<string, unknown>;

  if (typeof r['reason'] !== 'string')
    issues.push(`reason: expected string`);
  if (!['low', 'moderate', 'high', 'critical'].includes(r['riskLevel'] as string))
    issues.push(`riskLevel: expected low|moderate|high|critical, got "${String(r['riskLevel'])}"`);
  if (typeof r['recommendedWeeklyHours'] !== 'string')
    issues.push(`recommendedWeeklyHours: expected string`);
  if (!Array.isArray(r['changes']))
    issues.push(`changes: expected array`);
  if (!Array.isArray(r['priorityAdjustments']))
    issues.push(`priorityAdjustments: expected array`);

  const roadmap = r['updatedRoadmap'] as Record<string, unknown> | undefined;
  if (!roadmap || typeof roadmap !== 'object') {
    issues.push(`updatedRoadmap: expected object`);
  } else {
    if (typeof roadmap['title'] !== 'string') issues.push(`updatedRoadmap.title: expected string`);
    if (typeof roadmap['totalWeeks'] !== 'number') issues.push(`updatedRoadmap.totalWeeks: expected number`);
    if (!Array.isArray(roadmap['weeks'])) issues.push(`updatedRoadmap.weeks: expected array`);
  }

  return issues;
}

// ─── Firestore persistence ─────────────────────────────────────────────────────

async function persistReplanHistory(
  uid:    string,
  input:  ReplanInput,
  result: ReplanResult,
): Promise<void> {
  try {
    const id      = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const ref     = doc(collection(db, replanHistoryPath(uid)), id);
    const entry = {
      id,
      triggeredAt:           new Date().toISOString(),
      reason:                result.reason,
      riskLevel:             result.riskLevel,
      changes:               result.changes,
      priorityAdjustments:   result.priorityAdjustments,
      recommendedWeeklyHours: result.recommendedWeeklyHours,
      triggerReason:         input.triggerReason ?? 'manual',
      completedWeeks:        input.completedWeeks,
      totalWeeks:            input.totalWeeks,
      overallCompletionPct:  input.overallCompletionPct,
      // Store a snapshot of the new roadmap title + totalWeeks (not the full roadmap)
      updatedRoadmapTitle:   result.updatedRoadmap.title,
      updatedRoadmapWeeks:   result.updatedRoadmap.totalWeeks,
    };
    await setDoc(ref, entry);
    console.log(`[dynamicReplanning] ✓ Persisted replan history entry: ${id}`);
  } catch (e) {
    // Persistence failure is non-fatal — the replanning result is still returned
    console.error('[dynamicReplanning] Failed to persist history:', e);
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Dynamic Replanning Agent — produces an updated roadmap from current context.
 *
 * @param input  ReplanInput assembled from router state + repository reads.
 * @param uid    Firebase Auth user id. If provided, result is persisted to Firestore.
 *
 * Returns:
 *   { success: true,  data: ReplanResult }  — on success
 *   { success: false, data: null }           — on any failure (never throws)
 */
export async function replanRoadmap(
  input: ReplanInput,
  uid?:  string,
): Promise<ReplanResponse> {

  // ── Step 1: Build prompt ───────────────────────────────────────────────────
  console.group('[dynamicReplanning] Step 1 — Building Prompt...');
  let userPrompt: string;
  try {
    userPrompt = buildUserPrompt(input);
    console.log('✓ Prompt built:', userPrompt.length, 'chars, ~', Math.ceil(userPrompt.length / 4), 'tokens');
  } catch (e) {
    console.error('✗ Prompt build failed:', e);
    console.groupEnd();
    return { success: false, data: null as unknown as ReplanResult };
  }
  console.groupEnd();

  // ── Step 2: Call Gemini ────────────────────────────────────────────────────
  console.group('[dynamicReplanning] Step 2 — Calling Gemini...');
  let rawText: string;
  try {
    const response = await safeGenerateContent({
      config: {
        systemInstruction: DYNAMIC_REPLANNING_SYSTEM_PROMPT,
        ...GENERATION_CONFIG,
        maxOutputTokens: 8192,
      },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    });
    rawText = response.text ?? '';
    console.log('✓ Gemini responded:', rawText.length, 'chars');
  } catch (e) {
    console.error('✗ Gemini request failed:', e);
    console.groupEnd();
    return { success: false, data: null as unknown as ReplanResult };
  }
  console.groupEnd();

  // ── Step 3: Parse JSON ────────────────────────────────────────────────────
  console.group('[dynamicReplanning] Step 3 — Parsing JSON...');
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
    console.error('  raw (first 800):', rawText.slice(0, 800));
    console.groupEnd();
    return { success: false, data: null as unknown as ReplanResult };
  }
  console.groupEnd();

  // ── Step 4: Validate schema ───────────────────────────────────────────────
  console.group('[dynamicReplanning] Step 4 — Validating Schema...');
  const issues = validateReplanResult(parsed);
  if (issues.length > 0) {
    console.warn(`⚠ ${issues.length} schema issue(s) — proceeding anyway:`);
    issues.forEach((i, n) => console.warn(`  [${n + 1}] ${i}`));
  } else {
    console.log('✓ Schema validation passed');
  }
  console.groupEnd();

  const result = parsed as ReplanResult;

  // Ensure generatedAt is set on the updated roadmap
  (result.updatedRoadmap as Roadmap).generatedAt = new Date().toISOString();

  // ── Step 5: Persist to Firestore ──────────────────────────────────────────
  if (uid) {
    await persistReplanHistory(uid, input, result);
  }

  console.log('[dynamicReplanning] ✓ Replanning complete');
  return { success: true, data: result };
}

// ─── Type re-exports (convenience) ───────────────────────────────────────────
export type {
  ReplanInput,
  ReplanResult,
  ReplanResponse,
  RoadmapChange,
  PriorityAdjustment,
  ReplanRiskLevel,
} from './schemas/dynamicReplanning.schema';
