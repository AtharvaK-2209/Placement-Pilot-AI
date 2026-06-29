/**
 * @file deadlineRescue.ts — Deadline Rescue Mode Agent
 *
 * Public API:
 *   checkRescueActivation(input): RescueActivationCheck (deterministic)
 *   generateRescueStrategy(input, userId?, forceRefresh?): Promise<RescueResponse>
 *
 * Architecture follows PROMPT_ENGINEERING.md:
 *   1. Deterministic activation check (no AI)
 *   2. Build compact user-turn prompt from RescueInput
 *   3. Call Gemini via aiRequestManager (primary → fallback, with caching)
 *   4. Parse + validate JSON
 *   5. Return RescueResponse { success, data }
 *
 * Never throws. All errors returned as { success: false }.
 * Does NOT regenerate roadmaps or modify original plan.
 */

import { safeGenerateContent } from '../safeGenerate';
import { GENERATION_CONFIG } from '../modelConfig';
import {
  DEADLINE_RESCUE_SYSTEM_PROMPT,
  DEADLINE_RESCUE_JSON_SCHEMA,
} from './deadlineRescuePrompt';
import type {
  RescueInput,
  RescueStrategy,
  RescueResponse,
  RescueStatus,
  RescueActivationCheck,
  RecoveryActionType,
  RescueHistoryEntry,
} from './deadlineRescue.schema';
import { aiRequestManager } from '../core/aiRequestManager';

// ─── Deterministic Activation Logic ───────────────────────────────────────────

/**
 * Deterministic check to see if Rescue Mode should activate.
 * NO AI CALLS — pure calculation from existing data.
 *
 * Activation criteria:
 * 1. Days behind schedule >= 7 days
 * 2. Estimated completion > deadline
 * 3. Goal Health declining trend
 * 4. Deadline risk is high
 * 5. Remaining days < remaining weeks × 5 (aggressive threshold)
 */
export function checkRescueActivation(input: RescueInput): RescueActivationCheck {
  const {
    remainingDays,
    remainingWeeks,
    daysBehindSchedule,
    deadlineRisk,
    estimatedDaysRemaining,
    goalHealthScore,
    currentPace,
    requiredPace,
  } = input;

  const reasons: string[] = [];
  let shouldActivate = false;

  // Criterion 1: Significantly behind schedule (>= 7 days)
  if (daysBehindSchedule >= 7) {
    reasons.push(`${daysBehindSchedule} days behind schedule`);
    shouldActivate = true;
  }

  // Criterion 2: Estimated completion exceeds deadline
  if (estimatedDaysRemaining > remainingDays) {
    const overrun = estimatedDaysRemaining - remainingDays;
    reasons.push(`estimated to finish ${overrun} days after deadline`);
    shouldActivate = true;
  }

  // Criterion 3: Deadline risk is high
  if (deadlineRisk === 'high') {
    reasons.push('deadline risk assessed as HIGH by Execution Intelligence');
    shouldActivate = true;
  }

  // Criterion 4: Goal Health critically low
  if (goalHealthScore < 40) {
    reasons.push(`goal health critically low (${goalHealthScore})`);
    shouldActivate = true;
  }

  // Criterion 5: Time pressure — less than 5 days per remaining week
  const daysPerWeek = remainingWeeks > 0 ? remainingDays / remainingWeeks : 0;
  if (daysPerWeek < 5 && remainingWeeks > 0) {
    reasons.push(`only ${Math.round(daysPerWeek)} days per remaining week`);
    shouldActivate = true;
  }

  // Criterion 6: Pace significantly slower than required
  if (requiredPace > 0 && currentPace < requiredPace * 0.7) {
    reasons.push(`current pace (${currentPace.toFixed(2)}x) << required pace (${requiredPace.toFixed(2)}x)`);
    shouldActivate = true;
  }

  const estimatedOverrun = Math.max(0, estimatedDaysRemaining - remainingDays);

  return {
    shouldActivate,
    reason: shouldActivate 
      ? reasons.join('; ')
      : 'On track - rescue mode not needed',
    daysBehind: daysBehindSchedule,
    estimatedOverrun,
  };
}

