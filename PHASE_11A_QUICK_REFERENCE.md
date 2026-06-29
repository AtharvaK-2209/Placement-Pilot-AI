# Phase 11A Quick Reference

## Core Flow Verification - Developer Guide

---

## 🔐 Authentication

**Entry Point**: `src/pages/LoginPage.tsx`

**Key Files**:
- `src/contexts/AuthContext.tsx` - Auth state management
- `src/services/authService.ts` - Firebase Auth wrapper
- `src/components/ProtectedRoute.tsx` - Route guard

**Flow**:
```
Login → Firebase Auth → AuthContext → ProtectedRoute → Protected Page
```

**Session Persistence**:
- Firebase handles persistence via IndexedDB
- Auth state automatically restored on page load
- `authLoading` state prevents flash of unauthenticated content

---

## 🎯 Goal Analysis

**Entry Point**: `src/pages/GoalPage.tsx` → `src/pages/AnalysisPage.tsx`

**Key Files**:
- `src/ai/goalAnalysis.ts` - AI agent
- `src/ai/core/aiRequestManager.ts` - Caching layer
- `src/prompts/goalAnalysisPrompt.ts` - System prompt

**Caching Strategy**:
```
Request → Memory → Firestore → LocalStorage → Gemini
```

**Cache Key**: SHA-256 hash of `{ goal, deadline, weeklyHours, knownSkills, executionMode }`

**TTL**: 30 days

**Console Logs**:
```
[AI CACHE] GoalAnalysis — Cache HIT (memory)
[AI CACHE] GoalAnalysis — Cache MISS (all layers)
[AI CACHE] GoalAnalysis — ✓ Request complete
```

---

## 🗺️ Roadmap

**Entry Point**: `src/pages/RoadmapPage.tsx`

**Key Files**:
- `src/ai/roadmap.ts` - AI agent with deterministic planning
- `src/repositories/FirestoreRoadmapRepository.ts` - Version storage
- `src/repositories/FirestoreRoadmapProgressRepository.ts` - Week unlock tracking
- `src/services/roadmapService.ts` - Business logic
- `src/services/roadmapProgressService.ts` - Progress tracking

**Versioning**:
```
users/{uid}/roadmaps/v1 - Immutable version 1
users/{uid}/roadmaps/v2 - Immutable version 2
users/{uid}/roadmaps/current - Active version pointer
```

**Week Unlock**:
```typescript
// Default threshold: 70% completion
if (weekProgress.completionPercent >= 70) {
  unlockNextWeek();
}
```

**State Recovery**:
- Router state: Primary
- SessionStorage: `pp_roadmap_state` - Recovery on refresh

---

## ✅ Daily Mission

**Entry Point**: `src/pages/DailyMissionPage.tsx`

**Key Files**:
- `src/ai/dailyMission/dailyMission.ts` - AI agent
- `src/repositories/FirestoreMissionRepository.ts` - Mission storage
- `src/hooks/useProgress.ts` - State management
- `src/services/progressService.ts` - Progress tracking
- `src/services/xpService.ts` - XP management

**Mission Storage**:
```
users/{uid}/dailyMissions/w{week}-d{day}
```

**XP Awards**:
- Task completion: +10 XP
- Day completion: +50 XP
- Streak bonus (3+ days): +20 XP

**Bug Prevention**:
```typescript
// Always check PERSISTED state before awarding XP
const persistedTask = await repo.getDayProgress(weekNumber, dayNumber);
const wasAlreadyDone = persistedTask?.tasks.find(t => t.taskTitle === taskTitle)?.completed ?? false;

if (nowDone && !wasAlreadyDone) {
  await xpSvc.award('task_complete', taskTitle);
}
```

**State Recovery**:
- Router state: Primary
- SessionStorage: `pp_daily_mission_state` - Recovery on refresh

---

## 🔄 Repository Pattern

**Auth-Aware Factory**:
```typescript
export function getProgressRepository(): ProgressRepository {
  const user = getCurrentUser();
  if (user) {
    return new FirestoreProgressRepository(db, user.uid);
  }
  return new LocalStorageProgressRepository();
}
```

**Usage in Services**:
```typescript
const repo = getProgressRepository(); // Always call fresh
const progress = await repo.getProgress();
```

**Never cache repository instances** - auth state can change

---

## 🗄️ Data Storage Paths

### Firestore Paths
```
users/{uid}/
  ├─ progress/current                    - User progress aggregate
  ├─ roadmaps/
  │  ├─ v1                              - Roadmap version 1
  │  ├─ v2                              - Roadmap version 2
  │  └─ current                         - Active version pointer
  ├─ roadmapProgress/current            - Week unlock status
  ├─ dailyMissions/
  │  ├─ w1-d1                           - Week 1 Day 1 mission
  │  ├─ w1-d2                           - Week 1 Day 2 mission
  │  └─ ...
  └─ aiCache/
     ├─ GoalAnalysis:{hash}             - Cached goal analysis
     ├─ Roadmap:{hash}                  - Cached roadmap
     └─ DailyMission:{hash}             - Cached daily mission
```

