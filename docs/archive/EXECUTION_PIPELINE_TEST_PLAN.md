# EXECUTION PIPELINE END-TO-END TEST PLAN

## Overview

This test plan validates that task completion propagates through all 11+ stages of the execution pipeline without interruption.

---

## PRE-TEST SETUP

1. Open browser DevTools (F12)
2. Open Console tab
3. Open Application > LocalStorage (for cache verification)
4. Open Application > IndexedDB (for Firestore data verification)
5. Have Firestore console open in another tab

---

## TEST 1: TASK COMPLETION BASIC FLOW

### Scenario
User clicks a task checkbox to mark it complete.

### Steps
1. Navigate to `/daily-mission`
2. Open DevTools Console
3. Note current state: Look for `[useProgress]` and `[PipelineDownstream]` logs
4. Click **first task checkbox** to mark complete
5. Wait for console to stabilize (all logs settled)

### Verify: STAGE 1-2: Task Persisted
```
❌ FAIL if:
  - "Failed to persist task completion" error appears
  - Task checkbox reverts immediately

✅ PASS if:
  - Console shows: "[useProgress] ✓ Task persisted successfully"
  - Task checkbox remains checked
  - Can click other tasks
```

### Verify: STAGE 3: UI State Synchronized
```
❌ FAIL if:
  - UI state mismatches Firestore (checkbox unchecked but Firestore shows complete)
  - Task cannot be unchecked

✅ PASS if:
  - Checkbox state stable
  - Can toggle checkbox on/off
  - State persists on page refresh
```

### Verify: STAGE 4: XP Awarded
```
Console output:
  "[useProgress] Awarding XP for task completion"
  "[useProgress] totalXP: [NUMBER]"

❌ FAIL if:
  - XP not awarded
  - XP awarded multiple times (test by clicking same task twice)

✅ PASS if:
  - XP awarded exactly once per task
  - Total XP increases in Firestore `progress.xpLog`
```

### Verify: STAGE 5-7: Daily/Weekly Progress & Achievements
```
Console output:
  "[useProgress] All tasks done, awarding day completion XP"
  "[useProgress] Unlocking achievement: first_mission"

❌ FAIL if:
  - Day completion XP not awarded when all tasks done
  - Achievements don't unlock

✅ PASS if:
  - Day XP awarded when last task completed
  - Achievements array in Firestore updated
  - "first_mission" appears in achievements
```

### Verify: STAGE 8-11: Events Emitted
```
Console output:
  "[PipelineDownstream] [DIAGNOSTIC] task_completed fired: {...}"
  "[PipelineDownstream] task_completed: Invalidating Goal Health cache"

❌ FAIL if:
  - No event logs appear
  - Pipeline downstream handler not initialized

✅ PASS if:
  - See multiple "[PipelineDownstream]" logs
  - Goal Health cache cleared from localStorage
```

---

## TEST 2: WEEK COMPLETION & UNLOCK

### Scenario
User completes all 7 days in week 1, unlocking week 2.

### Prerequisites
- Have at least 7 days of missions available in week 1
- Complete at least 1 task per day for 7 days

### Steps
1. For each day 1-7:
   - Click checkbox for first task
   - Verify "day_completed" event fires
2. After day 7 task complete:
   - Look for `[RoadmapProgress] Week 1: 7/7 days complete`
   - Check console for week unlock event

### Verify: STAGE 6: Week Progress Calculated
```
Console output:
  "[RoadmapProgress] Week 1: 7/7 days complete"
  "[RoadmapProgress] recomputeAndUnlock completed"

❌ FAIL if:
  - Week shows incomplete despite all days at 100%
  - Week completion % wrong

✅ PASS if:
  - All 7 days show as completed
  - Week status shows 100%
```

