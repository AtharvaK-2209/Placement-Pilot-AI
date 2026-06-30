# Phase 8.1 Architecture — Enhanced Goal Health Dashboard

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │              GoalHealthCard Component                 │    │
│  │                                                       │    │
│  │  Score + Trend    Health Level    Confidence         │    │
│  │    82 ↑ +6         Healthy          94%              │    │
│  │                                                       │    │
│  │  ┌──────────┬──────────┬──────────┬──────────┐      │    │
│  │  │  Compl   │  Streak  │ Burnout  │   ETA    │      │    │
│  │  │   68%    │ 🔥18 Days│   Low    │ 45 days  │      │    │
│  │  └──────────┴──────────┴──────────┴──────────┘      │    │
│  │                                                       │    │
│  │  Summary, Strengths, Weaknesses, Recommendations     │    │
│  │  [Mini Trend Graph - Last 7 Evaluations]            │    │
│  └───────────────────────────────────────────────────────┘    │
│                           ↑                                    │
│                           │ GoalHealthScore                    │
└───────────────────────────┼────────────────────────────────────┘
                            │
┌───────────────────────────┼────────────────────────────────────┐
│                    React Hook Layer                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │              useGoalHealth Hook                      │     │
│  │                                                      │     │
│  │  refresh(deadline?: string)                         │     │
│  │    ├─ Gather progress data                          │     │
│  │    ├─ Calculate avgWeeklyProgress (deterministic)   │     │
│  │    ├─ Calculate remainingHours (deterministic)      │     │
│  │    ├─ Compute effectiveDeadline (if needed)         │     │
│  │    └─ Call generateGoalHealth(input)                │     │
│  │                                                      │     │
│  │  loadCached()                                       │     │
│  │    └─ Load from repository without AI call          │     │
│  └──────────────────────────────────────────────────────┘     │
│                           ↓                                    │
└───────────────────────────┼────────────────────────────────────┘
                            │ GoalHealthInput (extended)
                            │
┌───────────────────────────┼────────────────────────────────────┐
│                    AI Agent Layer                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │         generateGoalHealth Agent                     │     │
│  │                                                      │     │
│  │  ╔═══════════════════════════════════════════════╗  │     │
│  │  ║          AI Generation (Gemini)               ║  │     │
│  │  ║                                               ║  │     │
│  │  ║  • score                                      ║  │     │
│  │  ║  • level                                      ║  │     │
│  │  ║  • burnoutRisk ✨ (NEW)                       ║  │     │
│  │  ║  • summary                                    ║  │     │
│  │  ║  • strengths                                  ║  │     │
│  │  ║  • weaknesses (structured)                    ║  │     │
│  │  ║  • recommendations                            ║  │     │
│  │  ║  • confidence                                 ║  │     │
│  │  ╚═══════════════════════════════════════════════╝  │     │
│  │                     ↓                                │     │
│  │  ╔═══════════════════════════════════════════════╗  │     │
│  │  ║      Post-Processing (Deterministic)          ║  │     │
│  │  ║                                               ║  │     │
│  │  ║  calculateETA(input) →                        ║  │     │
│  │  ║    • estimatedCompletionDate                  ║  │     │
│  │  ║    • estimatedDaysRemaining                   ║  │     │
│  │  ║    • deadlineDelta                            ║  │     │
│  │  ║                                               ║  │     │
│  │  ║  From input (pass-through):                   ║  │     │
│  │  ║    • overallCompletion                        ║  │     │
│  │  ║    • currentStreak                            ║  │     │
│  │  ╚═══════════════════════════════════════════════╝  │     │
│  └──────────────────────────────────────────────────────┘     │
│                           ↓                                    │
└───────────────────────────┼────────────────────────────────────┘
                            │ Complete GoalHealthScore
                            │
