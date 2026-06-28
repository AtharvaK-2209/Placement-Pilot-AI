/**
 * @file modelConfig.ts
 *
 * Centralised Gemini model configuration for PlacementPilot AI.
 *
 * ⚠️  ARCHITECTURAL RULE
 * Every AI agent MUST import MODEL_NAME, FALLBACK_MODEL, and GENERATION_CONFIG
 * from this file. Never redefine temperature, topP, or model names in agent files.
 * See docs/architecture/PROMPT_ENGINEERING.md — Rule 10.
 *
 * ─── ARCHITECTURE RULE ───────────────────────────────────────────────────────
 * Every AI agent MUST use safeGenerateContent() from safeGenerate.ts
 * rather than calling genai.models.generateContent() directly.
 * That helper enforces the primary → fallback model strategy automatically.
 *
 * Agents:
 *   • Goal Analysis Agent      — src/ai/goalAnalysis.ts
 *   • Roadmap Agent            — src/ai/roadmap.ts
 *   • Daily Mission Agent      — src/ai/dailyMission/dailyMission.ts
 *   • Goal Health Agent        — src/ai/goalHealth.ts        (future)
 *   • Future Simulation Agent  — src/ai/futureSimulation.ts  (future)
 *   • Deadline Rescue Agent    — src/ai/deadlineRescue.ts    (future)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Models ───────────────────────────────────────────────────────────────────

/**
 * Primary model. All requests are attempted here first.
 * If it returns a retryable error, the fallback is used automatically.
 */
export const MODEL_NAME = 'gemini-3.5-flash' as const;

/**
 * Fallback model. Used automatically by safeGenerateContent() when the
 * primary model is unavailable (503) after one retry.
 */
export const FALLBACK_MODEL = 'gemini-2.5-flash' as const;

// ─── Generation Configuration ─────────────────────────────────────────────────

/**
 * Shared generation config optimised for structured JSON output.
 * Conservative values prioritise determinism over creativity.
 *
 * Agents may override individual fields:
 * @example
 * config: { ...GENERATION_CONFIG, maxOutputTokens: 8192 }
 */
export const GENERATION_CONFIG = {
  /** Low temperature = deterministic, parseable JSON. */
  temperature: 0.2,

  /** Nucleus sampling — retains vocabulary range while avoiding noise. */
  topP: 0.85,

  /** Sufficient for all current structured payloads. */
  maxOutputTokens: 4096,
} as const;