### LocalStorage Keys
```
ai_cache_GoalAnalysis:{hash}           - Cached goal analysis
ai_cache_Roadmap:{hash}                - Cached roadmap
ai_cache_DailyMission:{hash}           - Cached daily mission
pp_progress                            - User progress (guest users)
pp_roadmap                             - Roadmap (guest users)
```

### SessionStorage Keys
```
pp_roadmap_state                       - Roadmap page state
pp_daily_mission_state                 - Daily mission page state
```

---

## 🐛 Debugging Tips

### Check Auth State
```typescript
import { getCurrentUser } from '../services/authService';
const user = getCurrentUser();
console.log('Current user:', user?.uid ?? 'Not authenticated');
```

### Check Cache Hit
```typescript
// Console logs will show:
[AI CACHE] GoalAnalysis Request
Cache Key: GoalAnalysis:a1b2c3d4e5f6g7h8
Force Refresh: false
[AI CACHE] GoalAnalysis — Cache HIT (memory)
```

### Check Repository Type
```typescript
const repo = getProgressRepository();
console.log('Repository type:', repo.constructor.name);
// Expected: FirestoreProgressRepository (authenticated)
// Expected: LocalStorageProgressRepository (guest)
```

### Check Mission Persistence
```typescript
const mission = await missionRepo.getMission(weekNumber, dayNumber);
console.log('Mission found:', mission ? mission.title : 'Not generated');
```

### Check XP Award
```typescript
// Should see BEFORE checking persisted state:
[useProgress] Toggling task "Complete React tutorial": true -> false, wasAlreadyDone: true
[useProgress] Task persisted successfully
// No XP awarded (wasAlreadyDone: true)
```

---

## ⚠️ Common Pitfalls

### ❌ DON'T: Cache repository instances
```typescript
// BAD - repo can become stale if auth state changes
const repo = getProgressRepository();
useEffect(() => {
  const data = await repo.getProgress(); // Stale!
}, []);
```

### ✅ DO: Get fresh repository per operation
```typescript
// GOOD - always auth-aware
useEffect(() => {
  const repo = getProgressRepository();
  const data = await repo.getProgress();
}, []);
```

### ❌ DON'T: Check React state before awarding XP
```typescript
// BAD - React state can be stale (optimistic updates)
if (nowDone && !currentlyDone) {
  await xpSvc.award('task_complete', taskTitle); // Can double-award!
}
```

### ✅ DO: Check PERSISTED state before awarding XP
```typescript
// GOOD - persistence is the source of truth
const persistedDay = await repo.getDayProgress(weekNumber, dayNumber);
const wasAlreadyDone = persistedDay?.tasks.find(t => t.taskTitle === taskTitle)?.completed ?? false;

if (nowDone && !wasAlreadyDone) {
  await xpSvc.award('task_complete', taskTitle);
}
```

### ❌ DON'T: Call Gemini directly
```typescript
// BAD - bypasses caching, retry, and deduplication
const response = await safeGenerateContent({ ... });
```

### ✅ DO: Use AI Request Manager
```typescript
// GOOD - automatic caching, retry, and deduplication
const result = await aiRequestManager.request({
  agentName: 'GoalAnalysis',
  cacheKey: { goal, deadline, weeklyHours },
  generateFn: async () => await safeGenerateContent({ ... }),
  cacheTTL: 7 * 24 * 60 * 60 * 1000,
  userId: user?.uid,
});
```

---

## 🔍 Verification Commands

### Build
```bash
npm run build
```

### Dev Server
```bash
npm run dev
```

### Check Firestore Rules
```bash
# Ensure authenticated users can only access their own data:
# users/{userId}/... - allow read/write if request.auth.uid == userId
```

### Check Console Logs
```javascript
// Filter by:
[AI CACHE]              - Cache operations
[useProgress]           - Progress tracking
[RoadmapPage]          - Roadmap state
[DailyMissionPage]     - Mission state
[FirestoreXXXRepository] - Persistence operations
```

---

## 📊 Performance Benchmarks

| Operation | Expected Time |
|-----------|---------------|
| Memory cache hit | <1ms |
| LocalStorage cache hit | <50ms |
| Firestore cache hit | ~500ms |
| Gemini API call (cold) | 2-5s |
| Page load (authenticated) | <1s |
| Auth state restore | <500ms |

---

## 🎯 Success Criteria

- [x] Login → Dashboard (no errors)
- [x] Goal Analysis → Analysis Page (cache logs visible)
- [x] Analysis → Roadmap (no duplicate generation)
- [x] Roadmap → Daily Mission (mission loads/generates)
- [x] Complete tasks → XP awarded exactly once
- [x] Page refresh → All state restored
- [x] Logout → Login → Data persisted (Firestore users)

---

## 🚀 Deploy Checklist

- [ ] Verify `.env` has all Firebase credentials
- [ ] Run `npm run build` - should succeed
- [ ] Test authentication flow (Google + Email)
- [ ] Test goal analysis (cache hit + miss)
- [ ] Test roadmap generation + persistence
- [ ] Test daily mission + XP awards
- [ ] Test page refresh recovery
- [ ] Check browser console for errors
- [ ] Verify Firestore data structure

---

**Quick Reference Version**: 1.0  
**Last Updated**: June 29, 2026  
**Status**: ✅ Production Ready
