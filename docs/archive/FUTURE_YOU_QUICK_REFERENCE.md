# Future You — Quick Reference

## What is Future You?

**Future You** predicts where the user will be if they continue at their current pace. It's NOT a roadmap or goal analysis — it's a personalized career simulation based on actual execution patterns.

## Key Principle

**ONE AI REQUEST**  
Everything comes from a single Gemini call. No chaining, no multiple requests.

## Usage

### Generate a Prediction

```typescript
import { FutureYouService } from './services/futureYouService';
import { getFutureYouRepository } from './repositories';

const service = new FutureYouService(getFutureYouRepository());

const prediction = await service.generatePrediction({
  // Goal & Roadmap (from existing services)
  currentGoal: "...",
  goalType: "...",
  deadline: "2024-12-31",
  difficulty: "medium",
  feasibility: "feasible",
  executionMode: "adaptive",
  roadmapVersion: 1,
  totalWeeks: 12,
  completedWeeks: 3,
  currentWeek: 4,
  remainingTopics: ["React", "TypeScript"],

  // Progress (from progressService)
  overallCompletionPct: 25,
  completedTasks: 15,
  totalTasks: 60,
  completedDays: 10,
  totalXP: 1500,
  level: 3,
  achievementCount: 5,

  // Streaks (from streakService)
  currentStreak: 7,
  longestStreak: 14,
  streakActiveToday: true,
  totalActiveDays: 20,

  // Goal Health
  goalHealthScore: 78,
  goalHealthLevel: "healthy",
  healthTrend: "up",
  burnoutRisk: "low",
  deadlineRisk: "low",
  deadlineStatus: "on_track",
  estimatedCompletionDate: "2024-12-20",

  // Execution Intelligence
  interviewReadinessScore: 65,
  strengths: ["Consistent learning", "Strong project work"],
  weaknesses: ["Skips revision tasks"],
  behaviourPatterns: ["High weekday consistency"],

  // Daily Mission History
  missedTasksCount: 3,
  revisionTasksCompletedCount: 5,
  revisionTasksTotalCount: 10,
  projectTasksCompletedCount: 8,
  projectTasksTotalCount: 10,
  practiceTasksCompletedCount: 12,
  practiceTasksTotalCount: 15,

  // Topic Performance
  topicsWithHighCompletion: ["JavaScript", "HTML/CSS"],
  topicsWithLowCompletion: ["Testing"],

  // Deadline Rescue
  deadlineRescueActive: false,
  replanCount: 0,
});
```

### Get Latest Prediction (from cache)

```typescript
const latest = await service.getLatestPrediction();

if (latest) {
  console.log(latest.careerNarrative);
  console.log(latest.predictedSkills);
  console.log(latest.estimatedInterviewConfidence);
}
```

### Get Prediction History

```typescript
const history = await service.getPredictionHistory(10); // last 10
```

### Clear Prediction

```typescript
await service.clearPrediction(); // Use when starting new goal
```

## Prediction Structure

```typescript
interface FutureYouPrediction {
  // AI-generated content
  careerNarrative: string;              // 2-3 paragraphs
  predictedSkills: string[];            // 3-8 skills
  biggestStrengths: string[];           // 2-4 items
  biggestWeaknesses: string[];          // 2-4 items
  internshipReadiness: boolean;         // Will they be ready?
  estimatedInterviewConfidence: number; // 0-100
  estimatedOffers: number;              // 0-10 (clearly a prediction)
  personalizedRecommendations: string[]; // 3-6 items
  confidence: number;                   // 0-100 AI confidence
  
  // Metadata
  predictedAt: string;                  // ISO timestamp
  targetDays: number;                   // Days until target date
}
```

## Caching

### Automatic
- Uses `aiRequestManager` smart cache
- Multi-layer: Memory → Firestore → LocalStorage
- TTL: 24 hours
- Cache key based on:
  - Goal + roadmap version
  - Completion % (5% buckets)
  - Week number
  - Goal health (10-point buckets)
  - Deadline status
  - Streak, burnout risk
  - Execution mode