// ─── Prompt Builder ────────────────────────────────────────────────────────────

function buildUserPrompt(input: RescueInput, activationCheck: RescueActivationCheck): string {
  const modulesSummary = input.remainingModules
    .slice(0, 20)  // Limit to first 20 to keep prompt compact
    .map(m => `  Week ${m.weekNumber}: ${m.title} (${m.hours}h, ${m.type}, ${m.priority} priority)`)
    .join('\n');

  return [
    `Return JSON matching this schema:`,
    DEADLINE_RESCUE_JSON_SCHEMA,
    ``,
    `GOAL: ${input.currentGoal} (${input.goalType})`,
    `DEADLINE: ${input.deadline} | REMAINING: ${input.remainingDays} days`,
    ``,
    `CRISIS STATUS:`,
    `- Days behind schedule: ${activationCheck.daysBehind}`,
    `- Estimated overrun: ${activationCheck.estimatedOverrun} days past deadline`,
    `- Reason for activation: ${activationCheck.reason}`,
    ``,
    `ROADMAP: v${input.roadmapVersion} | ${input.executionMode} mode | ${input.weeklyHours} hrs/week`,
    `PROGRESS: ${input.completedWeeks}/${input.totalWeeks} weeks done (${input.overallCompletionPct}%)`,
    `REMAINING: ${input.remainingWeeks} weeks | ${input.remainingHours} hours | ${input.totalTasks - input.completedTasks} tasks`,
    ``,
    `PACE ANALYSIS:`,
    `- Current pace: ${input.currentPace.toFixed(2)} weeks/week`,
    `- Required pace: ${input.requiredPace.toFixed(2)} weeks/week`,
    `- Days per remaining week: ${input.remainingWeeks > 0 ? Math.round(input.remainingDays / input.remainingWeeks) : 0}`,
    ``,
    `STUDENT STATE:`,
    `- Goal Health: ${input.goalHealthScore}/100 (${input.goalHealthLevel})`,
    `- Burnout Risk: ${input.burnoutRisk}`,
    `- Deadline Risk: ${input.deadlineRisk}`,
    `- Streak: ${input.currentStreak} days`,
    `- Consistency: ${input.consistencyRate}%`,
    ``,
    `STRENGTHS: ${input.strongTopics.join(', ') || 'none identified'}`,
    `WEAKNESSES: ${input.weakTopics.join(', ') || 'none identified'}`,
    ``,
    `REMAINING MODULES (showing first 20):`,
    modulesSummary,
    ``,
    `Generate an aggressive but achievable recovery strategy.`,
    `Set status to "active" if recovery is likely, "critical" if deadline may be unachievable.`,
    `Set computedAt to current ISO timestamp.`,
  ].join('\n');
}

// ─── Schema Validator ──────────────────────────────────────────────────────────

const VALID_STATUSES: RescueStatus[] = ['not_needed', 'monitoring', 'active', 'critical'];

