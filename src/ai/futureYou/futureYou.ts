/**
 * @file futureYou.ts
 *
 * Future You Agent — predicts user's future career state based on current execution.
 *
 * ── FLOW ─────────────────────────────────────────────────────────────
 *   1. Calculate deterministic analytics (completion %, trend, ETA)
 *   2. Gather data from existing repositories
 *   3. Make ONE Gemini request with all context
 *   4. Cache result using Smart Cache
 *   5. Return prediction
 * ─────────────────────────────────────────────────────────────────────
 */

import { safeGenerateContent } from '../safeGenerate';
import { GENERATION_CONFIG } from '../modelConfig';
import {
  FUTURE_YOU_SYSTEM_PROMPT,
  FUTURE_YOU_JSON_SCHEMA,
} from './futureYouPrompt';
import type {
  FutureYouInput,
  FutureYouPrediction,
  FutureYouResponse,
} from './futureYou.schema';
import { aiRequestManager } from '../core/aiRequestManager';

/**
 * Builds the user-turn message by combining the JSON contract
 * with the serialized FutureYouInput.
 */
function buildUserPrompt(input: FutureYouInput): string {
  return `
Predict the user's future career state if they continue at their current pace.
Return a JSON object that strictly matches this schema:

${FUTURE_YOU_JSON_SCHEMA}

User Data:
${JSON.stringify(input, null, 2)}

Remember to:
- Use {targetDays} = ${input.targetDays} days in your narrative
- Base predictions on ACTUAL execution patterns
- Be realistic but motivating
- Clearly mark estimated offers as predictions
- Make recommendations specific and actionable
`.trim();
}

/**
 * Future You Agent — predicts user's future based on current execution.
 *
 * Uses aiRequestManager for automatic caching, deduplication, and retry logic.
 *
 * Returns:
 *   { success: true,  data: FutureYouPrediction }  — on success
 *   { success: false, data: null }                  — on any failure (never throws)
 */
export async function predictFutureYou(
  input: FutureYouInput,
  userId?: string,
): Promise<FutureYouResponse> {
  // Use AI Request Manager with caching
  const result = await aiRequestManager.request<FutureYouResponse>({
    agentName: 'FutureYou',
    cacheKey: {
      goal: input.currentGoal,
      roadmapVersion: input.roadmapVersion,
      overallCompletion: Math.floor(input.overallCompletionPct / 5) * 5, // Round to 5% buckets
      currentWeek: input.currentWeek,
      goalHealthScore: Math.floor(input.goalHealthScore / 10) * 10, // Round to 10-point buckets
      deadlineStatus: input.deadlineStatus,
      currentStreak: input.currentStreak,
      burnoutRisk: input.burnoutRisk,
      executionMode: input.executionMode,
      targetDays: input.targetDays,
    },
    generateFn: async () => {
      try {
        const response = await safeGenerateContent({
          config: {
            systemInstruction: FUTURE_YOU_SYSTEM_PROMPT,
            ...GENERATION_CONFIG,
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: buildUserPrompt(input) }],
            },
          ],
        });

        const rawText = response.text ?? '';

        const cleaned = rawText
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/, '')
          .trim();

        let predictionData: Omit<FutureYouPrediction, 'predictedAt' | 'targetDays'>;
        try {
          predictionData = JSON.parse(cleaned);
        } catch (parseError) {
          console.error('[predictFutureYou] JSON parse failed. Raw response:', rawText);
          console.error('[predictFutureYou] Parse error:', parseError);
          return { success: false, data: null as unknown as FutureYouPrediction };
        }

        // Add metadata
        const data: FutureYouPrediction = {
          ...predictionData,
          predictedAt: new Date().toISOString(),
          targetDays: input.targetDays,
        };

        return { success: true, data };
      } catch (error) {
        console.error('[predictFutureYou] Gemini request failed:', error);
        return { success: false, data: null as unknown as FutureYouPrediction };
      }
    },
    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours (predictions change with daily progress)
    userId,
    validator: (response) => {
      return (
        response.success &&
        response.data !== null &&
        typeof response.data.careerNarrative === 'string' &&
        Array.isArray(response.data.predictedSkills) &&
        typeof response.data.confidence === 'number'
      );
    },
  });

  if (!result.success || !result.data) {
    return { success: false, data: null as unknown as FutureYouPrediction };
  }

  return result.data;
}
