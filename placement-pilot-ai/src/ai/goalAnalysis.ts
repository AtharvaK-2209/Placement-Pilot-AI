import { genai } from './client';
import {
  GOAL_ANALYSIS_SYSTEM_PROMPT,
  GOAL_ANALYSIS_JSON_SCHEMA,
} from '../prompts/goalAnalysisPrompt';
import type { GoalAnalysis, GoalAnalysisResponse } from './schemas/goalAnalysis.schema';
import type { GoalInput } from '../types/goal';

const MODEL = 'gemini-2.5-flash';

/**
 * Builds the user-turn message by combining the JSON contract
 * with the serialized GoalInput.
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
 * Calls the Gemini model to analyze a user's GoalInput.
 *
 * Returns a GoalAnalysisResponse envelope:
 *   { success: true,  data: GoalAnalysis }  — on success
 *   { success: false, data: null }           — on any failure
 *
 * Never throws. All errors are caught and logged to the console.
 */
export async function analyzeGoal(
  goal: GoalInput,
): Promise<GoalAnalysisResponse> {
  try {
    const response = await genai.models.generateContent({
      model: MODEL,
      config: {
        systemInstruction: GOAL_ANALYSIS_SYSTEM_PROMPT,
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: buildUserPrompt(goal) }],
        },
      ],
    });

    const rawText = response.text ?? '';

    // Strip markdown code fences if the model wraps its output despite instructions
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    const data = JSON.parse(cleaned) as GoalAnalysis;

    return { success: true, data };
  } catch (error) {
    console.error('[analyzeGoal] failed:', error);
    return { success: false, data: null as unknown as GoalAnalysis };
  }
}
