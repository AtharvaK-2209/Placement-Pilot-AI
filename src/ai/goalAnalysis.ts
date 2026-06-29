import { safeGenerateContent }  from './safeGenerate';
import { GENERATION_CONFIG }     from './modelConfig';
import {
  GOAL_ANALYSIS_SYSTEM_PROMPT,
  GOAL_ANALYSIS_JSON_SCHEMA,
} from '../prompts/goalAnalysisPrompt';
import type { GoalAnalysis, GoalAnalysisResponse } from './schemas/goalAnalysis.schema';
import type { GoalInput }                          from '../types/goal';
import { aiRequestManager }                        from './core/aiRequestManager';

/**
 * Builds the user-turn message by combining the JSON contract
 * with the serialised GoalInput.
 */
function buildUserPrompt(goal: GoalInput): string {
  return `
Analyze the following user goal and return a JSON object that strictly
matches this schema:

${GOAL_ANALYSIS_JSON_SCHEMA}

User Goal Data:
${JSON.stringify(goal, null, 2)}
`.trim();
}

/**
 * Goal Analysis Agent — evaluates a user's GoalInput with Gemini.
 *
 * Now uses aiRequestManager for automatic caching, deduplication, and retry logic.
 *
 * Returns:
 *   { success: true,  data: GoalAnalysis }  — on success
 *   { success: false, data: null }           — on any failure (never throws)
 */
export async function analyzeGoal(
  goal: GoalInput,
  userId?: string,
): Promise<GoalAnalysisResponse> {
  // Use AI Request Manager with caching
  const result = await aiRequestManager.request<GoalAnalysisResponse>({
    agentName: 'GoalAnalysis',
    cacheKey: {
      goal: goal.goal,
      deadline: goal.deadline,
      weeklyHours: goal.weeklyHours,
      knownSkills: goal.knownSkills.sort(),
      executionMode: goal.knownSkills.length > 0 ? 'adaptive' : 'fresh',
    },
    generateFn: async () => {
      try {
        const response = await safeGenerateContent({
          config: {
            systemInstruction: GOAL_ANALYSIS_SYSTEM_PROMPT,
            ...GENERATION_CONFIG,
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: buildUserPrompt(goal) }],
            },
          ],
        });

        const rawText = response.text ?? '';

        const cleaned = rawText
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/, '')
          .trim();

        let data: GoalAnalysis;
        try {
          data = JSON.parse(cleaned) as GoalAnalysis;
        } catch (parseError) {
          console.error('[analyzeGoal] JSON parse failed. Raw response:', rawText);
          console.error('[analyzeGoal] Parse error:', parseError);
          return { success: false, data: null as unknown as GoalAnalysis };
        }

        return { success: true, data };
      } catch (error) {
        console.error('[analyzeGoal] Gemini request failed:', error);
        return { success: false, data: null as unknown as GoalAnalysis };
      }
    },
    cacheTTL: 30 * 24 * 60 * 60 * 1000, // 30 days (goal analysis rarely changes)
    userId,
    validator: (response) => {
      return response.success && response.data !== null;
    },
  });

  if (!result.success || !result.data) {
    return { success: false, data: null as unknown as GoalAnalysis };
  }

  return result.data;
}
