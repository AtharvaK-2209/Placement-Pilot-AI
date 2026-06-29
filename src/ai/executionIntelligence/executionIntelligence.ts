/**
 * @file executionIntelligence.ts — Execution Intelligence Agent
 *
 * Public API:
 *   generateExecutionIntelligence(input: ExecutionIntelligenceInput): Promise<ExecutionIntelligenceResponse>
 *
 * Architecture follows PROMPT_ENGINEERING.md:
 *   1. Build compact user-turn prompt from ExecutionIntelligenceInput (deterministic)
 *   2. Call Gemini via aiRequestManager (primary → fallback, with caching)
 *   3. Parse + validate JSON
 *   4. Return ExecutionIntelligenceResponse { success, data }
 *
 * Never throws. All errors returned as { success: false }.
 * Does NOT touch any other agent or pipeline.
 *
 * AGENT RESPONSIBILITY:
 *   ✓ Analyzes HOW the user executes their roadmap
 *   ✓ Identifies behavioral patterns and learning trends
 *   ✓ Provides personalized coaching recommendations
 *   ✓ Estimates interview readiness and risk levels
 *   ✗ Does NOT regenerate roadmaps or analysis
 *   ✗ Does NOT modify progress data
 */

import { safeGenerateContent } from '../safeGenerate';
import { GENERATION_CONFIG } from '../modelConfig';
import {
  EXECUTION_INTELLIGENCE_SYSTEM_PROMPT,
  EXECUTION_INTELLIGENCE_JSON_SCHEMA,
} from './executionIntelligencePrompt';
import type {
  ExecutionIntelligenceInput,
  ExecutionIntelligenceScore,
  ExecutionIntelligenceResponse,
  RiskLevel,
  ExecutionIntelligenceHistoryEntry,
} from './executionIntelligence.schema';
import { aiRequestManager } from '../core/aiRequestManager';

// ─── Prompt builder ────────────────────────────────────────────────────────────

function buildUserPrompt(input: ExecutionIntelligenceInput): string {
  return [
    `Return JSON matching this schema:`,
    EXECUTION_INTELLIGENCE_JSON_SCHEMA,
    ``,
    `GOAL: ${input.currentGoal} (${input.goalType})`,
    `DEADLINE: ${input.deadline} | ${input.remainingDays} days | ${input.remainingHours} hours remaining`,
    `DIFFICULTY: ${input.difficulty} | FEASIBILITY: ${input.feasibility} | MODE: ${input.executionMode}`,
    ``,
    `ROADMAP: v${input.roadmapVersion} | ${input.totalWeeks} weeks total`,
    `PROGRESS: Week ${input.currentWeek}/${input.totalWeeks} | ${input.completedWeeks} completed | ${input.remainingWeeks} remaining`,
    `COMPLETION: ${input.overallCompletionPct}% overall | ${input.completedTasks}/${input.totalTasks} tasks | ${input.completedDays} days`,
    ``,
    `XP: ${input.totalXP} (level ${input.level}) | achievements: ${input.achievementCount}`,
    `STREAK: ${input.currentStreak} current | ${input.longestStreak} longest | active today: ${input.streakActiveToday} | ${input.totalActiveDays} total active days`,
    `CONSISTENCY: ${input.consistencyRate}% (started days that were completed)`,
    ``,
    `GOAL HEALTH: ${input.goalHealthScore}/100 (${input.goalHealthLevel})`,
    `REPLANS: ${input.replanCount}`,
    `WEEKLY HOURS: ${input.weeklyHours}`,
    ``,
    `WEEKLY COMPLETION PATTERN (last ${input.weeklyCompletionPattern.length} weeks): ${input.weeklyCompletionPattern.map(p => `${p}%`).join(', ')}`,
    ``,
    `TASK PATTERNS:`,
    `- Missed tasks: ${input.missedTasksCount}`,
    `- Revision: ${input.revisionTasksCompletedCount}/${input.revisionTasksTotalCount} (${input.revisionTasksTotalCount > 0 ? Math.round((input.revisionTasksCompletedCount / input.revisionTasksTotalCount) * 100) : 0}%)`,
    `- Projects: ${input.projectTasksCompletedCount}/${input.projectTasksTotalCount} (${input.projectTasksTotalCount > 0 ? Math.round((input.projectTasksCompletedCount / input.projectTasksTotalCount) * 100) : 0}%)`,
    `- Practice: ${input.practiceTasksCompletedCount}/${input.practiceTasksTotalCount} (${input.practiceTasksTotalCount > 0 ? Math.round((input.practiceTasksCompletedCount / input.practiceTasksTotalCount) * 100) : 0}%)`,
    ``,
    `STRONG TOPICS (>80% completion): ${input.topicsWithHighCompletion.join(', ') || 'none detected'}`,
    `WEAK TOPICS (<50% completion): ${input.topicsWithLowCompletion.join(', ') || 'none detected'}`,
    ``,
    `Set computedAt to current ISO timestamp.`,
  ].join('\n');
}

