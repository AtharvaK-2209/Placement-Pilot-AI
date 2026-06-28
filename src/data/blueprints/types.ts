/**
 * @file types.ts
 *
 * Shared blueprint interface. Every learning blueprint in PlacementPilot
 * must conform to this schema so that all downstream agents
 * (Roadmap, Daily Mission, Progress, Replanning) consume the same data model.
 *
 * Adding a new domain blueprint (Frontend, Cloud, ML, etc.) requires only:
 * 1. Creating a new file in src/data/blueprints/
 * 2. Exporting an array of BlueprintModule objects
 * 3. Registering it in src/data/blueprints/index.ts
 *
 * No changes to the roadmap engine or any agent are needed.
 */

export interface BlueprintModule {
  /**
   * Unique identifier for this module within its blueprint.
   * Used by the Roadmap Agent to reference skipped/covered modules.
   * Example: "arrays", "spring-core", "sql-joins"
   */
  id: string;

  /**
   * Human-readable module title shown in the UI.
   * Example: "Arrays", "Spring Core", "SQL Joins"
   */
  title: string;

  /**
   * Ordered list of concepts covered in this module.
   * The Roadmap Agent will select a subset based on skill level.
   */
  concepts: string[];

  /**
   * Recommended practice items — LeetCode problems, exercises, or mini-projects.
   * Format: plain strings like "LC 1 — Two Sum" or "Build a CRUD REST API".
   */
  practice: string[];

  /**
   * Baseline estimated hours to complete this module at intermediate pace.
   * The Roadmap Agent scales this up/down based on execution mode.
   */
  estimatedHours: number;

  /**
   * Milestone label shown as a badge when the module is completed.
   * Example: "Arrays Completed", "REST APIs Unlocked"
   */
  milestone: string;

  /**
   * Optional module IDs that should be completed before this one.
   * Used by the Roadmap Agent to enforce learning order.
   */
  prerequisites?: string[];
}
