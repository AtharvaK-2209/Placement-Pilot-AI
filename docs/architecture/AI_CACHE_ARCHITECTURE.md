# AI Cache Architecture — Phase 7.4

## Overview

The AI Request Manager (`src/ai/core/aiRequestManager.ts`) is a **generic, reusable infrastructure layer** that sits between all AI agents and the Gemini API. It provides automatic caching, request deduplication, retry logic, and error handling for all AI operations.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Action                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AI Agent                                  │
│  (GoalAnalysis, Roadmap, DailyMission, GoalHealth, Replanning)  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AI Request Manager                             │
│                (aiRequestManager.request())                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Memory Cache Check                            │
│                  (In-memory Map cache)                           │
└────────┬────────────────────────────────────────┬───────────────┘
         │ Cache HIT                               │ Cache MISS
         ▼                                         ▼
    Return Result                    ┌─────────────────────────────┐
                                     │   Firestore Cache Check     │
                                     │  (users/{uid}/aiCache/{id})  │
                                     └────────┬──────────┬──────────┘
                                              │ HIT      │ MISS
                                              ▼          ▼
                                         Return Result   │
                                                         │
                                     ┌───────────────────┘
                                     ▼
                        ┌─────────────────────────────┐
                        │  LocalStorage Cache Check   │
                        │   (ai_cache_* keys)         │
                        └────────┬──────────┬─────────┘
                                 │ HIT      │ MISS
                                 ▼          ▼
                            Return Result   │
                                            │
                        ┌───────────────────┘
                        ▼
            ┌─────────────────────────────┐
            │  Request Deduplication      │
            │  (Check in-flight requests) │
            └────────┬──────────┬─────────┘
                     │ Exists   │ New
                     ▼          ▼
                Await Promise   │
                                │
            ┌───────────────────┘
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Call Gemini (via safeGenerateContent)          │
│                      with Exponential Backoff                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Validate Response                           │
│                   (Optional validator function)                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Save to All Cache Layers                       │
│          Memory → LocalStorage → Firestore (if userId)           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Return Result                               │
└─────────────────────────────────────────────────────────────────┘
```

## Cache Strategy

### Cache Key Generation

Cache keys are generated using a **deterministic hash** of agent-specific inputs:

```typescript
generateCacheKey(agentName, cacheKeyInputs)
  ↓
SHA-256 hash of normalized JSON
  ↓
`${agentName}:${hash.slice(0, 16)}`
```

### Agent-Specific Cache Keys

| Agent | Cache Key Inputs |
|-------|------------------|
| **GoalAnalysis** | `goal`, `deadline`, `weeklyHours`, `selectedTopics`, `executionMode` |
| **Roadmap** | `goalAnalysisId`, `roadmapVersion` |
| **DailyMission** | `roadmapVersion`, `weekNumber`, `dayNumber` |
| **GoalHealth** | `roadmapVersion`, `completedWeeks`, `consistencyRate`, `currentStreak` |
| **DynamicReplanning** | `roadmapVersion`, `completedWeeks`, `totalWeeks`, `triggerReason` |

### Cache TTL (Time-to-Live)

| Agent | TTL | Reason |
|-------|-----|--------|
| **GoalAnalysis** | 30 days | Goal analysis rarely changes |
| **Roadmap** | 7 days | Roadmaps are relatively stable |
| **DailyMission** | 1 day | Missions are day-specific |
| **GoalHealth** | 1 hour | Health score should be relatively fresh |
| **DynamicReplanning** | 1 day | Replanning results are time-sensitive |

### Cache Priority Order

The system checks caches in the following order:

1. **Memory Cache** (fastest, lost on page refresh)
2. **Firestore** (persistent, user-specific, requires auth)
3. **LocalStorage** (persistent, device-specific, no auth required)
4. **Gemini API** (slowest, costs quota)

## Request Deduplication

When multiple requests with the **same cache key** arrive simultaneously:

```
User clicks "Generate" 3 times rapidly
  ↓
  ├─ Request 1: Starts Gemini call
  ├─ Request 2: Awaits Request 1's Promise
  └─ Request 3: Awaits Request 1's Promise
  ↓
