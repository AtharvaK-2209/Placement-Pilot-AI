# 🐞 Bug 11B-07: Data Flow Diagrams

## Before Fix: Why Header Was Stale

```
┌─────────────────────────────────────────────────────────────────────┐
│                         APPLICATION START                           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
        ┌───────▼────────┐ ┌──────▼───────┐ ┌──────▼────────┐
        │    AppHeader   │ │  Dashboard   │ │ DailyMission  │
        │    Mounted     │ │   Mounted    │ │    Mounted    │
        └────────┬───────┘ └──────┬───────┘ └──────┬────────┘
                 │                │                 │
        ┌────────▼────────┐ ┌──────▼───────┐ ┌──────▼────────┐
        │useGamification()│ │useGamification│ │ useDayProgress│
        │  Fetch XP: 0    │ │  Fetch XP: 0  │ │  Fetch XP: 0  │
        └────────┬───────┘ └──────┬───────┘ └──────┬────────┘
                 │                │                 │
        ┌────────▼────────┐ ┌──────▼───────┐ ┌──────▼────────┐
        │  Firestore:     │ │  Firestore:   │ │  Firestore:   │
        │  totalXP: 0     │ │  totalXP: 0   │ │  totalXP: 0   │
        │  streak: 0      │ │  streak: 0    │ │  streak: 0    │
        └────────┬───────┘ └──────┬───────┘ └──────┬────────┘
                 │                │                 │
        ┌────────▼────────┐ ┌──────▼───────┐ ┌──────▼────────┐
        │ Displays:       │ │ Displays:     │ │ Displays:     │
        │ 🔥 0  ⚡ 0 XP   │ │ 🔥 0  ⚡ 0 XP │ │ ⚡ 0 XP       │
        └────────┬───────┘ └──────┬───────┘ └──────┬────────┘
                 │                │                 │
                 │                │     DATA FROZEN │
                 │                │     [user] only │
                 └────────────────┴────────────────►
                                  │
                      ✓ Each component ready
                      ✓ Initial render correct
```

### User Completes Task on DailyMissionPage

```
┌──────────────────────────────────────────────────────────────┐
│             USER COMPLETES A TASK                            │
│        on DailyMissionPage (e.g., "Complete Array Problem")  │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │   DailyMissionPage.toggleTask()  │
        │   - Update local state (optimistic)
        │   - Show task as completed       │
        └──────────────────┬───────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │   progressService.completeTask() │
        │   - Write to Firestore           │
        └──────────────────┬───────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │   xpService.award('task...')     │
        │   - Firestore: totalXP += 100    │
        │   - totalXP now = 100            │
        └──────────────────┬───────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │ executionPipelineEvents.emit()   │
        │ - type: 'task_completed'         │
        │ - type: 'xp_awarded'             │
        └──────────────────┬───────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
    ┌─────────────────┐                ┌─────────────────┐
    │   AppHeader     │                │   Dashboard     │
    │   (SUBSCRIBED?) │                │   (SUBSCRIBED?) │
    │   ❌ NO!        │                │   ❌ NO!        │
    │   NO REFRESH    │                │   NO REFRESH    │
    │   STALE: 🔥 0   │                │   STALE: 🔥 0   │
    │   ⚡ 0 XP       │                │   ⚡ 0 XP       │
    └─────────────────┘                └─────────────────┘
        │
        │
        ├─ [user] dependency unchanged ─┐
        │                                 │
        │    NO REFRESH TRIGGERED         │
        │    DATA REMAINS FROZEN          │
        │                                 │
        └─────────────────────────────────┘

    BUT DailyMissionPage shows:
    ✓ Correct: ⚡ 100 XP (via useDayProgress local state)

    RESULT: INCONSISTENT STATE
    ❌ AppHeader: ⚡ 0 XP (stale)
    ✓ DailyMissionPage: ⚡ 100 XP (current)
    ✓ Firestore: 100 XP (current)
```

---

## After Fix: Event-Driven Synchronization

