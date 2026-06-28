/**
 * @file dailyMissionPrompt.ts
 *
 * Prompt architecture for the Daily Mission Agent.
 * Same two-part pattern as all other PlacementPilot AI agents.
 *
 * ⚠️  PROMPT ENGINEERING STANDARD
 * See docs/architecture/PROMPT_ENGINEERING.md before editing this file.
 * Key rules:
 *   - System Prompt = task distribution rules + execution mode table (invariant)
 *   - User Prompt   = week data + day number + budget (runtime only, no instructions)
 *   - Token budget  : < 700 tokens combined
 *
 * Token audit (2-module week, ~4 chars/token):
 *   System prompt : ~238 tokens
 *   User prompt   : ~302 tokens
 *   Total         : ~540 tokens  ✓ within budget
 */

// ─── System Prompt ─────────────────────────────────────────────────────────────

/**
 * Carries ALL invariant rules so the user prompt stays minimal.
 * Rules here never change per request — they belong here, not in the user turn.
 */
export const DAILY_MISSION_SYSTEM_PROMPT = `
You are the Daily Mission Agent inside PlacementPilot AI.
Your job: convert ONE roadmap week + ONE day number into a JSON daily execution plan.

TASK DISTRIBUTION BY DAY
Day 1 — learning-heavy, minimal practice.
Day 2–3 — balanced learning + practice, begin revision.
Day 4–5 — practice-heavy, revise days 1–3.
Day 6 — mostly practice + revision, light learning.
Day 7 — revision + milestone only, no new learning.

EXECUTION MODE → TASK COUNT
Relaxed   2–3 tasks  short durations
Balanced  4–5 tasks  standard depth
Focused   5–6 tasks  include harder problems
Intensive 6–8 tasks  max practice
Extreme   8+ tasks   add revision or project task

RULES
- Draw tasks ONLY from the concepts and practice items provided.
- Never invent topics or LeetCode problems not in the input.
- Keep each task 15–90 minutes.
- estimatedHours = sum(all task minutes) / 60, rounded to 1 decimal.
- Return ONLY valid JSON. No markdown. No explanation. No code fences.
`.trim();

// ─── JSON Output Contract ──────────────────────────────────────────────────────

/**
 * Compact schema — field names only, no verbose descriptions.
 * Gemini does not need prose explanations for obvious field names.
 */
export const DAILY_MISSION_JSON_SCHEMA = `
{
  "title": "Day N — <topic>",
  "estimatedHours": 0.0,
  "learningTasks":  [{"title":"","estimatedMinutes":0,"type":"learning"}],
  "practiceTasks":  [{"title":"","estimatedMinutes":0,"type":"practice"}],
  "revisionTasks":  [{"title":"","estimatedMinutes":0,"type":"revision"}],
  "milestone": "",
  "motivation": ""
}`.trim();
