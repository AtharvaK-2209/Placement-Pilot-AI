# PlacementPilot AI — Prompt Engineering Standard

> **Scope:** Every AI agent in this project — current and future — must follow these rules.  
> **Status:** Active architectural standard.  
> **Last updated:** 2026-06-28

---

## Why this document exists

PlacementPilot AI is a multi-agent system. As new agents are added (Progress, Goal Health, Deadline Rescue, Interview, AI Mentor), prompt quality and token efficiency become infrastructure concerns, not just implementation details.

Duplicated instructions, verbose schemas, and redundant context increase costs, reduce determinism, and make prompts harder to maintain. This standard enforces a single set of rules across every agent so that optimisation, debugging, and new agent creation all follow the same pattern.

---

## File anatomy of every AI agent

Every agent follows the same three-file structure:

```
src/ai/<agentName>/
├── <agentName>.schema.ts      — TypeScript interfaces (no prompts here)
├── <agentName>Prompt.ts       — SYSTEM_PROMPT + JSON_SCHEMA constants
└── <agentName>.ts             — agent function + prompt builder
```

The prompt file exports exactly two constants:

```ts
export const <AGENT>_SYSTEM_PROMPT = `...`;  // invariant rules
export const <AGENT>_JSON_SCHEMA   = `...`;  // compact output template
```

---

## Rule 1 — Single Source of Truth

Common instructions must never appear in more than one place.

If a rule is in the **System Prompt**, it must **not** be repeated in the User Prompt or the prompt builder.

Rules that belong **only** in the System Prompt:

- Return valid JSON
- No markdown, no code fences, no explanation outside JSON
- Follow the provided schema
- Use execution mode to calibrate task count/depth
- Task distribution rules (Day 1 is learning-heavy, etc.)
- Safety constraints

**Before (violation):**
```
System Prompt: "Return ONLY valid JSON. No markdown."
User Prompt:   "Return ONLY a JSON object. Do NOT add markdown."
```

**After (correct):**
```
System Prompt: "Return ONLY valid JSON. No markdown."
User Prompt:   [runtime data only — no formatting instructions]
```

---

## Rule 2 — User Prompt contains only runtime data

The User Prompt is a serialised snapshot of the current request context. Nothing else.

**What belongs in the User Prompt:**

| Agent | Runtime data |
|---|---|
| Goal Analysis | goal, goalType, deadline, skillLevel, knownSkills, weeklyHours, learningStyle, targetCompany |
| Roadmap Agent | goal profile, analysis results, pre-allocated week plan |
| Daily Mission | week title/type/modules, dayNumber, executionMode, dailyHourBudget |
| Progress Agent | completed tasks, streak, remaining weeks |
| Future agents | only the current state snapshot for that agent |

**What does NOT belong in the User Prompt:**

- Formatting instructions (put these in the System Prompt)
- Explanations of what a field means (the schema is self-documenting)
- Execution mode definitions (System Prompt already defines them)
- Repetition of the JSON schema as natural language

---

## Rule 3 — Compact JSON schemas

Schema templates must be compact JSON, not natural-language descriptions.

**Before (verbose — wastes tokens):**
```
"title should be a string, for example 'Day 3 — Arrays'"
"estimatedHours is a number representing the total study time"
"learningTasks is an array of task objects, each with a title and duration"
```

**After (compact — self-documenting):**
```json
{
  "title": "",
  "estimatedHours": 0.0,
  "learningTasks": [{"title":"","estimatedMinutes":0,"type":"learning"}]
}
```

Gemini reads structured JSON more reliably than prose descriptions of JSON. Use the output format as its own documentation.

---

## Rule 4 — Remove verbose labels

Avoid unnecessary key-value prose in data sections.

**Before:**
```
Module: Arrays (id: arrays)
  Concepts available: Array basics | Prefix sum | Two Sum pattern
  Practice available: LC 1 — Two Sum | LC 53 — Maximum Subarray
  Milestone: Arrays Completed
```

**After:**
```
[Arrays]
concepts: Array basics | Prefix sum | Two Sum pattern
practice: LC 1 — Two Sum | LC 53 — Maximum Subarray
milestone: Arrays Completed
```

Remove labels that restate the key name. `concepts:` is sufficient — `Concepts available:` adds no information.

---

## Rule 5 — Never send duplicate context

Every token must carry information not already present elsewhere in the prompt.

Common violations to avoid:

| Violation | Fix |
|---|---|
| Sending `week.type` then writing "This is a LEARNING week — balance concept study with practice." | Remove the sentence. `week.type = learning` already says it. |
| Sending `executionMode: "Focused"` then defining what Focused means in the user turn | Definition belongs in System Prompt only |
| Repeating the JSON schema both as a compact template and as prose description | Use the compact template only |
| Sending the full roadmap when only one week is needed | Pass only `RoadmapWeek`, not `Roadmap` |

