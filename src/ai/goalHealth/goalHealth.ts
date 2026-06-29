/**
 * @file goalHealth.ts — Goal Health Score Agent
 *
 * Public API:
 *   generateGoalHealth(input: GoalHealthInput): Promise<GoalHealthResponse>
 *
 * Architecture follows PROMPT_ENGINEERING.md:
 *   1. Build compact user-turn prompt from GoalHealthInput (deterministic)
 *   2. Call Gemini via safeGenerateContent() (primary → fallback)
 *   3. Parse + validate JSON
 *   4. Return GoalHealthResponse { success, data }
 *
 * Never throws. All errors returned as { success: false }.
 * Does NOT touch any other agent or pipeline.
 */

import { safeGenerateContent }     from '../safeGenerate';
import { GENERATION_CONFIG }        from '../modelConfig';
import {
  GOAL_HEALTH_SYSTEM_PROMPT,
  GOAL_HEALTH_JSON_SCHEMA,
} from './goalHealthPrompt';
import type {
  GoalHealthInput,
  GoalHealthScore,
  GoalHealthResponse,
  HealthLevel,
  HealthTrend,
  HealthWeakness,
  GoalHealthHistoryEntry,
  BurnoutRisk,
  DeadlineStatus,
} from './goalHealth.schema';
import { aiRequestManager }         from '../core/aiRequestManager';
import { calculateETA }             from './healthMetrics';

// ─── Prompt builder ────────────────────────────────────────────────────────────

function buildUserPrompt(input: GoalHealthInput): string {
  return [
    `Return JSON matching this schema:`,
    GOAL_HEALTH_JSON_SCHEMA,
    ``,
    `ROADMAP: v${input.roadmapVersion} | mode: ${input.executionMode}`,
    `PROGRESS: ${input.completedWeeks}/${input.totalWeeks} weeks (${input.overallCompletionPct}%) | ${input.remainingWeeks} weeks remaining`,
    `CONSISTENCY: ${input.consistencyRate}% of started days completed`,
    `STREAK: ${input.currentStreak} days current | ${input.longestStreak} longest | active today: ${input.streakActiveToday}`,
    `XP: ${input.totalXP} (level ${input.level}) | achievements: ${input.achievementCount}`,
    `REPLANS: ${input.replanCount}`,
    ``,
    `Set computedAt to current ISO timestamp.`,
  ].join('\n');
}

// ─── Schema validator ──────────────────────────────────────────────────────────

const VALID_LEVELS: HealthLevel[] = ['excellent', 'healthy', 'warning', 'critical', 'danger'];
const VALID_BURNOUT: BurnoutRisk[] = ['low', 'medium', 'high'];

function validate(obj: unknown): string[] {
  const issues: string[] = [];
  if (typeof obj !== 'object' || obj === null) {
    issues.push(`root: expected object, got ${typeof obj}`);
    return issues;
  }
  const r = obj as Record<string, unknown>;
  if (typeof r['score'] !== 'number') issues.push(`score: expected number`);
  if (!VALID_LEVELS.includes(r['level'] as HealthLevel))
    issues.push(`level: expected excellent|healthy|warning|critical|danger`);
  if (r['burnoutRisk'] && !VALID_BURNOUT.includes(r['burnoutRisk'] as BurnoutRisk))
    issues.push(`burnoutRisk: expected low|medium|high`);
  if (typeof r['summary'] !== 'string') issues.push(`summary: expected string`);
  if (!Array.isArray(r['strengths'])) issues.push(`strengths: expected array`);
  if (!Array.isArray(r['weaknesses'])) issues.push(`weaknesses: expected array`);
  else {
    // Validate structured weakness objects; coerce plain strings for resilience
    (r['weaknesses'] as unknown[]).forEach((w, i) => {
      if (typeof w === 'string') return; // will be coerced below
      if (typeof w !== 'object' || w === null)
        issues.push(`weaknesses[${i}]: expected object or string`);
    });
  }
  if (!Array.isArray(r['recommendations'])) issues.push(`recommendations: expected array`);
  if (typeof r['confidence'] !== 'number') issues.push(`confidence: expected number`);
  return issues;
}

