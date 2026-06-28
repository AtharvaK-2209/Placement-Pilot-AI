/**
 * @file dailyMission.schema.ts
 *
 * Re-exports Daily Mission types from the unified domain model.
 *
 * ── SOURCE OF TRUTH ──────────────────────────────────────────────────
 * All type definitions live in src/types/domain.ts.
 * This file exists for backward-compatible import paths used by:
 *   • src/ai/dailyMission/dailyMission.ts
 *   • src/pages/DailyMissionPage.tsx
 *   • src/hooks/useProgress.ts
 *   • src/services/progressService.ts
 * New code should import from 'src/types/domain' directly.
 *
 * ── AGENT RESPONSIBILITY — Daily Mission Agent ────────────────────────
 *   ✓ Converting one roadmap week into a single day's actionable plan
 *   ✓ Distributing the week's workload across days
 *   ✓ Calibrating task density to execution mode
 *   ✗ Does NOT track progress or completions
 *   ✗ Does NOT regenerate the roadmap
 * ─────────────────────────────────────────────────────────────────────
 */

export type {
  MissionTaskType,
  MissionTask,
  DailyMission,
  DailyMissionInput,
  DailyMissionResponse,
} from '../../types/domain';