Only ONE Gemini request is made
  ↓
All 3 callers receive the same response
```

## Retry Logic

### Exponential Backoff

```
Attempt 1 → Fail (503)
  ↓
Wait 1 second
  ↓
Attempt 2 → Fail (503)
  ↓
Wait 2 seconds
  ↓
Attempt 3 → Fail (503)
  ↓
Return error
```

### Retryable vs Non-Retryable Errors

**Retryable Errors** (automatic retry):
- `503` Service Unavailable
- `500` Internal Server Error
- Network timeout
- Connection refused

**Non-Retryable Errors** (fail immediately):
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `429` Quota Exceeded (special handling)

### 429 Quota Handling

When Gemini quota is exceeded:

```typescript
// ❌ OLD (confusing)
"Invalid API Key"

// ✅ NEW (user-friendly)
"Daily AI quota has been reached.
Previously generated content is still available.
Please try again later."
```

**Important**: If cached data exists, it is **always returned** instead of showing an error.

## Cache Invalidation Rules

### Goal Analysis

Invalidate when:
- ✅ Goal text changes
- ✅ Deadline changes
- ✅ Weekly hours change
- ✅ Selected topics change

### Roadmap

Invalidate **only** when:
- ✅ Goal Analysis changes

### Daily Mission

Invalidate **only** when:
- ✅ Roadmap version changes
- ✅ Day advances

### Goal Health

Invalidate:
- ✅ Manual refresh (user-triggered)
- ❌ NOT automatic

### Dynamic Replanning

Invalidate:
- ✅ Manual trigger only
- ❌ NOT automatic

## Usage Examples

### Basic Usage (Goal Analysis)

```typescript
import { aiRequestManager } from './core/aiRequestManager';

const result = await aiRequestManager.request({
  agentName: 'GoalAnalysis',
  cacheKey: {
    goal: goal.goalText,
    deadline: goal.deadline,
    weeklyHours: goal.weeklyHours,
    selectedTopics: goal.selectedTopics,
    executionMode: goal.knownSkills.length > 0 ? 'adaptive' : 'fresh',
  },
  generateFn: async () => {
    // Your Gemini call here
    const response = await safeGenerateContent({ ... });
    return processResponse(response);
  },
  cacheTTL: 30 * 24 * 60 * 60 * 1000, // 30 days
  userId: uid, // Optional — enables Firestore caching
  validator: (response) => {
    // Optional validation
    return response.success && response.data !== null;
  },
});
```

### Force Refresh (Goal Health)

```typescript
const result = await aiRequestManager.request({
  agentName: 'GoalHealth',
  cacheKey: { ... },
  generateFn: async () => { ... },
  forceRefresh: true, // Skip cache, always call Gemini
});
```

### Manual Cache Invalidation

```typescript
// Invalidate specific cache entry
await aiRequestManager.invalidate('GoalAnalysis', {
  goal: 'Software Engineer at Google',
  deadline: '2024-12-31',
  // ... other cache key inputs
}, userId);

// Invalidate all caches for an agent (memory + localStorage only)
await aiRequestManager.invalidateAll('GoalAnalysis', userId);

// Clear ALL caches (use with caution)
aiRequestManager.clearAll();
```

## Logging

Every AI request produces detailed logs:

```
[AI CACHE] GoalAnalysis Request
Cache Key: GoalAnalysis:a3f8b2c1d4e5f6a7
Force Refresh: false

[AI CACHE] GoalAnalysis — Cache HIT (memory)
```

or

```
[AI CACHE] Roadmap Request
Cache Key: Roadmap:b2c1d4e5f6a7b8c9
Force Refresh: false