### Verify: STAGE 7: Week Unlock Triggered
```
Console output:
  "[RoadmapProgress] ✓ Week 1 reached [80]% (>= [80]%) - UNLOCKING Week 2"
  "[useProgress] ✓ Emitted week_unlocked event for week 2"

❌ FAIL if:
  - Week 2 stays locked despite week 1 complete
  - Unlock logic doesn't fire

✅ PASS if:
  - Week 2 now shows "unlocked" status
  - Can navigate to week 2
  - Roadmap progress shows week 2 available
```

### Verify: STAGE 10 & 11: Cache Invalidation
```
LocalStorage (Application tab):
  Before: "ai_cache_GoalHealth:..." and "ai_cache_FutureYou:..." present
  After: Both cleared

Console output:
  "[PipelineDownstream] ✓ Cleared Goal Health cache: ai_cache_GoalHealth:..."
  "[PipelineDownstream] ✓ Cleared Future You cache: ai_cache_FutureYou:..."

❌ FAIL if:
  - Caches still in localStorage
  - No cache invalidation logs

✅ PASS if:
  - All AI cache entries cleared
  - Next Goal Health read calls Gemini (not cache)
```

---

## TEST 3: GOAL HEALTH REFRESH

### Scenario
Goal Health cache is invalidated → next read gets fresh AI response.

### Prerequisites
- Complete at least 1 day of tasks (from TEST 1 or 2)

### Steps
1. Navigate to `/dashboard`
2. Open DevTools Console
3. Open `/dashboard` again (or click Goal Health card)
4. Note: First read uses cache, second read should call AI

### Verify: Cache Invalidation
```
First load (after task completion):
  Console: "[AI CACHE] GoalHealth — Cache MISS (all layers)"
  
This means cache was cleared and Gemini will be called.

❌ FAIL if:
  - See "Cache HIT" immediately
  - Old cached score shown

✅ PASS if:
  - Cache cleared
  - "✓ Gemini response received" appears
  - New score displayed
```

### Verify: Fresh Goal Health Data
```
✓ PASS if:
  - Goal Health score shown
  - Score reflects current progress
  - Breakdown shows tasks/achievements/streak
  - computedAt timestamp is recent (within last minute)
```

---

## TEST 4: FIRESTORE STATE CONSISTENCY

### Scenario
Verify that Firestore contains correct data after task completion pipeline.

### Steps
1. Open Firestore Console
2. Navigate to `users/{uid}/progress/current`
3. Expand `days` array
4. Find `w1-d1` entry

### Verify: Task Marked Complete in Firestore
```json
{
  "w1-d1": {
    "tasks": [
      {
        "taskTitle": "Task Name",
        "completed": true,
        "completedAt": "2026-06-30T..."
      }
    ],
    "completionPercent": 100,
    "completedAt": "2026-06-30T..."
  }
}
```

❌ FAIL if:
  - `completed: false` despite checkbox checked
  - `completionPercent` wrong
  - `completedAt` missing

✅ PASS if:
  - All fields match UI state
  - Timestamps are ISO format
  - Progress percentage correct

### Verify: XP Log in Firestore
```json
"xpLog": [
  {
    "id": "1719718200123-task_complete",
    "source": "task_complete",
    "amount": 10,
    "earnedAt": "2026-06-30T...",
    "description": "Task: ..."
  },
  {
    "id": "1719718215456-day_complete",
    "source": "day_complete",
    "amount": 50,
    "earnedAt": "2026-06-30T...",
    "description": "Day 1 complete"
  }
],
"totalXP": 60
```

❌ FAIL if:
  - Duplicate XP entries with same timestamp
  - totalXP doesn't match sum of xpLog
  - XP amounts wrong

✅ PASS if:
  - Each XP event has unique ID
  - totalXP accurate
  - Amounts match XP_REWARDS config

### Verify: Roadmap Progress Updated
```
Navigate to: users/{uid}/roadmapProgress/current
```

```json
{
  "unlockedWeek": 1,
  "completedWeeks": 0,
  "weekStatuses": [
    {
      "weekNumber": 1,
      "completedDays": 1,
      "generatedDays": 1,
      "completionPercent": 14,
      "status": "in_progress"
    },
    {
      "weekNumber": 2,
      "completedDays": 0,
      "generatedDays": 0,
      "completionPercent": 0,
      "status": "locked"
    }
  ]
}
```

