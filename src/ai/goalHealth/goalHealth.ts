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

export async function generateGoalHealth(
  input: GoalHealthInput,
  userId?: string,
  forceRefresh: boolean = false,
): Promise<GoalHealthResponse> {
  console.log('[GoalHealth] generateGoalHealth called with input:', {
    roadmapVersion: input.roadmapVersion,
    totalWeeks: input.totalWeeks,
    completedWeeks: input.completedWeeks,
    overallCompletionPct: input.overallCompletionPct,
    consistencyRate: input.consistencyRate,
    currentStreak: input.currentStreak,
    userId: userId
  });

  try {
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
              maxOutputTokens: 2048,
            },
            contents: [{ role: 'user', parts: [{ text: buildUserPrompt(input) }] }],
          });
          
          // ── DIAGNOSTIC LOGGING ──────────────────────────────────────────────
          console.log('[GoalHealth] === GEMINI SDK RESPONSE DIAGNOSTIC ===');
          console.log('[GoalHealth] response type:', typeof response);
          console.log('[GoalHealth] response.candidates length:', response.candidates?.length ?? 'undefined');
          
          if (response.candidates && response.candidates.length > 0) {
            const firstCandidate = response.candidates[0];
            console.log('[GoalHealth] firstCandidate.content?.parts length:', firstCandidate.content?.parts?.length ?? 'undefined');
            
            if (firstCandidate.content?.parts && firstCandidate.content.parts.length > 0) {
              const firstPart = firstCandidate.content.parts[0];
              console.log('[GoalHealth] firstPart.text type:', typeof firstPart.text);
              console.log('[GoalHealth] firstPart.text length:', (firstPart.text as string)?.length ?? 'undefined');
              console.log('[GoalHealth] firstPart.text (first 200 chars):', (firstPart.text as string)?.slice(0, 200));
            }
          }
          
          console.log('[GoalHealth] response.text type:', typeof response.text);
          console.log('[GoalHealth] response.text length:', response.text?.length ?? 'undefined');
          console.log('[GoalHealth] response.text (first 300 chars):', response.text?.slice(0, 300));
          console.log('[GoalHealth] response.text (last 200 chars):', response.text?.slice(-200));
          console.log('[GoalHealth] finishReason:', response.candidates?.[0]?.finishReason);
          console.log('[GoalHealth] usageMetadata:', response.usageMetadata);
          console.log('[GoalHealth] === END DIAGNOSTIC ===');
          
          rawText = response.text ?? '';
          console.log('✓ Gemini responded:', rawText.length, 'chars');
        } catch (e) {
          console.error('✗ Gemini failed:', e);
          console.groupEnd();
          return { success: false, data: null as unknown as GoalHealthScore };
        }
        console.groupEnd();

        // Parse
        console.log('[GoalHealth] Parsing Gemini response...');
        const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        let parsed: unknown;
        try {
          parsed = JSON.parse(cleaned);
          console.log('✓ JSON parsed successfully');
        } catch (e) {
          console.error('[GoalHealth] JSON.parse failed:', e);
          console.error('[GoalHealth] Raw text (first 500 chars):', rawText.slice(0, 500));
          return { success: false, data: null as unknown as GoalHealthScore };
        }

        // Validate
        console.log('[GoalHealth] Validating schema...');
        const issues = validate(parsed);
        if (issues.length > 0) {
          console.warn('[GoalHealth] schema issues (proceeding):', issues);
        } else {
          console.log('✓ Schema validation passed');
        }

        // Ensure computedAt is set
        const data = parsed as GoalHealthScore;
        if (!data.computedAt) {
          data.computedAt = new Date().toISOString();
          console.log('✓ Set computedAt:', data.computedAt);
        }
        
        // Normalise weaknesses to structured format regardless of model output shape
        if (Array.isArray(data.weaknesses)) {
          console.log('✓ Normalising weaknesses:', data.weaknesses.length, 'items');
          data.weaknesses = normaliseWeaknesses(data.weaknesses);
        }

        // ── Phase 8.1: Compute deterministic metrics ──────────────────────────────
        // Default burnoutRisk if AI didn't provide it
        if (!data.burnoutRisk) {
          data.burnoutRisk = 'low';
          console.log('✓ Set default burnoutRisk:', data.burnoutRisk);
        }

        // Calculate ETA
        console.log('[GoalHealth] Calculating ETA...');
        try {
          const eta = calculateETA({
            completedWeeks: input.completedWeeks,
            totalWeeks:     input.totalWeeks,
            deadline:       input.deadline,
          });
          console.log('✓ ETA calculated:', eta);

          // Populate deterministic fields
          data.estimatedCompletionDate = eta.estimatedCompletionDate;
          data.estimatedDaysRemaining  = eta.estimatedDaysRemaining;
          data.overallCompletion       = input.overallCompletionPct;
          data.currentStreak           = input.currentStreak;
        } catch (etaError) {
          console.error('[GoalHealth] ETA calculation error:', etaError);
          throw etaError;
        }
        
        // ── Phase 9: Compute deadline status ──────────────────────────────────────
        console.log('[GoalHealth] Computing deadline status...');
        try {
          const daysRemaining = data.estimatedDaysRemaining ?? 0;
          
          if (daysRemaining >= 7 || data.level === 'danger' || data.level === 'critical') {
            data.deadlineStatus = 'rescue_active';
          } else if (daysRemaining >= 3 || data.level === 'warning') {
            data.deadlineStatus = 'slightly_behind';
          } else if (daysRemaining <= -7) {
            data.deadlineStatus = 'on_track';
          } else {
            data.deadlineStatus = 'on_track';
          }
          console.log('✓ Deadline status:', data.deadlineStatus);
        } catch (dsError) {
          console.error('[GoalHealth] Deadline status error:', dsError);
          // Non-fatal — set default
          data.deadlineStatus = 'on_track';
        }

        console.log('[GoalHealth] ✓ Successfully generated health score:', {
          score: data.score,
          level: data.level,
          confidence: data.confidence
        });

        return { success: true, data };
      },
      cacheTTL: 60 * 60 * 1000, // 1 hour (health score should be relatively fresh)
      userId,
      validator: (response) => {
        const isValid = response.success && response.data !== null;
        console.log('[GoalHealth] aiRequestManager validator result:', { isValid });
        return isValid;
      },
      forceRefresh,
    });

    console.log('[GoalHealth] aiRequestManager result:', {
      success: result.success,
      hasData: !!result.data
    });

    if (!result.success || !result.data) {
      console.error('[GoalHealth] ERROR: Failed to generate health score via aiRequestManager');
      return { success: false, data: null as unknown as GoalHealthScore };
    }

    console.log('[GoalHealth] ✓ Returning successful health score');
    return result.data;
  } catch (topLevelError) {
    console.error('[GoalHealth] FATAL ERROR - Top level exception:', topLevelError);
    console.error('[GoalHealth] Stack:', topLevelError instanceof Error ? topLevelError.stack : 'No stack');
    return { success: false, data: null as unknown as GoalHealthScore };
  }
}

// re-exports for consumers
export type { GoalHealthInput, GoalHealthScore, GoalHealthResponse, HealthLevel, HealthTrend, HealthWeakness, GoalHealthHistoryEntry, BurnoutRisk, DeadlineStatus };