[AI CACHE] Roadmap — Cache MISS (all layers)
[AI CACHE] Roadmap — Calling Gemini...
[AI CACHE] Roadmap — Attempt 1/3
[AI CACHE] Roadmap — ✓ Gemini response received
[AI CACHE] Roadmap — Saved to memory cache
[AI CACHE] Roadmap — Saved to localStorage
[AI CACHE] Roadmap — Saved to Firestore
[AI CACHE] Roadmap — ✓ Request complete
```

## Performance Benefits

### Before AI Request Manager

- ❌ Repeated navigation → Multiple Gemini calls
- ❌ No request deduplication → Wasted quota
- ❌ No retry logic → Transient failures break app
- ❌ Poor 429 handling → Confusing error messages
- ❌ Each agent implements caching separately → Code duplication

### After AI Request Manager

- ✅ Repeated navigation → Instant from cache
- ✅ Duplicate clicks → Single Gemini request
- ✅ Automatic retry → Resilient to transient failures
- ✅ Friendly 429 messages → Better UX
- ✅ Zero additional caching work for future agents

## Future Compatibility

New AI agents automatically get all infrastructure benefits:

```typescript
// Future Self Simulation Agent
const result = await aiRequestManager.request({
  agentName: 'FutureSelfSimulation',
  cacheKey: { simulationParams },
  generateFn: async () => { /* Gemini call */ },
  cacheTTL: 7 * 24 * 60 * 60 * 1000,
  userId,
});
```

No additional caching work required!

## Files Modified

| File | Changes |
|------|---------|
| `src/ai/core/aiRequestManager.ts` | **NEW** — Core infrastructure |
| `src/ai/goalAnalysis.ts` | Integrated with aiRequestManager |
| `src/ai/roadmap.ts` | Integrated with aiRequestManager |
| `src/ai/dailyMission/dailyMission.ts` | Integrated with aiRequestManager |
| `src/ai/goalHealth/goalHealth.ts` | Integrated with aiRequestManager |
| `src/ai/dynamicReplanning.ts` | Integrated with aiRequestManager |
| `vite.config.ts` | Added crypto-browserify polyfill |
| `package.json` | Added crypto-browserify dependency |

## Verification Checklist

- [x] Goal Analysis loads from cache
- [x] Roadmap loads from cache
- [x] Daily Mission loads from cache
- [x] Duplicate clicks produce one Gemini request
- [x] Retry logic works (exponential backoff)
- [x] Friendly 429 handling works
- [x] Existing functionality remains unchanged (no regressions)
- [x] Memory cache works
- [x] LocalStorage cache works
- [x] Firestore cache works
- [x] Cache invalidation works
- [x] Request deduplication works
- [x] Validator functions work
- [x] Force refresh works

## Migration Notes

### Existing Agents

All existing agents have been updated with **backward-compatible signatures**:

```typescript
// ✅ Still works (no userId = no Firestore cache)
analyzeGoal(goal)

// ✅ New (with Firestore cache)
analyzeGoal(goal, userId)
```

### No Breaking Changes

- ✅ All existing function signatures remain compatible
- ✅ All return types unchanged
- ✅ All error handling unchanged
- ✅ All logging unchanged (enhanced, not replaced)

## Security Considerations

- **Cache Keys**: Hashed with SHA-256 to prevent cache key collision attacks
- **User Isolation**: Firestore caches are stored per-user (`users/{uid}/aiCache`)
- **TTL Enforcement**: Expired cache entries are automatically deleted
- **Validator Functions**: Optional validation prevents invalid cached data

## Monitoring & Debugging

Use browser console to monitor cache behavior:

```javascript
// View memory cache
console.log(memoryCache);

// View localStorage cache
Object.keys(localStorage)
  .filter(k => k.startsWith('ai_cache_'))
  .forEach(k => console.log(k, localStorage.getItem(k)));

// Clear all caches
aiRequestManager.clearAll();
```

## Summary

The AI Request Manager is a **production-grade infrastructure layer** that:

1. ✅ Eliminates duplicate Gemini requests
2. ✅ Provides multi-layer caching (memory → Firestore → localStorage)
3. ✅ Handles transient failures with exponential backoff
4. ✅ Provides friendly 429 quota messages
5. ✅ Works for all future AI agents automatically
6. ✅ Maintains full backward compatibility
7. ✅ Zero regressions to existing functionality

This infrastructure improvement is **invisible to users** but provides significant performance and reliability benefits.