/** Coerce any plain-string weaknesses into the structured format (resilience). */
function normaliseWeaknesses(raw: unknown[]): HealthWeakness[] {
  return raw.map((w) => {
    if (typeof w === 'string') {
      return { title: w, reason: '', recommendation: '' };
    }
    return w as HealthWeakness;
  });
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Generates a goal health assessment with progress analysis.
 *
 * Now uses aiRequestManager for automatic caching, deduplication, and retry logic.
 * Manual refresh only — cached results are used unless explicitly refreshed.
 */
export async function generateGoalHealth(
  input: GoalHealthInput,
  userId?: string,
  forceRefresh: boolean = false,
): Promise<GoalHealthResponse> {

  // Use AI Request Manager with caching
  const result = await aiRequestManager.request<GoalHealthResponse>({
    agentName: 'GoalHealth',
    cacheKey: {
      roadmapVersion: input.roadmapVersion,
      completedWeeks: input.completedWeeks,
      consistencyRate: input.consistencyRate,
      currentStreak: input.currentStreak,
    },
    generateFn: async () => {
      console.group('[GoalHealth] Calling Gemini...');
      let rawText: string;
      try {
        const response = await safeGenerateContent({
          config: {
            systemInstruction: GOAL_HEALTH_SYSTEM_PROMPT,
            ...GENERATION_CONFIG,
            maxOutputTokens: 1024,
          },
          contents: [{ role: 'user', parts: [{ text: buildUserPrompt(input) }] }],
        });
        rawText = response.text ?? '';
        console.log('✓ responded:', rawText.length, 'chars');
      } catch (e) {
        console.error('✗ Gemini failed:', e);
        console.groupEnd();
        return { success: false, data: null as unknown as GoalHealthScore };
      }
      console.groupEnd();

      // Parse
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        console.error('[GoalHealth] JSON.parse failed:', e, rawText.slice(0, 500));
        return { success: false, data: null as unknown as GoalHealthScore };
      }

      // Validate
      const issues = validate(parsed);
      if (issues.length > 0) {
        console.warn('[GoalHealth] schema issues (proceeding):', issues);
      }

      // Ensure computedAt is set
      const data = parsed as GoalHealthScore;
      if (!data.computedAt) data.computedAt = new Date().toISOString();
      // Normalise weaknesses to structured format regardless of model output shape
      if (Array.isArray(data.weaknesses)) {
        data.weaknesses = normaliseWeaknesses(data.weaknesses);
      }

      // ── Phase 8.1: Compute deterministic metrics ──────────────────────────────
      // Default burnoutRisk if AI didn't provide it
      if (!data.burnoutRisk) {
        data.burnoutRisk = 'low';
      }

      // Calculate ETA
      const eta = calculateETA({
        completedWeeks: input.completedWeeks,
        totalWeeks:     input.totalWeeks,
        deadline:       input.deadline,
      });

      // Populate deterministic fields
      data.estimatedCompletionDate = eta.estimatedCompletionDate;
      data.estimatedDaysRemaining  = eta.estimatedDaysRemaining;
      data.overallCompletion       = input.overallCompletionPct;
      data.currentStreak           = input.currentStreak;
      
      // ── Phase 9: Compute deadline status ──────────────────────────────────────
      const daysBehind = eta.estimatedDaysRemaining - (input.deadline ? Math.max(0, Math.ceil((new Date(input.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0);
      
      if (daysBehind >= 7 || data.level === 'danger' || data.level === 'critical') {
        data.deadlineStatus = 'rescue_active';
      } else if (daysBehind >= 3 || data.level === 'warning') {
        data.deadlineStatus = 'slightly_behind';
      } else if (daysBehind <= -7) {
        data.deadlineStatus = 'on_track';
      } else {
        data.deadlineStatus = 'on_track';
      }

      return { success: true, data };
    },
    cacheTTL: 60 * 60 * 1000, // 1 hour (health score should be relatively fresh)
    userId,
    validator: (response) => {
      return response.success && response.data !== null;
    },
    forceRefresh,
  });

  if (!result.success || !result.data) {
    return { success: false, data: null as unknown as GoalHealthScore };
  }

  return result.data;
}

// re-exports for consumers
export type { GoalHealthInput, GoalHealthScore, GoalHealthResponse, HealthLevel, HealthTrend, HealthWeakness, GoalHealthHistoryEntry, BurnoutRisk, DeadlineStatus };