❌ FAIL if:
  - Week statuses not updated
  - Completion % wrong
  - Wrong week unlocked

✅ PASS if:
  - All week statuses calculated
  - Completion % correct
  - Only available weeks unlocked

---

## TEST 5: PAGE REFRESH PERSISTENCE

### Scenario
User refreshes page mid-pipeline and all data persists.

### Prerequisites
- Have completed at least 1 task (TEST 1)

### Steps
1. Click task checkbox to mark complete
2. IMMEDIATELY press F5 (before console logs finish)
3. Wait for page to reload
4. Check that task is still marked complete

### Verify
```
❌ FAIL if:
  - Task checkbox reverts to unchecked
  - UI state different from Firestore
  - XP was awarded multiple times (check xpLog)

✅ PASS if:
  - Task checkbox still checked after reload
  - XP only awarded once (no duplicates)
  - All persisted data matches Firestore
  - Events still emitted (check logs)
```

---

## TEST 6: RACE CONDITION TEST

### Scenario
User rapidly clicks same task checkbox multiple times.

### Steps
1. Click task checkbox ON
2. Immediately click OFF (before API response)
3. Immediately click ON again
4. Wait for all API calls to complete
5. Check final state

### Verify
```
❌ FAIL if:
  - XP awarded multiple times for one action
  - Task state inconsistent
  - Error messages appear

✅ PASS if:
  - Final state is correct
  - XP awarded only for actual state changes
  - No race condition errors
  - isTogglingRef prevents concurrent toggles
```

---

## TEST 7: MULTIPLE TASKS IN DAY

### Scenario
Complete multiple tasks in single day and verify aggregation.

### Prerequisites
- Daily mission with 4+ tasks

### Steps
1. Click task 1 checkbox
2. Wait for event logs to settle
3. Click task 2 checkbox
4. Wait for event logs to settle
5. Click task 3 checkbox
6. Verify day shows 3/4 tasks complete
7. Click task 4 checkbox
8. Verify day shows complete and day_completed event fires

### Verify
```
Console output should show:
  [useProgress] task_completed (task 1)
  [useProgress] task_completed (task 2)
  [useProgress] task_completed (task 3)
  [useProgress] All tasks done, awarding day completion XP (task 4)
  [useProgress] day_completed event fired

❌ FAIL if:
  - Day XP awarded before all tasks complete
  - Any tasks marked not completed in Firestore
  - Event log shows duplicate events

✅ PASS if:
  - Day completion XP only awarded once
  - All 4 tasks show completed
  - Events fire in correct order
```

---

## TEST 8: ACHIEVEMENT CASCADE

### Scenario
Verify multiple achievements unlock in sequence.

### Prerequisites
- Need to trigger:
  - `first_mission` (complete any day 100%)
  - `three_day_streak` (complete 3 consecutive days)
  - `hundred_xp` (reach 100 XP)

### Steps
1. Complete day 1 fully
2. Verify `first_mission` unlocked
3. Complete day 2 fully
4. Verify streak at 2
5. Complete day 3 fully
6. Verify `three_day_streak` unlocked
7. Check `totalXP` in Firestore
8. If >= 100: verify `hundred_xp` unlocked

### Verify
```
Firestore: users/{uid}/progress/current
  "achievements": [
    { "id": "first_mission", ... },
    { "id": "three_day_streak", ... },
    { "id": "hundred_xp", ... }
  ]

Console logs:
  [useProgress] Unlocking achievement: first_mission
  [useProgress] Unlocking achievement: three_day_streak
  [useProgress] Unlocking achievement: hundred_xp

❌ FAIL if:
  - Achievements don't unlock when criteria met
  - Duplicate achievements in array
  - Wrong achievement unlocked

✅ PASS if:
  - Each achievement unlocks once
  - All applicable achievements present
  - Timestamps are recent
```