┌───────────────────────────┼────────────────────────────────────┐
│                  Repository Layer                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │       GoalHealthRepository (Interface)               │     │
│  │                                                      │     │
│  │  • saveHealth(score)    ─► Latest evaluation        │     │
│  │  • getHealth()          ─► Cached result            │     │
│  │  • saveHistory(entry)   ─► Immutable log            │     │
│  │  • getHistory()         ─► Full timeline            │     │
│  └──────────────────────────────────────────────────────┘     │
│                ↓                         ↓                     │
│  ┌───────────────────┐      ┌───────────────────┐            │
│  │   Firestore       │      │   LocalStorage    │            │
│  │  (Authenticated)  │      │   (Anonymous)     │            │
│  └───────────────────┘      └───────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Refresh Goal Health

### Step-by-Step Execution

```
1. User Clicks "Refresh Goal Health"
   ├─ Event: onClick handler
   └─ Action: refreshHealth(goalInput?.deadline)

2. Hook: useGoalHealth.refresh(deadline)
   ├─ Set loading state
   ├─ Gather data from repositories:
   │  ├─ Progress (ProgressRepository)
   │  ├─ Streak (StreakService)
   │  ├─ Achievements (AchievementService)
   │  ├─ XP/Level (XPService)
   │  └─ Roadmap versions (RoadmapService)
   │
   ├─ Calculate metrics deterministically:
   │  ├─ completedWeeks (count from progress)
   │  ├─ overallCompletionPct (completed/total * 100)
   │  ├─ consistencyRate (completedDays/startedDays * 100)
   │  ├─ avgWeeklyProgress (completedWeeks / elapsed * 100)
   │  └─ remainingHours (totalHours * remaining%)
   │
   └─ Build GoalHealthInput object

3. Agent: generateGoalHealth(input, userId)
   ├─ Check AI Request Manager cache
   │  └─ If cached & !forceRefresh → return cached
   │
   ├─ Build prompt from input
   ├─ Call Gemini via safeGenerateContent()
   ├─ Parse JSON response
   ├─ Validate schema
   │
   ├─ Post-process (deterministic):
   │  ├─ calculateETA({completedWeeks, totalWeeks, deadline})
   │  │  ├─ weeklyRate = completedWeeks / weeksElapsed
   │  │  ├─ remainingWeeks / weeklyRate
   │  │  ├─ today + (weeks * 7) days
   │  │  └─ compare with deadline
   │  │
   │  └─ Populate fields:
   │     ├─ estimatedCompletionDate ← ETA result
   │     ├─ estimatedDaysRemaining ← ETA result
   │     ├─ overallCompletion ← input.overallCompletionPct
   │     └─ currentStreak ← input.currentStreak
   │
   └─ Return GoalHealthResponse

4. Hook: Process Result
   ├─ Compute trend vs previous score
   ├─ Attach trend to result.data
   ├─ Save to GoalHealthRepository:
   │  ├─ saveHealth(score) ─► users/{uid}/goalHealth/latest
   │  └─ saveHistory(entry) ─► users/{uid}/goalHealth/history/{timestamp}
   │
   └─ Update React state

5. UI: Render GoalHealthCard
   ├─ Display score with trend badge
   ├─ Show 4-metric dashboard grid
   ├─ Render strengths/weaknesses/recommendations
   └─ Draw mini history graph
```

---

## Schema Evolution

### Before Phase 8.1
```typescript
interface GoalHealthScore {
  score:           number;
  level:           HealthLevel;
  summary:         string;
  strengths:       string[];
  weaknesses:      HealthWeakness[];
  recommendations: string[];
  confidence:      number;
  computedAt:      string;
  trend?:          HealthTrend;
}
```

### After Phase 8.1
```typescript
interface GoalHealthScore {
  // Existing (unchanged)
  score:           number;
  level:           HealthLevel;
  summary:         string;
  strengths:       string[];
  weaknesses:      HealthWeakness[];
  recommendations: string[];
  confidence:      number;
  computedAt:      string;
  trend?:          HealthTrend;
  
  // Phase 8.1 additions
  burnoutRisk:                BurnoutRisk;    // AI-generated
  estimatedCompletionDate:    string;         // Deterministic
  estimatedDaysRemaining:     number;         // Deterministic
  overallCompletion:          number;         // Deterministic
  currentStreak:              number;         // Pass-through
}
```

