/**
 * @file firestorePaths.ts
 *
 * Centralised Firestore document and collection path helpers.
 * ONLY this file knows the Firestore schema layout.
 * No repository, service, or agent hardcodes paths.
 *
 * Firestore schema:
 *   users/{uid}/                         ← user document
 *   users/{uid}/progress/current         ← UserProgress aggregate
 *
 * Future collections (add paths here, nowhere else):
 *   users/{uid}/goals/{goalId}
 *   users/{uid}/roadmaps/{roadmapId}
 *   users/{uid}/missions/{key}
 */

/** Root user document path. */
export const userDoc = (uid: string) => `users/${uid}`;

/** Progress aggregate document path. */
export const progressDoc = (uid: string) => `users/${uid}/progress/current`;

/** Replanning history collection path. Every replan creates a new document here. */
export const replanHistoryCollection = (uid: string) => `users/${uid}/replanningHistory`;

// ─── Roadmap versioning paths ─────────────────────────────────────────────────

/**
 * Collection holding all roadmap versions (V1, V2, V3 …).
 * Documents are named "v1", "v2", etc. — never overwritten.
 */
export const roadmapVersionsCollection = (uid: string) => `users/${uid}/roadmaps`;

/** Path to a specific version document. */
export const roadmapVersionDoc = (uid: string, version: number) =>
  `users/${uid}/roadmaps/v${version}`;

/**
 * Pointer document — always points to the currently active version number.
 * Updated atomically when a new version becomes active.
 */
export const activeRoadmapPointerDoc = (uid: string) => `users/${uid}/roadmaps/current`;

// ─── Future paths (add when implementing those features) ──────────────────────

// export const goalDoc    = (uid: string, goalId: string)    => `users/${uid}/goals/${goalId}`;
// export const roadmapDoc = (uid: string, roadmapId: string) => `users/${uid}/roadmaps/${roadmapId}`;

// ─── Roadmap Progress ─────────────────────────────────────────────────────────

/** Overall roadmap execution progress — unlocked weeks, completed days, etc. */
export const roadmapProgressDoc = (uid: string) => `users/${uid}/roadmapProgress/current`;

/**
 * Collection holding persisted daily missions.
 * Each document is keyed by "w{week}-d{day}" matching the DayProgress key.
 */
export const dailyMissionsCollection = (uid: string) => `users/${uid}/dailyMissions`;

export const dailyMissionDoc = (uid: string, weekNumber: number, dayNumber: number) =>
  `users/${uid}/dailyMissions/w${weekNumber}-d${dayNumber}`;

// ─── Goal Health ──────────────────────────────────────────────────────────────

/** Latest computed Goal Health Score. Overwritten on every new evaluation. */
export const goalHealthDoc = (uid: string) => `users/${uid}/goalHealth/latest`;

/** Immutable history entries. Each entry is keyed by its ISO evaluatedAt timestamp. */
export const goalHealthHistoryCollection = (uid: string) => `users/${uid}/goalHealth/history`;

export const goalHealthHistoryDoc = (uid: string, timestamp: string) =>
  `users/${uid}/goalHealth/history/${timestamp}`;

// ─── Execution Intelligence ───────────────────────────────────────────────────

/** Latest computed Execution Intelligence analysis. Overwritten on every new evaluation. */
export const executionIntelligenceDoc = (uid: string) => `users/${uid}/executionIntelligence/latest`;

/** Immutable history entries. Each entry is keyed by its ISO evaluatedAt timestamp. */
export const executionIntelligenceHistoryCollection = (uid: string) => `users/${uid}/executionIntelligence/history`;

export const executionIntelligenceHistoryDoc = (uid: string, timestamp: string) =>
  `users/${uid}/executionIntelligence/history/${timestamp}`;
