/**
 * @file goalAnalysis.schema.ts
 *
 * Re-exports Goal Analysis types from the unified domain model.
 *
 * ── SOURCE OF TRUTH ──────────────────────────────────────────────────
 * All type definitions live in src/types/domain.ts.
 * This file exists for backward-compatible import paths used by:
 *   • src/ai/goalAnalysis.ts
 *   • src/pages/AnalysisPage.tsx
 *   • src/pages/RoadmapPage.tsx (ExecutionMode)
 * New code should import from 'src/types/domain' directly.
 *
 * ── AGENT RESPONSIBILITY — Goal Analysis Agent ────────────────────────
 *   ✓ Evaluating goal difficulty
 *   ✓ Assessing feasibility
 *   ✓ Identifying strengths and skill gaps
 *   ✓ Recommending execution intensity (executionMode)
 *   ✓ Recommending weekly commitment (recommendedWeeklyHours)
 *   ✓ Calculating execution confidence (goalHealthPrediction)
 *   ✓ Providing a summary and actionable recommendations
 * ─────────────────────────────────────────────────────────────────────
 */

export type {
  Difficulty,
  Feasibility,
  ExecutionMode,
  GoalAnalysis,
  GoalAnalysisResponse,
} from '../../types/domain';
