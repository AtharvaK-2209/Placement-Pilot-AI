/**
 * @file index.ts — Blueprint Registry
 *
 * Central registry mapping domain keys to their blueprint arrays.
 *
 * To add a new blueprint (e.g. Frontend, Cloud, ML):
 *   1. Create src/data/blueprints/<domain>.ts
 *   2. Export a BlueprintModule[] array from it
 *   3. Add an entry here under the BlueprintKey union and BLUEPRINTS map
 *
 * No changes to the roadmap engine or any AI agent are required.
 */

export type { BlueprintModule } from './types';

export { dsaBlueprint }     from './dsa';
export { javaBlueprint }    from './java';
export { sqlBlueprint }     from './sql';
export { springBootBlueprint } from './springboot';

import type { BlueprintModule } from './types';
import { dsaBlueprint }          from './dsa';
import { javaBlueprint }         from './java';
import { sqlBlueprint }          from './sql';
import { springBootBlueprint }   from './springboot';

/** All supported blueprint domains for v1. */
export type BlueprintKey = 'dsa' | 'java' | 'sql' | 'springboot';

/**
 * Map from domain key to its ordered BlueprintModule array.
 * Used by the Roadmap Agent to look up the correct blueprint.
 */
export const BLUEPRINTS: Record<BlueprintKey, BlueprintModule[]> = {
  dsa:        dsaBlueprint,
  java:       javaBlueprint,
  sql:        sqlBlueprint,
  springboot: springBootBlueprint,
};