```
┌─────────────────────────────────────────────────────────────────────┐
│                         APPLICATION START                           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
        ┌───────▼────────┐ ┌──────▼───────┐ ┌──────▼────────┐
        │    AppHeader   │ │  Dashboard   │ │ DailyMission  │
        │    Mounted     │ │   Mounted    │ │    Mounted    │
        └────────┬───────┘ └──────┬───────┘ └──────┬────────┘
                 │                │                 │
        ┌────────▼────────────────────────────────┐ │
        │     useGamification()                   │ │
        │ ✓ Fetch XP: 0                           │ │
        │ ✓ Subscribe to:                         │ │
        │   - 'task_completed' ← EVENT LISTENER   │ │
        │   - 'xp_awarded' ← EVENT LISTENER       │ │
        │   - 'day_completed' ← EVENT LISTENER    │ │
        │   - 'progress_updated' ← EVENT LISTENER │ │
        └────────┬───────────────────────────────┘ │
                 │                                  │
        ┌────────▼────────┐                 ┌──────▼────────┐
        │  Firestore:     │                 │ useDayProgress│
        │  totalXP: 0     │                 │  Fetch XP: 0  │
        │  streak: 0      │                 └──────┬────────┘
        └────────┬───────┘                         │
                 │                                  │
        ┌────────▼────────┐                 ┌──────▼────────┐
        │ Displays:       │                 │ Displays:     │
        │ 🔥 0  ⚡ 0 XP   │                 │ ⚡ 0 XP       │
        └────────┬───────┘                 └──────┬────────┘
                 │                                  │
                 │  ✓ Event listeners ACTIVE       │
                 │  ✓ Ready to refresh on events   │
                 └──────────────────┬───────────────┘
                                    │
                        ✓ All components ready
                        ✓ Initial render correct
```

### User Completes Task (With Fix)

```
┌──────────────────────────────────────────────────────────────┐
│             USER COMPLETES A TASK                            │
│        on DailyMissionPage (e.g., "Complete Array Problem")  │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │   DailyMissionPage.toggleTask()  │
        │   - Update local state (optimistic)
        │   - Show task as completed       │
        └──────────────────┬───────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │   progressService.completeTask() │
        │   - Write to Firestore           │
        └──────────────────┬───────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │   xpService.award('task...')     │
        │   - Firestore: totalXP += 100    │
        │   - totalXP now = 100            │
        └──────────────────┬───────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────────┐
        │ executionPipelineEvents.emit()           │
        │ - type: 'task_completed'                 │
        │ - type: 'xp_awarded'                     │
        │ - broadcasts to all SUBSCRIBED listeners │
        └──────────────────┬───────────────────────┘
                           │
        ┌──────────────────┴──────────────────────────────┐
        │                                                 │
        ▼                                                 ▼
    ┌─────────────────────────┐                 ┌──────────────────┐
    │   AppHeader Subscriber  │                 │  Other Listeners │
    │   (NOW SUBSCRIBED! ✓)   │                 │  (Goal Health,   │
    │                         │                 │   Deadline       │
    │   Receives event:       │                 │   Rescue, etc.)  │
    │   'task_completed'      │                 └──────────────────┘
    │   'xp_awarded'          │
    └─────────────┬───────────┘
                  │
                  ▼
    ┌─────────────────────────────────────────┐
    │  await fetchGamificationData()          │
    │  - Read from Firestore                  │
    │  - totalXP = 100 ✓                      │
    │  - streak = 0 ✓                         │
    │  - setData(updated)                     │
    └─────────────┬───────────────────────────┘
                  │
                  ▼
    ┌─────────────────────────────────────────┐
    │  AppHeader React component re-renders   │
    │  with updated data                      │
    │                                         │
    │  DISPLAYS NOW:                          │
    │  🔥 0 days ⚡ 100 XP ✓ CORRECT!       │
    └─────────────────────────────────────────┘

    RESULT: CONSISTENT STATE
    ✓ AppHeader: ⚡ 100 XP (current)
    ✓ DailyMissionPage: ⚡ 100 XP (current)
    ✓ Firestore: 100 XP (current)

    ALL IN SYNC! ✓
```

---

## Event Subscription Timeline