function validate(obj: unknown): string[] {
  const issues: string[] = [];
  if (typeof obj !== 'object' || obj === null) {
    issues.push(`root: expected object, got ${typeof obj}`);
    return issues;
  }
  const r = obj as Record<string, unknown>;
  
  if (typeof r['reason'] !== 'string') issues.push(`reason: expected string`);
  if (!VALID_STATUSES.includes(r['status'] as RescueStatus))
    issues.push(`status: expected not_needed|monitoring|active|critical`);
  if (typeof r['daysBehind'] !== 'number') issues.push(`daysBehind: expected number`);
  if (!Array.isArray(r['recoveryActions'])) issues.push(`recoveryActions: expected array`);
  if (!Array.isArray(r['modulesToSkip'])) issues.push(`modulesToSkip: expected array`);
  if (!Array.isArray(r['weeksToMerge'])) issues.push(`weeksToMerge: expected array`);
  if (!Array.isArray(r['topicsToPrioritize'])) issues.push(`topicsToPrioritize: expected array`);
  if (typeof r['recommendedDailyHours'] !== 'number') issues.push(`recommendedDailyHours: expected number`);
  if (typeof r['estimatedCompletion'] !== 'string') issues.push(`estimatedCompletion: expected string`);
  if (typeof r['estimatedDaysRemaining'] !== 'number') issues.push(`estimatedDaysRemaining: expected number`);
  if (typeof r['recoveryProbability'] !== 'number') issues.push(`recoveryProbability: expected number`);
  if (typeof r['confidence'] !== 'number') issues.push(`confidence: expected number`);
  if (typeof r['motivationalMessage'] !== 'string') issues.push(`motivationalMessage: expected string`);
  
  return issues;
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Generates a deadline rescue strategy with recovery actions.
 *
 * Uses aiRequestManager for automatic caching, deduplication, and retry logic.
 * Only call this AFTER checkRescueActivation() returns shouldActivate = true.
 */
export async function generateRescueStrategy(
  input: RescueInput,
  userId?: string,
  forceRefresh: boolean = false,
): Promise<RescueResponse> {

  // First, check if rescue should activate (deterministic)
  const activationCheck = checkRescueActivation(input);
  
  if (!activationCheck.shouldActivate && !forceRefresh) {
    // Return a "not needed" response without calling AI
    return {
      success: true,
      data: {
        reason: 'You are on track. Rescue mode is not needed.',
        status: 'not_needed',
        daysBehind: 0,
        recoveryActions: [],
        modulesToSkip: [],
        weeksToMerge: [],
        topicsToPrioritize: [],
        recommendedDailyHours: input.weeklyHours / 7,
        estimatedCompletion: input.estimatedCompletionDate,
        estimatedDaysRemaining: input.estimatedDaysRemaining,
        recoveryProbability: 100,
        confidence: 100,
        motivationalMessage: 'Keep up the great work! You\'re on track to finish on time.',
        computedAt: new Date().toISOString(),
      },
    };
  }

  // Use AI Request Manager with caching
  const result = await aiRequestManager.request<RescueResponse>({
    agentName: 'DeadlineRescue',
    cacheKey: {
      roadmapVersion: input.roadmapVersion,
      currentWeek: input.currentWeek,
      completedWeeks: input.completedWeeks,
      daysBehind: activationCheck.daysBehind,
      remainingDays: input.remainingDays,
    },
    generateFn: async () => {
      console.group('[DeadlineRescue] Calling Gemini...');
      let rawText: string;
      try {
        const response = await safeGenerateContent({
          config: {
            systemInstruction: DEADLINE_RESCUE_SYSTEM_PROMPT,
            ...GENERATION_CONFIG,
            maxOutputTokens: 2048,  // Need room for detailed recovery actions
          },
          contents: [{ role: 'user', parts: [{ text: buildUserPrompt(input, activationCheck) }] }],
        });
        rawText = response.text ?? '';
        console.log('✓ responded:', rawText.length, 'chars');
      } catch (e) {
        console.error('✗ Gemini failed:', e);
        console.groupEnd();
        return { success: false, data: null as unknown as RescueStrategy };
      }
      console.groupEnd();

      // Parse
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        console.error('[DeadlineRescue] JSON.parse failed:', e, rawText.slice(0, 500));
        return { success: false, data: null as unknown as RescueStrategy };
      }

      // Validate
      const issues = validate(parsed);
      if (issues.length > 0) {
        console.warn('[DeadlineRescue] schema issues (proceeding):', issues);
      }

      // Ensure computedAt is set
      const data = parsed as RescueStrategy;
      if (!data.computedAt) data.computedAt = new Date().toISOString();

      return { success: true, data };
    },
    cacheTTL: 60 * 60 * 1000, // 1 hour (rescue strategies should be fresh)
    userId,
    validator: (response) => {
      return response.success && response.data !== null;
    },
    forceRefresh,
  });

  if (!result.success || !result.data) {
    return { success: false, data: null as unknown as RescueStrategy };
  }

  return result.data;
}

// re-exports for consumers
export type {
  RescueInput,
  RescueStrategy,
  RescueResponse,
  RescueStatus,
  RescueActivationCheck,
  RecoveryActionType,
  RescueHistoryEntry,
};
