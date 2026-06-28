/**
 * @file safeGenerate.ts
 *
 * Production-grade Gemini request helper with automatic failover.
 *
 * ⚠️  ARCHITECTURAL RULE
 * Every AI agent MUST call safeGenerateContent() instead of
 * genai.models.generateContent() directly.
 * See docs/architecture/PROMPT_ENGINEERING.md — Rule 10.
 *
 * Strategy:
 *   1. Try PRIMARY model (gemini-3.5-flash).
 *   2. On retryable error (503 / network) — wait 2 s, retry PRIMARY once.
 *   3. If still retryable — switch to FALLBACK model (gemini-2.5-flash).
 *   4. Return the first successful GenerateContentResponse.
 *
 * Non-retryable errors (400, 401, 403, 429) are rethrown immediately
 * so that callers' try/catch blocks surface them correctly.
 *
 * Every AI agent MUST call this helper instead of
 * genai.models.generateContent() directly.
 */

import type { GenerateContentResponse } from '@google/genai';
import { genai }                         from './client';
import { MODEL_NAME, FALLBACK_MODEL }    from './modelConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Mirrors the shape accepted by genai.models.generateContent(). */
export interface GenerateParams {
  /** Omit model — safeGenerateContent() injects it automatically. */
  config?:   Record<string, unknown>;
  contents:  { role: string; parts: { text: string }[] }[];
}

// ─── Error classification ─────────────────────────────────────────────────────

/**
 * Returns true for errors that are worth retrying:
 *   - HTTP 503 Service Unavailable
 *   - Network-level failures (no status code)
 *
 * Returns false for terminal errors that should fail immediately:
 *   - 400 Bad Request
 *   - 401 Unauthorized / 403 Forbidden
 *   - 404 Not Found (unknown model name)
 *   - 429 Quota Exhausted
 *   - Any other 4xx
 */
function isRetryable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const asAny = error as unknown as Record<string, unknown>;

  // SDK wraps HTTP errors — status codes appear under different keys
  // depending on the SDK version. Check all known locations.
  const status =
    (asAny['status']     as number | undefined) ??
    (asAny['statusCode'] as number | undefined) ??
    (asAny['code']       as number | undefined);

  if (status === undefined) {
    // No status → network-level failure (DNS, connection refused, etc.)
    return true;
  }

  return status === 503;
}

/** Resolves after `ms` milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Core helper ──────────────────────────────────────────────────────────────

/**
 * Calls Gemini with automatic primary → fallback failover.
 *
 * @param params  - Request body (without `model`).
 * @returns       - The raw GenerateContentResponse from whichever model succeeded.
 * @throws        - Re-throws the error if all attempts fail or error is terminal.
 */
export async function safeGenerateContent(
  params: GenerateParams,
): Promise<GenerateContentResponse> {
  const RETRY_DELAY_MS = 2000;

  // ── Attempt 1: primary model ───────────────────────────────────────────────
  try {
    const response = await genai.models.generateContent({
      model: MODEL_NAME,
      ...params,
    });
    console.debug(`[safeGenerate] ✓ served by ${MODEL_NAME}`);
    return response;
  } catch (err1) {
    if (!isRetryable(err1)) {
      console.error(`[safeGenerate] ✗ terminal error on ${MODEL_NAME}:`, err1);
      throw err1;
    }
    console.warn(`[safeGenerate] ⚠ retryable error on ${MODEL_NAME} — waiting ${RETRY_DELAY_MS}ms`, err1);
  }

  // ── Attempt 2: retry primary model after delay ─────────────────────────────
  await sleep(RETRY_DELAY_MS);
  try {
    const response = await genai.models.generateContent({
      model: MODEL_NAME,
      ...params,
    });
    console.debug(`[safeGenerate] ✓ served by ${MODEL_NAME} (retry)`);
    return response;
  } catch (err2) {
    if (!isRetryable(err2)) {
      console.error(`[safeGenerate] ✗ terminal error on ${MODEL_NAME} (retry):`, err2);
      throw err2;
    }
    console.warn(`[safeGenerate] ⚠ ${MODEL_NAME} still unavailable — switching to fallback ${FALLBACK_MODEL}`, err2);
  }

  // ── Attempt 3: fallback model ──────────────────────────────────────────────
  const response = await genai.models.generateContent({
    model: FALLBACK_MODEL,
    ...params,
  });
  console.debug(`[safeGenerate] ✓ served by fallback ${FALLBACK_MODEL}`);
  return response;
}
