/**
 * @file goalAnalysisPrompt.ts
 *
 * Prompt architecture for the Goal Analysis AI module.
 *
 * WHY TWO SEPARATE CONSTANTS?
 * ─────────────────────────────────────────────────────────────────────────────
 * The prompt is intentionally split into two distinct parts:
 *
 * 1. SYSTEM PROMPT  (GOAL_ANALYSIS_SYSTEM_PROMPT)
 *    Defines the AI's persona, behaviour, and reasoning rules.
 *    This is the "who you are and how you think" layer.
 *    It is passed as the `system` instruction to the Gemini client.
 *
 * 2. JSON OUTPUT CONTRACT  (GOAL_ANALYSIS_JSON_SCHEMA)
 *    Defines the exact shape of the JSON the AI must return.
 *    This is the "what you must produce" layer.
 *    It is appended to the user message so the model knows the
 *    precise structure expected, field by field.
 *
 * Keeping them separate means:
 *  - The system prompt can be updated without breaking the schema contract.
 *  - The JSON contract maps 1-to-1 with GoalAnalysis interface in
 *    src/ai/schemas/goalAnalysis.schema.ts — changes to the schema
 *    only require updating this contract, nothing else.
 *  - Both parts are independently testable and reviewable.
 *
 * REUSE PATTERN
 * ─────────────────────────────────────────────────────────────────────────────
 * Every future AI module in PlacementPilot AI follows this exact pattern:
 *
 *   src/prompts/
 *   ├── goalAnalysisPrompt.ts       ← this file
 *   ├── roadmapPrompt.ts            ← Roadmap Generation  (future)
 *   ├── dailyMissionsPrompt.ts      ← Daily Missions      (future)
 *   ├── futureSimulationPrompt.ts   ← Future Simulation   (future)
 *   └── rescueModePrompt.ts         ← Rescue Mode         (future)
 *
 * Each file exports:
 *   export const <MODULE>_SYSTEM_PROMPT  = `...`;
 *   export const <MODULE>_JSON_SCHEMA    = `...`;
 */

// ─── System Prompt ────────────────────────────────────────────────────────────

/**
 * System-level instruction passed to the Gemini model.
 *
 * Describes the AI agent's identity, responsibilities, and reasoning approach
 * for evaluating a user's career or learning goal.
 *
 * TODO: Replace the placeholder below with the full system prompt.
 *       Include:
 *         - Agent persona and role definition
 *         - Reasoning chain instructions (how to evaluate skills, deadlines, etc.)
 *         - Tone and language guidelines
 *         - Edge-case handling rules (unrealistic deadlines, unknown skills, etc.)
 *         - Strict instruction to return only valid JSON — no prose, no markdown
 */
export const GOAL_ANALYSIS_SYSTEM_PROMPT = `
# ROLE

You are PlacementPilot AI.

You are an expert career mentor, placement strategist,
technical interviewer and productivity coach.

Your responsibility is to evaluate a student's career goal
and provide an objective analysis.

Never exaggerate.

Never motivate unnecessarily.

Always provide realistic guidance.

--------------------------------------------------

# OBJECTIVE

Given a user's goal and profile:

- Evaluate the overall difficulty.
- Estimate feasibility.
- Estimate preparation effort.
- Identify existing strengths.
- Identify missing skills.
- Suggest the highest priority improvements.
- Summarize the overall situation.

--------------------------------------------------

# REASONING RULES

While analyzing:

Consider

- Current skill level
- Deadline
- Weekly study hours
- Known skills
- Learning style
- Target company
- Goal category

Avoid assumptions.

If information is missing,
infer cautiously.

Never invent impossible claims.

--------------------------------------------------

# OUTPUT RULES

Return ONLY valid JSON.

Never use markdown.

Never explain outside JSON.

Never wrap JSON inside code blocks.

The JSON MUST match the required schema.

`.trim();

// ─── JSON Output Contract ─────────────────────────────────────────────────────

/**
 * JSON output contract appended to the user message.
 *
 * Instructs the Gemini model to return a JSON object that matches
 * the GoalAnalysis interface defined in:
 *   src/ai/schemas/goalAnalysis.schema.ts
 *
 * TODO: Replace the placeholder below with the full JSON contract.
 *       Include:
 *         - Every field name from the GoalAnalysis interface
 *         - Allowed types and value ranges for each field
 *           (e.g. goalHealthPrediction: integer 0–100)
 *         - Allowed string literals for difficulty and feasibility
 *         - Array field descriptions (skillGaps, strengths, recommendations)
 *         - A note that no extra fields should be added beyond the contract
 */
export const GOAL_ANALYSIS_JSON_SCHEMA = `
{
  "difficulty":"Easy | Medium | Hard",

  "feasibility":"High | Moderate | Low",

  "estimatedHours":number,

  "goalHealthPrediction":number,

  "skillGaps":[
      "string"
  ],

  "strengths":[
      "string"
  ],

  "recommendations":[
      "string"
  ],

  "summary":"string"
}
`.trim();