---

## TEST 9: DASHBOARD SYNC (OPTIONAL - Future Implementation)

### Scenario
Dashboard reflects task completion without page refresh.

### Prerequisites
- `useDashboardRefresh` hook implemented in Dashboard component

### Steps
1. Open Dashboard in one tab
2. Open DailyMissionPage in another tab
3. Click task checkbox in DailyMissionPage tab
4. Switch to Dashboard tab
5. Check if stats updated without refresh

### Verify
```
❌ FAIL (expected in Phase 11A):
  - Dashboard doesn't update
  - XP bar doesn't change
  - Streak doesn't update

⚠️  PENDING:
  - Will be implemented in Phase 11A with listeners
  - Currently requires manual refresh or page reload
```

---

## SUMMARY CHECKLIST

- [ ] TEST 1: Task completion flow works
- [ ] TEST 2: Week unlock logic correct
- [ ] TEST 3: Goal Health cache invalidated
- [ ] TEST 4: Firestore state consistent
- [ ] TEST 5: Page refresh persists data
- [ ] TEST 6: No race conditions
- [ ] TEST 7: Multiple tasks aggregate correctly
- [ ] TEST 8: Achievements unlock properly
- [ ] TEST 9: Dashboard updates (future)

---

## EXPECTED CONSOLE OUTPUT

When running all tests, you should see:

```
[useProgress] ═══ START toggleTask for "Task Name" ═══
[useProgress] Calling progressSvc.completeTask...
[useProgress] ✓ Task persisted successfully
[useProgress] Awarding XP for task completion
[useProgress] ════════ EMITTING EXECUTION PIPELINE EVENTS ════════
[useProgress] Emitting TASK_COMPLETED event
[PipelineDownstream] [DIAGNOSTIC] task_completed fired: {...}
[PipelineDownstream] task_completed: Invalidating Goal Health cache
[PipelineDownstream] ✓ Cleared Goal Health cache: ai_cache_GoalHealth:...
[useProgress] ✓ State updated successfully with persisted data
[useProgress] ═══ END toggleTask for "Task Name" ═══

[useProgress] ═══ START toggleTask for "Another Task" ═══
...
[useProgress] All tasks done, awarding day completion XP
[useProgress] Emitting DAY_COMPLETED event
[PipelineDownstream] [DIAGNOSTIC] day_completed fired: {...}
[useProgress] Emitting WEEK_UNLOCKED event
[PipelineDownstream] [DIAGNOSTIC] week_unlocked fired: {...}
[PipelineDownstream] week_unlocked: Invalidating Future You cache
[PipelineDownstream] ✓ Cleared Future You cache: ai_cache_FutureYou:...
```

---

## TROUBLESHOOTING

### "Failed to persist task completion"
- Check Firestore permissions in console
- Verify user is authenticated
- Check network tab for failed requests

### XP awarded multiple times
- Clear localStorage and cache
- Reload page
- Check that `wasAlreadyDone` check is working

### Events not firing
- Check that `initializePipelineDownstreamHandlers()` called
- Open App.tsx and verify useEffect in App component
- Reload page to ensure handlers initialized

### Week doesn't unlock
- Verify all 7 days are at 100% completion
- Check `[RoadmapProgress]` logs for threshold calculation
- Check unlock threshold (default 80%)

### Cache not cleared
- Open DevTools Application tab
- Look for keys starting with `ai_cache_`
- Manually clear and reload
- Check `[PipelineDownstream]` logs for cache invalidation

---

## NEXT STEPS AFTER PASSING ALL TESTS

1. ✅ Verify end-to-end pipeline works
2. ✅ Confirm all stages 1-11 complete
3. ⏭️ Phase 11A: Add real-time Firestore listeners
4. ⏭️ Phase 11B: Auto-activate Deadline Rescue
5. ⏭️ Phase 11C: Auto-refresh Future You
6. ⏭️ Phase 11D: Auto-refresh Goal Health