// ─── Schema validator ──────────────────────────────────────────────────────────

const VALID_RISK_LEVELS: RiskLevel[] = ['low', 'medium', 'high'];

function validate(obj: unknown): string[] {
  const issues: string[] = [];
  if (typeof obj !== 'object' || obj === null) {
    issues.push(`root: expected object, got ${typeof obj}`);
    return issues;
  }
  const r = obj as Record<string, unknown>;
  if (typeof r['overallPerformance'] !== 'string') issues.push(`overallPerformance: expected string`);
  if (!Array.isArray(r['strengths'])) issues.push(`strengths: expected array`);
  if (!Array.isArray(r['weaknesses'])) issues.push(`weaknesses: expected array`);
  if (!Array.isArray(r['behaviourPatterns'])) issues.push(`behaviourPatterns: expected array`);
  if (!Array.isArray(r['recommendations'])) issues.push(`recommendations: expected array`);
  if (!VALID_RISK_LEVELS.includes(r['burnoutRisk'] as RiskLevel))
    issues.push(`burnoutRisk: expected low|medium|high`);
  if (!VALID_RISK_LEVELS.includes(r['deadlineRisk'] as RiskLevel))
    issues.push(`deadlineRisk: expected low|medium|high`);
  if (typeof r['interviewReadiness'] !== 'number') issues.push(`interviewReadiness: expected number`);
  if (typeof r['motivationalMessage'] !== 'string') issues.push(`motivationalMessage: expected string`);
  if (typeof r['confidence'] !== 'number') issues.push(`confidence: expected number`);
  return issues;
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Generates execution intelligence analysis with behavioral pattern detection.
 *
 * Uses aiRequestManager for automatic caching, deduplication, and retry logic.
 * Manual refresh only — cached results are used unless explicitly refreshed.
 */
export async function generateExecutionIntelligence(
  input: ExecutionIntelligenceInput,
  userId?: string,
  forceRefresh: boolean = false,
): Promise<ExecutionIntelligenceResponse> {

  // Use AI Request Manager with caching
  const result = await aiRequestManager.request<ExecutionIntelligenceResponse>({
    agentName: 'ExecutionIntelligence',
    cacheKey: {
      roadmapVersion: input.roadmapVersion,
      currentWeek: input.currentWeek,
      completedWeeks: input.completedWeeks,
      overallCompletionPct: input.overallCompletionPct,
      consistencyRate: input.consistencyRate,
      currentStreak: input.currentStreak,
      goalHealthScore: input.goalHealthScore,
    },
    generateFn: async () => {
      console.group('[ExecutionIntelligence] Calling Gemini...');
      let rawText: string;
      try {
        const response = await safeGenerateContent({
          config: {
            systemInstruction: EXECUTION_INTELLIGENCE_SYSTEM_PROMPT,
            ...GENERATION_CONFIG,
            maxOutputTokens: 1536, // Needs more tokens for detailed behavioral analysis
          },
          contents: [{ role: 'user', parts: [{ text: buildUserPrompt(input) }] }],
        });
        rawText = response.text ?? '';
        console.log('✓ responded:', rawText.length, 'chars');
      } catch (e) {
        console.error('✗ Gemini failed:', e);
        console.groupEnd();
        return { success: false, data: null as unknown as ExecutionIntelligenceScore };
      }
      console.groupEnd();

      // Parse
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        console.error('[ExecutionIntelligence] JSON.parse failed:', e, rawText.slice(0, 500));
        return { success: false, data: null as unknown as ExecutionIntelligenceScore };
      }

      // Validate
      const issues = validate(parsed);
      if (issues.length > 0) {
        console.warn('[ExecutionIntelligence] schema issues (proceeding):', issues);
      }

      // Ensure computedAt is set
      const data = parsed as ExecutionIntelligenceScore;
      if (!data.computedAt) data.computedAt = new Date().toISOString();

      return { success: true, data };
    },
    cacheTTL: 2 * 60 * 60 * 1000, // 2 hours (execution intelligence should be relatively fresh)
    userId,
    validator: (response) => {
      return response.success && response.data !== null;
    },
    forceRefresh,
  });

  if (!result.success || !result.data) {
    return { success: false, data: null as unknown as ExecutionIntelligenceScore };
  }

  return result.data;
}

// re-exports for consumers
export type {
  ExecutionIntelligenceInput,
  ExecutionIntelligenceScore,
  ExecutionIntelligenceResponse,
  RiskLevel,
  ExecutionIntelligenceHistoryEntry,
};