---

## ETA Calculation Algorithm

### Formula
```
Weekly Rate = completedWeeks / weeksElapsed
Remaining Time = remainingWeeks / weeklyRate
Completion Date = today + (remainingTime × 7) days
Deadline Delta = deadline - completionDate (in days)
```

### Example
```typescript
Input:
  completedWeeks = 8
  totalWeeks = 12
  deadline = 2026-08-12
  today = 2026-06-29

Calculation:
  remainingWeeks = 12 - 8 = 4
  weeklyRate = 8 / 8 = 1.0 (1 week per week)
  remainingTime = 4 / 1.0 = 4 weeks
  completionDate = 2026-06-29 + (4 × 7) = 2026-07-27
  deadlineDelta = 2026-08-12 - 2026-07-27 = 16 days early

Result:
  estimatedCompletionDate: "2026-07-27"
  estimatedDaysRemaining: 28
  onTrack: true
  deadlineDelta: +16 (early)
```

### Edge Cases
| Scenario | Handling |
|----------|----------|
| No progress yet | Assume 1 week/week default |
| Zero rate (stuck) | Same default assumption |
| Behind schedule | Negative delta (days late) |
| Ahead of schedule | Positive delta (days early) |
| Already complete | Days remaining = 0 |

---

## Burnout Risk Assessment

### AI Evaluation Logic
```
Inputs:
  - consistencyRate (0-100%)
  - currentStreak (days)
  - executionMode (Relaxed → Extreme)
  - replanCount (number)
  - missedDays (inferred from consistency)
  - streakActiveToday (boolean)

Decision Tree:
  IF consistencyRate > 75% AND streakActiveToday
    └─ LOW

  ELSE IF consistencyRate 50-75%
    └─ MEDIUM

  ELSE IF consistencyRate < 50%
    ├─ IF executionMode IN [Intensive, Extreme]
    │  └─ HIGH
    └─ ELSE
       └─ MEDIUM

  IF replanCount > 3
    └─ Increase risk level by 1

  IF currentStreak > 14
    └─ Decrease risk level by 1
```

---

## Caching Strategy

### AI Request Manager Integration
```typescript
Cache Key:
{
  roadmapVersion: number,
  completedWeeks: number,
  consistencyRate: number,
  currentStreak: number
}

TTL: 1 hour

Invalidation:
  - Manual refresh (forceRefresh = true)
  - Roadmap version change
  - Significant progress change (>5%)
```

### Cache Hit Scenarios
- User navigates away and returns within 1 hour
- Multiple components request same health data
- Page refresh without progress change

### Cache Miss Scenarios
- First evaluation
- TTL expired
- Manual refresh clicked
- Progress data changed significantly

---

## Performance Characteristics

### Timing Breakdown
```
Total Refresh Time: ~800-1200ms

1. Repository reads (parallel)     [200-400ms]
   ├─ Progress data
   ├─ Streak data
   ├─ Achievements
   └─ Roadmap versions

2. Metric calculations               [<5ms]
   ├─ Completion percentages
   ├─ Consistency rates
   └─ Remaining hours

3. AI call (Gemini)              [500-800ms]
   └─ Prompt: ~580 tokens
   └─ Response: ~400 tokens

4. Post-processing                   [<1ms]
   └─ calculateETA()

5. Repository writes (parallel)   [100-200ms]
   ├─ Save latest health
   └─ Append history entry

6. State update & render             [<10ms]
```

### Optimization Opportunities
1. **Parallel data fetching** — Already implemented ✓
2. **Cached responses** — Already implemented ✓
3. **Deterministic calculations** — Already optimized ✓
4. **Lazy history loading** — Consider for Phase 8.2

---

## Error Handling