---

## Rule 6 — System Prompts are permanent

System Prompts contain only reusable, request-invariant rules. They must not change between requests.

A System Prompt should answer: *"What kind of agent am I and how do I always behave?"*

It must NOT contain:
- The user's goal
- This week's modules
- Today's day number
- Current execution mode (the *definition* is here; the *current value* is in the User Prompt)

If you find yourself templating dynamic values into the System Prompt with `${variable}`, stop — that content belongs in the User Prompt.

---

## Rule 7 — User Prompts are minimal

A User Prompt is a serialised request, not a set of instructions.

Target structure for any agent:

```
[schema template]

[section label]: [value]
[section label]: [value]
...

[data block]
```

No paragraphs. No explanations. No restated rules.

---

## Rule 8 — Token budgets

Approximate budgets per agent (combined system + user, estimated at ~4 chars/token):

| Agent | Budget | Current usage |
|---|---|---|
| Goal Analysis Agent | < 1 200 tokens | ~900 tokens |
| Roadmap Agent | < 2 500 tokens | ~1 800 tokens (varies with blueprint size) |
| Daily Mission Agent | < 700 tokens | ~540 tokens |
| Progress Agent (future) | < 700 tokens | — |
| Goal Health Agent (future) | < 700 tokens | — |
| Deadline Rescue Agent (future) | < 900 tokens | — |
| Interview Agent (future) | < 900 tokens | — |
| AI Mentor Agent (future) | < 1 200 tokens | — |

If an agent requires more than its budget, the PR must include a justification comment in the prompt file.

---

## Rule 9 — No loss of information

Prompt optimisation must never remove semantic content that affects output quality.

**Only remove:**
- Duplicate wording of rules already in the System Prompt
- Verbose annotations on JSON fields (`"title should be a string"`)
- Natural-language descriptions of data already present in structured form
- Repeated instructions at the end of the User Prompt

**Never remove:**
- Actual domain data (concepts, practice items, milestones)
- Constraints that govern output shape (min/max values, allowed literals)
- Context the model cannot infer (day number, execution mode value, daily budget)

When in doubt, keep the information and remove the prose wrapping around it.

---

## Rule 10 — Future compatibility

Every new AI agent added to the project must:

1. Follow the three-file structure (`schema.ts`, `Prompt.ts`, `<agent>.ts`)
2. Export exactly `<AGENT>_SYSTEM_PROMPT` and `<AGENT>_JSON_SCHEMA`
3. Use `safeGenerateContent()` from `src/ai/safeGenerate.ts` — never call `genai.models` directly
4. Import `GENERATION_CONFIG` from `src/ai/modelConfig.ts` — never define its own temperature/topP
5. Stay within its token budget or document why it exceeds it
6. Have a `validateXxx()` function that checks the parsed response shape before returning it
7. Return the standard `{ success: boolean, data: T }` envelope — never throw

---

## Quick checklist for new agents

Before merging a new agent, verify:

- [ ] Three-file structure in place
- [ ] System Prompt contains all invariant rules
- [ ] User Prompt contains only runtime data
- [ ] JSON schema is compact template, not natural-language description
- [ ] No instruction appears in both System Prompt and User Prompt
- [ ] No data is sent twice
- [ ] `safeGenerateContent()` is used
- [ ] `GENERATION_CONFIG` is imported, not redefined
- [ ] Token budget is within limit (or budget exception is documented)
- [ ] Response validation function exists
- [ ] `{ success, data }` envelope is returned
- [ ] `generateXxx()` is the only exported function (helpers may also be exported)
- [ ] No React imports in the agent file
- [ ] Build passes with zero TypeScript errors

---

## Current agent compliance summary

| Agent | File | Rule compliance |
|---|---|---|
| Goal Analysis | `src/ai/goalAnalysis.ts` | ✓ Compliant |
| Roadmap Agent | `src/ai/roadmap.ts` | ✓ Compliant |
| Daily Mission | `src/ai/dailyMission/dailyMission.ts` | ✓ Compliant |
| Progress Agent | — | Not yet implemented |
| Goal Health Agent | — | Not yet implemented |
| Deadline Rescue Agent | — | Not yet implemented |

---

## Reference: file locations

| File | Purpose |
|---|---|
| `src/ai/safeGenerate.ts` | Shared Gemini call helper with primary → fallback failover |
| `src/ai/modelConfig.ts` | `MODEL_NAME`, `FALLBACK_MODEL`, `GENERATION_CONFIG` |
| `src/ai/schemas/` | Shared schemas used by multiple agents |
| `src/ai/<agent>/` | Agent-specific schema, prompt, and logic |
| `src/prompts/` | Legacy prompt location — new agents use `src/ai/<agent>/` |
| `docs/architecture/` | This document and future architectural standards |
