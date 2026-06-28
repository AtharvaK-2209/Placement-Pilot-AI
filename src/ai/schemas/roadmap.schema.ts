/**
 * @file roadmap.schema.ts
 *
 * Re-exports Roadmap types from the unified domain model.
 *
 * ── SOURCE OF TRUTH ──────────────────────────────────────────────────
 * All type definitions live in src/types/domain.ts.
 * This file exists for backward-compatible import paths used by:
 *   • src/ai/roadmap.ts
 *   • src/pages/RoadmapPage.tsx
 *   • src/pages/DailyMissionPage.tsx
 *   • src/ai/dailyMission/dailyMission.schema.ts (RoadmapWeek)
 *   • src/ai/roadmap/planner/*.ts
 * New code should import from 'src/types/domain' directly.
 *
 * ── AGENT RESPONSIBILITY — Roadmap Agent ─────────────────────────────
 *   ✓ Consuming blueprint modules + GoalAnalysis output
 *   ✓ Allocating modules across weeks to fit the deadline
 *   ✓ Inserting revision weeks, project milestones, and interview prep
 *   ✗ Does NOT generate daily tasks (Daily Mission Agent's job)
 *   ✗ Does NOT track progress (Progress Agent's job)
 * ─────────────────────────────────────────────────────────────────────
 */

export type {
  RoadmapModule,
  RoadmapWeekType,
  RoadmapWeek,
  Roadmap,
  RoadmapResponse,
} from '../../types/domain';