### Failure Points & Recovery
```
1. Repository Read Failure
   ├─ Fallback: Use partial data or defaults
   └─ User sees: Warning message, cached score if available

2. AI Call Failure
   ├─ Retry: safeGenerateContent with fallback model
   └─ Ultimate failure: Return cached score or error state

3. Invalid AI Response
   ├─ Validation catches malformed JSON
   ├─ Apply default values where possible
   └─ Log warning, proceed with partial data

4. Repository Write Failure
   ├─ Score still returned to UI
   ├─ History may not be saved
   └─ Error logged, user notified

5. ETA Calculation Error
   ├─ Catch exception, use fallback
   ├─ Default to "deadline date" as estimate
   └─ Show warning badge
```

---

## State Management

### Component State Flow
```
RoadmapPage
  ├─ goalInput (from location.state)
  ├─ activeRoadmap (from RoadmapService)
  └─ calls refreshHealth(goalInput?.deadline)
       ↓
useGoalHealth Hook
  ├─ State:
  │  ├─ score: GoalHealthScore | null
  │  ├─ history: GoalHealthHistoryEntry[]
  │  ├─ loading: boolean
  │  └─ error: string | null
  │
  └─ Methods:
     ├─ refresh(deadline?: string)
     └─ loadCached()
          ↓
GoalHealthCard Component
  ├─ Props:
  │  ├─ score
  │  ├─ history
  │  ├─ loading
  │  ├─ error
  │  └─ onRefresh
  │
  └─ Renders:
     ├─ Score + Trend Badge
     ├─ 4-Metric Dashboard
     ├─ Summary
     ├─ Strengths/Weaknesses
     ├─ Recommendations
     └─ Mini History Graph
```

---

## Testing Scenarios

### Unit Tests
```typescript
describe('calculateETA', () => {
  test('on track scenario', () => { ... });
  test('behind schedule', () => { ... });
  test('ahead of schedule', () => { ... });
  test('no progress yet', () => { ... });
  test('deadline already passed', () => { ... });
});

describe('burnoutRisk validation', () => {
  test('accepts valid values', () => { ... });
  test('rejects invalid values', () => { ... });
  test('defaults to low if missing', () => { ... });
});
```

### Integration Tests
```typescript
describe('Goal Health E2E', () => {
  test('full refresh cycle', async () => {
    // 1. Load progress data
    // 2. Call generateGoalHealth
    // 3. Verify all new fields present
    // 4. Check repository saves
    // 5. Verify UI updates
  });

  test('cached response', async () => {
    // 1. First call (fresh)
    // 2. Second call (should use cache)
    // 3. Verify no duplicate AI calls
  });
});
```

---

## Monitoring & Observables

### Key Metrics to Track
```
Performance:
  - AI call latency (p50, p95, p99)
  - Total refresh time
  - Cache hit rate

Accuracy:
  - ETA prediction accuracy (compare with actual)
  - Burnout risk correlation with user behavior

Usage:
  - Refresh frequency per user
  - Manual vs automatic refreshes
  - History entry count

Errors:
  - AI call failures
  - Repository write failures
  - Schema validation failures
```

---

## Future Enhancements

### Phase 8.2 Candidates
1. **Trend Analysis**
   - Week-over-week comparison
   - Velocity tracking (tasks/day)
   - Burnout pattern detection

2. **Predictive Alerts**
   - "You're trending toward missing deadline"
   - "Burnout risk increasing"
   - "On track to finish early"

3. **Detailed Breakdowns**
   - Per-topic health scores
   - Skill-level progress tracking
   - Time allocation insights

4. **Historical Accuracy**
   - Track ETA accuracy over time
   - Adjust algorithm based on user patterns
   - Personalized completion rates

---

## Summary

Phase 8.1 architecture successfully:
- ✅ Extends existing system without breaking changes
- ✅ Minimizes AI usage (1 new field)
- ✅ Maximizes deterministic calculations (5 fields)
- ✅ Preserves repository pattern
- ✅ Maintains performance targets
- ✅ Provides comprehensive dashboard UX

**Clean, efficient, and maintainable.**