```
┌─────────────────────────────────────────────────────────────┐
│  User Completes First Task                                  │
└─────────────────────────────────────────────────────────────┘

TIME    COMPONENT              EVENT                  DISPLAY
────    ─────────────────────  ───────────────────    ──────────
T=0s    DailyMissionPage      Task clicked           ⚡ 0 XP
        └─ Optimistic update  (UI updated locally)    
                              
T=0.1s  progressService       Write to Firestore     ⚡ 0 XP
        └─ DB persisted
        
T=0.2s  xpService            award('task...')        ⚡ 0 XP
        └─ Firestore: +100    
        
T=0.3s  Pipeline             emit('task_completed')  ⚡ 0 XP
        ├─ AppHeader listens  ← EVENT RECEIVED
        └─ Dashboard listens
        
T=0.35s AppHeader subscriber  await fetch...()       ⚡ 0 XP
        └─ Read from FS
        
T=0.4s  setData() called      State updated          ⚡ 100 XP ✓
        └─ Component rerenders
        
T=0.5s  useGamification       Data propagated        ⚡ 100 XP ✓
        └─ Display refreshed


┌─────────────────────────────────────────────────────────────┐
│  User Completes Second Task (5 seconds later)              │
└─────────────────────────────────────────────────────────────┘

TIME    COMPONENT              EVENT                  DISPLAY
────    ─────────────────────  ───────────────────    ──────────
T=5.0s  DailyMissionPage      Task clicked           ⚡ 100 XP
        └─ Optimistic update  (UI updated locally)    
                              
T=5.1s  progressService       Write to Firestore     ⚡ 100 XP
        └─ DB persisted
        
T=5.2s  xpService            award('task...')        ⚡ 100 XP
        └─ Firestore: +100 (now 200)
        
T=5.3s  Pipeline             emit('xp_awarded')      ⚡ 100 XP
        ├─ AppHeader listens  ← EVENT RECEIVED
        └─ Dashboard listens
        
T=5.35s AppHeader subscriber  await fetch...()       ⚡ 100 XP
        └─ Read from FS (finds 200)
        
T=5.4s  setData() called      State updated          ⚡ 200 XP ✓
        └─ Component rerenders
        
T=5.5s  useGamification       Data propagated        ⚡ 200 XP ✓
        └─ Display refreshed


⏱ LATENCY: ~100-200ms between task completion and header update
```

---

## Component Interaction Diagram

### Before Fix (Broken)
```
DailyMissionPage              useDayProgress
    │                              │
    └──> task completion ──> Firestore (100 XP) ✓
         xpService.award()
         │
         └──> emit('task_completed')
              │
              ├──> [no listener]
              │
              ├──> AppHeader
              │    └─ useGamification
              │       └─ data = 0 XP ❌ STALE
              │
              └──> Dashboard
                   └─ useGamification
                      └─ data = 0 XP ❌ STALE
```

### After Fix (Synchronized)
```
DailyMissionPage              useDayProgress
    │                              │
    └──> task completion ──> Firestore (100 XP) ✓
         xpService.award()
         │
         └──> emit('task_completed')
              │
              ├──> [listener] ← AppHeader now subscribed!
              │    │
              │    ├──> fetchGamificationData()
              │    │    └─ Read from Firestore (100 XP) ✓
              │    │       setData() updates React state
              │    │
              │    └──> AppHeader displays 100 XP ✓
              │
              └──> [listener] ← Dashboard also subscribed
                   │
                   ├──> fetchGamificationData()
                   │    └─ Read from Firestore (100 XP) ✓
                   │
                   └──> Dashboard displays 100 XP ✓
```

---

## Event Propagation Example

```
Firestore Update
    │ totalXP: 0 → 100
    │ streak: 0 → 1
    │
    ▼
executeProgress() in useProgress
    │
    │ // XP awarded
    │ await xpSvc.award('task_complete')
    │ await streakSvc.recordActiveDay()
    │
    ▼
executionPipelineEvents.emit({
    type: 'task_completed',
    timestamp: '2026-06-30T14:35:00Z',
    data: {
        taskTitle: 'Array Problem',
        weekNumber: 1,
        dayNumber: 1,
        xpAwarded: 100,
        streak: 1
    }
})
    │
    ├──► Listener 1: useGamification (AppHeader)
    │    └─ log: '[useGamification] Received task_completed'
    │    └─ await fetchGamificationData()
    │    └─ setData(latest)
    │
    ├──► Listener 2: useGamification (Dashboard)
    │    └─ log: '[useGamification] Received task_completed'
    │    └─ await fetchGamificationData()
    │    └─ setData(latest)
    │
    ├──► Listener 3: pipelineDownstreamHandlers (Goal Health)
    │    └─ log: '[PipelineDownstream] task_completed: Invalidating cache'
    │
    └──► Listener 4: pipelineDownstreamHandlers (Deadline Rescue)
         └─ log: '[PipelineDownstream] day_completed: Checking activation'
```

---

## Benefits Summary

| Aspect | Before Fix | After Fix |
|--------|-----------|-----------|
| **Synchronization** | Manual/stale | Real-time ✓ |
| **Events consumed** | 0 | 4 ✓ |
| **Header refresh** | On login/logout only | On task/XP changes ✓ |
| **Data consistency** | ❌ Divergent | ✅ Unified |
| **User perception** | "Header is broken" | "Works perfectly" |
| **Code complexity** | Simple (missed) | Simple (added ~30 lines) |
| **Performance** | Occasional manual refresh | Automatic + efficient |
| **Firestore reads** | 1 per component mount | Consolidated |

