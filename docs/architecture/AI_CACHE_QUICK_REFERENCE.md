# AI Cache Quick Reference Card

## 🎯 Basic Usage

```typescript
import { aiRequestManager } from './core/aiRequestManager';

const result = await aiRequestManager.request({
  agentName: 'YourAgentName',
  cacheKey: { /* your cache key inputs */ },
  generateFn: async () => { /* your Gemini call */ },
  cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  userId: uid, // optional
});
```

## 📦 Cache Key Examples

| Agent | Cache Key Inputs |
|-------|------------------|
| **GoalAnalysis** | `goal`, `deadline`, `weeklyHours`, `knownSkills`, `executionMode` |
| **Roadmap** | `goalAnalysisId`, `roadmapVersion` |
| **DailyMission** | `roadmapVersion`, `weekNumber`, `dayNumber` |
| **GoalHealth** | `roadmapVersion`, `completedWeeks`, `consistencyRate`, `currentStreak` |
| **DynamicReplanning** | `roadmapVersion`, `completedWeeks`, `totalWeeks`, `triggerReason` |

## ⏱️ Cache TTL Recommendations

| Use Case | TTL | Reason |
|----------|-----|--------|
| **Rarely changes** | 30 days | Goal analysis, user preferences |
| **Stable content** | 7 days | Roadmaps, learning plans |
| **Daily content** | 1 day | Daily missions, daily reports |
| **Real-time data** | 1 hour | Health scores, live metrics |
| **On-demand only** | N/A | Use `forceRefresh: true` |

## 🔄 Cache Invalidation

```typescript
// Invalidate specific entry
await aiRequestManager.invalidate('GoalAnalysis', {
  goal: 'Software Engineer',
  deadline: '2024-12-31',
}, userId);

// Clear all caches for an agent
await aiRequestManager.invalidateAll('GoalAnalysis', userId);

// Clear ALL caches (use with caution)
aiRequestManager.clearAll();
```

## 🚀 Force Refresh

```typescript
const result = await aiRequestManager.request({
  agentName: 'GoalHealth',
  cacheKey: { ... },
  generateFn: async () => { ... },
  forceRefresh: true, // Skip cache
});
```

## 🎨 Validator Functions

```typescript
const result = await aiRequestManager.request({
  agentName: 'GoalAnalysis',
  cacheKey: { ... },
  generateFn: async () => { ... },
  validator: (response) => {
    // Return true if response is valid
    return response.success && response.data !== null;
  },
});
```

## 📊 Cache Layers

1. **Memory** (fastest, lost on refresh)
2. **Firestore** (persistent, user-specific, requires `userId`)
3. **LocalStorage** (persistent, device-specific)
4. **Gemini API** (slowest, costs quota)

## 🔍 Debugging

```javascript
// View console logs
// Look for: [AI CACHE] messages

// Clear all caches
aiRequestManager.clearAll();

// Inspect localStorage
Object.keys(localStorage)
  .filter(k => k.startsWith('ai_cache_'))
  .forEach(k => console.log(k, localStorage.getItem(k)));

// Check Firestore
// Collection: users/{uid}/aiCache
```

## ⚡ Performance Tips

1. **Use specific cache keys** — More granular = better hit rates
2. **Set appropriate TTL** — Balance freshness vs performance
3. **Include userId** — Enables cross-device Firestore caching
4. **Add validators** — Prevent invalid cached data
5. **Use forceRefresh sparingly** — Only when truly needed

## 🛡️ Error Handling

The AI Request Manager handles errors automatically:
- **429 Quota Exceeded** → Friendly message + return cached data
- **500/503 Transient** → Exponential backoff retry (3 attempts)
- **400/401/403** → Fail immediately (non-retryable)
- **Network timeout** → Automatic retry

## 📝 Console Log Examples

### Cache Hit
```
[AI CACHE] GoalAnalysis Request
Cache Key: GoalAnalysis:a3f8b2c1d4e5
Force Refresh: false
[AI CACHE] GoalAnalysis — Cache HIT (memory)
```

### Cache Miss + Gemini Call
```
[AI CACHE] Roadmap Request
Cache Key: Roadmap:b2c1d4e5f6a7
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

### Retry Logic
```
[AI CACHE] DailyMission — Attempt 1/3
[AI CACHE] DailyMission — ⚠ Retry #1 failed, waiting 1000ms...
[AI CACHE] DailyMission — Attempt 2/3
[AI CACHE] DailyMission — ✓ Succeeded on retry 2
```

## 🎯 Common Patterns

### Pattern 1: Simple Agent
```typescript
export async function generateContent(input, userId?) {
  const result = await aiRequestManager.request({
    agentName: 'MyAgent',
    cacheKey: { input },
    generateFn: async () => {
      const response = await safeGenerateContent({ ... });
      return parseResponse(response);
    },
    cacheTTL: 7 * 24 * 60 * 60 * 1000,
    userId,
  });
  
  return result.data;
}
```

### Pattern 2: With Validation
```typescript
export async function generateContent(input, userId?) {
  const result = await aiRequestManager.request({
    agentName: 'MyAgent',
    cacheKey: { input },
    generateFn: async () => { ... },
    cacheTTL: 7 * 24 * 60 * 60 * 1000,
    userId,
    validator: (data) => {
      return data?.success && data?.data !== null;
    },
  });
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to generate content');
  }
  
  return result.data;
}
```

### Pattern 3: Force Refresh
```typescript
export async function refreshContent(input, userId?) {
  const result = await aiRequestManager.request({
    agentName: 'MyAgent',
    cacheKey: { input },
    generateFn: async () => { ... },
    cacheTTL: 7 * 24 * 60 * 60 * 1000,
    userId,
    forceRefresh: true, // Always call Gemini
  });
  
  return result.data;
}
```

## 🔐 Security Notes

- **Cache keys are hashed** with SHA-256 (secure, collision-resistant)
- **Firestore caches are user-scoped** (`users/{uid}/aiCache`)
- **TTL is enforced** — expired caches are automatically deleted
- **Validators prevent** invalid cached data from being used

## 📞 Support

For questions or issues:
1. Check console logs for `[AI CACHE]` messages
2. Review `/docs/architecture/AI_CACHE_ARCHITECTURE.md`
3. Check existing agent implementations for examples

## ✅ Checklist for New Agents

- [ ] Import `aiRequestManager` from `./core/aiRequestManager`
- [ ] Define cache key inputs (deterministic, specific)
- [ ] Set appropriate cache TTL
- [ ] Add optional `userId` parameter
- [ ] Wrap Gemini call with `aiRequestManager.request()`
- [ ] Add validator function (optional but recommended)
- [ ] Test cache hit/miss behavior
- [ ] Verify retry logic works
- [ ] Check console logs for debugging

---

**Remember**: The AI Request Manager handles all infrastructure concerns automatically. Just define your cache key and TTL, and you're done!