### Manual Invalidation
```typescript
import { aiRequestManager } from './ai/core/aiRequestManager';

await aiRequestManager.invalidate('FutureYou', cacheKeyInputs, userId);
```

## Storage

### Authenticated Users (Firestore)
```
users/{uid}/futureSimulation/
  latest/              ← Current prediction
  history/{timestamp}  ← Immutable history
```

### Unauthenticated (LocalStorage)
```javascript
localStorage['futureYou_latest']   // Current
localStorage['futureYou_history']  // Array (last 30)
```

## When to Generate

✅ **Generate when:**
- User navigates to Future You page for first time
- User clicks "Refresh Prediction"
- Cache expired (24h+)
- Major progress milestone (week completed)

❌ **Don't generate when:**
- Minor task completions
- Page refresh with valid cache
- Quick navigation

## Integration Tips

### 1. Gather Data from Existing Services

```typescript
// Don't duplicate logic — reuse services
const goalData = await goalService.getCurrentGoal();
const roadmap = await roadmapService.getRoadmap();
const progress = await progressService.getProgress();
const health = await goalHealthService.getLatest();
const intelligence = await executionIntelligenceService.getLatest();

// Combine into context
const context = {
  currentGoal: goalData.goal,
  roadmapVersion: roadmap.version,
  overallCompletionPct: progress.completionPct,
  // ... etc
};
```

### 2. Handle Loading States

```typescript
const [prediction, setPrediction] = useState<FutureYouPrediction | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function load() {
    // Check cache first
    const cached = await service.getLatestPrediction();
    if (cached) {
      setPrediction(cached);
      setLoading(false);
      return;
    }

    // Generate if no cache
    const fresh = await service.generatePrediction(context);
    setPrediction(fresh);
    setLoading(false);
  }
  
  load();
}, []);
```

### 3. Manual Refresh

```typescript
async function handleRefresh() {
  setLoading(true);
  const fresh = await service.generatePrediction(context);
  setPrediction(fresh);
  setLoading(false);
}
```

## Error Handling

Service never throws — always returns null on failure:

```typescript
const prediction = await service.generatePrediction(context);

if (!prediction) {
  // Show error state or fallback UI
  return <ErrorMessage />;
}

// Safe to use prediction
```

## Display Guidelines

### Page Heading
```
✨ Future You
```

### Subtitle
```
If you continue at your current pace, here's where you're 
likely to be in the next {targetDays} days.
```

### Sections
1. **Career Narrative** (hero section)
2. **Predicted Skills** (grid/badges)
3. **Your Strengths** (cards with icons)
4. **Areas to Improve** (cards with actions)
5. **Readiness Indicators**
   - Internship ready: ✅ / ❌
   - Interview confidence: Progress bar
   - Estimated offers: Number with disclaimer
6. **Personalized Recommendations** (actionable list)

### Disclaimers
- Clearly mark "Estimated Offers" as a prediction
- Add note: "This simulation is based on your current execution patterns. Your actual results will vary based on market conditions, interview performance, and continued effort."

## Testing

```typescript
// Mock the service for tests
const mockRepo = {
  saveLatest: jest.fn(),
  getLatest: jest.fn().mockResolvedValue(mockPrediction),
  appendHistory: jest.fn(),
  getHistory: jest.fn().mockResolvedValue([]),
  clearLatest: jest.fn(),
};

const service = new FutureYouService(mockRepo);
```

## Performance

- **First load**: ~2-3s (AI generation)
- **Cached load**: <100ms (memory/storage)
- **Cache hit rate**: >90% for typical usage
- **Firestore reads**: 1 per page load (cached)
- **Firestore writes**: 2 per generation (latest + history)

## Common Issues

### Issue: Predictions seem outdated
**Solution**: Check cache expiry (24h default). Consider forcing refresh after major milestones.

### Issue: Predictions not personalized
**Solution**: Verify all context data is being passed correctly. Check AI confidence score.

### Issue: Slow generation
**Solution**: Normal for first generation. Check cache hit logs. Ensure deduplication working.

### Issue: Different predictions on refresh
**Solution**: Expected if cache expired and data changed. Cache key includes rounded values for stability.

---

**Remember**: Future You reuses everything. Never duplicate repository logic!
