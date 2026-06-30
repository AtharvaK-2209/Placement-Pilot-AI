# Execution Intelligence Agent — Integration Guide

This guide shows how to integrate the Execution Intelligence Agent into your application.

---

## Quick Start

### 1. Import Required Modules

```typescript
import { useState, useEffect } from 'react';
import ExecutionIntelligenceCard from '../components/ExecutionIntelligenceCard';
import { generateExecutionIntelligence } from '../ai/executionIntelligence/executionIntelligence';
import type { ExecutionIntelligenceInput, ExecutionIntelligenceScore } from '../ai/executionIntelligence/executionIntelligence.schema';
import { getExecutionIntelligenceRepository } from '../repositories';
```

---

## 2. Build Input Data

The agent requires comprehensive execution data. Here's how to gather it:

```typescript
async function buildExecutionIntelligenceInput(): Promise<ExecutionIntelligenceInput> {
  // Get current user
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  // Get app state
  const state = await getAppState(); // Your state management
  if (!state.goal || !state.goalAnalysis || !state.roadmap) {
    throw new Error('Incomplete state — goal, analysis, and roadmap required');
  }

  // Get progress data
  const progressRepo = getProgressRepository();
  const progress = await progressRepo.getProgress();
  if (!progress) throw new Error('No progress data found');

  // Get roadmap progress
  const roadmapProgressRepo = getRoadmapProgressRepository();
  const roadmapProgress = await roadmapProgressRepo.getProgress();
  if (!roadmapProgress) throw new Error('No roadmap progress found');

  // Get goal health (optional but recommended)
  const goalHealthRepo = getGoalHealthRepository();
  const goalHealth = await goalHealthRepo.getHealth();

  // Calculate derived metrics
  const totalTasks = Object.values(progress.days).reduce(
    (sum, day) => sum + day.tasks.length,
    0
  );

  const completedTasks = Object.values(progress.days).reduce(
    (sum, day) => sum + day.tasks.filter(t => t.completed).length,
    0
  );

  const completedDays = Object.values(progress.days).filter(
    (day) => day.completionPercent === 100
  ).length;

  const startedDays = Object.keys(progress.days).length;
  const consistencyRate = startedDays > 0
    ? Math.round((completedDays / startedDays) * 100)
    : 0;

  // Calculate remaining time
  const deadline = new Date(state.goal.deadline);
  const now = new Date();
  const remainingMs = deadline.getTime() - now.getTime();
  const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
  const remainingHours = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60)));

  // Calculate weekly completion pattern (last 4 weeks)
  const weeklyCompletionPattern: number[] = [];
  for (let w = Math.max(1, roadmapProgress.currentWeek - 3); w <= roadmapProgress.currentWeek; w++) {
    const weekStatus = roadmapProgress.weekStatuses.find(ws => ws.weekNumber === w);
    weeklyCompletionPattern.push(weekStatus?.completionPercent ?? 0);
  }

  // Analyze task patterns
  let missedTasksCount = 0;
  let revisionTasksCompleted = 0;
  let revisionTasksTotal = 0;
  let projectTasksCompleted = 0;
  let projectTasksTotal = 0;
  let practiceTasksCompleted = 0;
  let practiceTasksTotal = 0;

  // Get daily missions and analyze
  for (const [key, mission] of Object.entries(state.dailyMissions || {})) {
    const dayProgress = progress.days[key];
    if (!dayProgress) continue;

    // Count by task type
    const allTasks = [
      ...mission.learningTasks,
      ...mission.practiceTasks,
      ...mission.revisionTasks,
    ];

    allTasks.forEach(task => {
      const completed = dayProgress.tasks.find(t => t.taskTitle === task.title)?.completed ?? false;
      
      if (!completed && dayProgress.completionPercent > 0) {
        missedTasksCount++;
      }

      if (task.type === 'revision') {
        revisionTasksTotal++;
        if (completed) revisionTasksCompleted++;
      } else if (task.type === 'project') {
        projectTasksTotal++;
        if (completed) projectTasksCompleted++;
      } else if (task.type === 'practice') {
        practiceTasksTotal++;
        if (completed) practiceTasksCompleted++;
      }
    });
  }

  // Detect strong/weak topics (simplified — enhance based on your roadmap structure)
  const topicsWithHighCompletion: string[] = [];
  const topicsWithLowCompletion: string[] = [];

  // Analyze by week theme/topics
  state.roadmap.weeks.forEach(week => {
    const weekStatus = roadmapProgress.weekStatuses.find(ws => ws.weekNumber === week.week);
    if (!weekStatus) return;

    const topics = week.modules.map(m => m.title);
    
    if (weekStatus.completionPercent >= 80) {
      topicsWithHighCompletion.push(...topics);
    } else if (weekStatus.completionPercent < 50) {
      topicsWithLowCompletion.push(...topics);
    }
  });

  // Build input
  const input: ExecutionIntelligenceInput = {
    // Goal & Analysis
    currentGoal: state.goal.goal,
    goalType: state.goal.goalType,
    deadline: state.goal.deadline,
    difficulty: state.goalAnalysis.difficulty,
    feasibility: state.goalAnalysis.feasibility,
    executionMode: state.goalAnalysis.executionMode,

    // Roadmap
    roadmapVersion: 1, // TODO: Get from roadmap versioning system
    totalWeeks: state.roadmap.totalWeeks,
    completedWeeks: roadmapProgress.completedWeeks,
    currentWeek: roadmapProgress.currentWeek,
    remainingWeeks: state.roadmap.totalWeeks - roadmapProgress.completedWeeks,

    // Time
    remainingDays,
    remainingHours,
    weeklyHours: state.goal.weeklyHours,

    // Progress
    overallCompletionPct: roadmapProgress.overallCompletion,
    completedTasks,
    totalTasks,
    completedDays,

    // XP & Gamification
    totalXP: progress.totalXP,
    level: Math.floor(progress.totalXP / 500) + 1,
    achievementCount: progress.achievements.length,

    // Streaks
    currentStreak: progress.streak.currentStreak,
    longestStreak: progress.streak.longestStreak,
    streakActiveToday: progress.streak.lastActiveDate === new Date().toISOString().split('T')[0],
    totalActiveDays: progress.streak.totalActiveDays,

    // Consistency
    consistencyRate,

    // Goal Health
    goalHealthScore: goalHealth?.score ?? 0,
    goalHealthLevel: goalHealth?.level ?? 'healthy',

    // Weekly Completion Pattern
    weeklyCompletionPattern,

    // Replanning
    replanCount: 0, // TODO: Get from replanning history

    // Daily Mission History
    missedTasksCount,
    revisionTasksCompletedCount: revisionTasksCompleted,
    revisionTasksTotalCount: revisionTasksTotal,
    projectTasksCompletedCount: projectTasksCompleted,
    projectTasksTotalCount: projectTasksTotal,
    practiceTasksCompletedCount: practiceTasksCompleted,
    practiceTasksTotalCount: practiceTasksTotal,

    // Strong/Weak Topics
    topicsWithHighCompletion: [...new Set(topicsWithHighCompletion)].slice(0, 5),
    topicsWithLowCompletion: [...new Set(topicsWithLowCompletion)].slice(0, 5),
  };

  return input;
}
```

---

## 3. Create Component Hook

```typescript
export function useExecutionIntelligence() {
  const [analysis, setAnalysis] = useState<ExecutionIntelligenceScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  // Load cached analysis on mount
  useEffect(() => {
    async function loadCached() {
      try {
        const repo = getExecutionIntelligenceRepository();
        const cached = await repo.getIntelligence();
        if (cached) setAnalysis(cached);
      } catch (e) {
        console.error('Failed to load cached analysis:', e);
      }
    }
    loadCached();
  }, []);

  const refresh = async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      // Build input
      const input = await buildExecutionIntelligenceInput();

      // Call AI agent
      const response = await generateExecutionIntelligence(
        input,
        user?.uid,
        forceRefresh
      );

      if (response.success) {
        setAnalysis(response.data);

        // Persist to repository
        const repo = getExecutionIntelligenceRepository();
        await repo.saveIntelligence(response.data);

        // Save history entry
        await repo.saveHistory({
          overallPerformance: response.data.overallPerformance,
          strengths: response.data.strengths,
          weaknesses: response.data.weaknesses,
          behaviourPatterns: response.data.behaviourPatterns,
          recommendations: response.data.recommendations,
          burnoutRisk: response.data.burnoutRisk,
          deadlineRisk: response.data.deadlineRisk,
          interviewReadiness: response.data.interviewReadiness,
          motivationalMessage: response.data.motivationalMessage,
          confidence: response.data.confidence,
          evaluatedAt: response.data.computedAt,
          roadmapVersion: input.roadmapVersion,
          currentWeek: input.currentWeek,
          overallCompletion: input.overallCompletionPct,
        });
      } else {
        setError('Failed to generate execution intelligence analysis');
      }
    } catch (e) {
      console.error('Execution intelligence error:', e);
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return {
    analysis,
    loading,
    error,
    refresh,
  };
}
```

---

## 4. Use in Your Page

```typescript
export default function ProgressPage() {
  const { analysis, loading, error, refresh } = useExecutionIntelligence();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Progress Analytics</h1>
      
      <ExecutionIntelligenceCard
        analysis={analysis}
        loading={loading}
        error={error}
        onRefresh={() => refresh(true)}
      />
    </div>
  );
}
```

---

## 5. Trigger Automatic Refresh

### On Dynamic Replanning

```typescript
// In your replanning service/handler
async function handleDynamicReplanning() {
  // ... existing replanning logic ...

  // After successful replan, refresh execution intelligence
  try {
    const input = await buildExecutionIntelligenceInput();
    const response = await generateExecutionIntelligence(input, user.uid, true);
    
    if (response.success) {
      const repo = getExecutionIntelligenceRepository();
      await repo.saveIntelligence(response.data);
      // Notify UI to update
    }
  } catch (e) {
    console.error('Failed to refresh execution intelligence:', e);
    // Non-blocking — replan succeeded even if intelligence refresh failed
  }
}
```

### On Goal Health Refresh

```typescript
// In your goal health refresh handler
async function handleGoalHealthRefresh() {
  // ... refresh goal health ...

  // Also refresh execution intelligence
  try {
    const input = await buildExecutionIntelligenceInput();
    const response = await generateExecutionIntelligence(input, user.uid, true);
    
    if (response.success) {
      const repo = getExecutionIntelligenceRepository();
      await repo.saveIntelligence(response.data);
    }
  } catch (e) {
    console.error('Failed to refresh execution intelligence:', e);
  }
}
```

---

## 6. Access History

```typescript
async function getIntelligenceHistory() {
  const repo = getExecutionIntelligenceRepository();
  const history = await repo.getHistory();
  
  // Display history timeline
  return history.map(entry => ({
    date: new Date(entry.evaluatedAt),
    performance: entry.overallPerformance,
    interviewReadiness: entry.interviewReadiness,
    burnoutRisk: entry.burnoutRisk,
    deadlineRisk: entry.deadlineRisk,
  }));
}
```

---

## Testing

### 1. Test with Mock Data

```typescript
const mockInput: ExecutionIntelligenceInput = {
  currentGoal: 'Get placed in a product-based company',
  goalType: 'placement',
  deadline: '2027-12-31',
  difficulty: 'Medium',
  feasibility: 'High',
  executionMode: 'Balanced',
  roadmapVersion: 1,
  totalWeeks: 24,
  completedWeeks: 8,
  currentWeek: 9,
  remainingWeeks: 16,
  remainingDays: 180,
  remainingHours: 4320,
  weeklyHours: 15,
  overallCompletionPct: 35,
  completedTasks: 145,
  totalTasks: 400,
  completedDays: 56,
  totalXP: 7250,
  level: 15,
  achievementCount: 8,
  currentStreak: 7,
  longestStreak: 12,
  streakActiveToday: true,
  totalActiveDays: 56,
  consistencyRate: 85,
  goalHealthScore: 78,
  goalHealthLevel: 'healthy',
  weeklyCompletionPattern: [80, 85, 75, 90],
  replanCount: 0,
  missedTasksCount: 12,
  revisionTasksCompletedCount: 18,
  revisionTasksTotalCount: 25,
  projectTasksCompletedCount: 2,
  projectTasksTotalCount: 4,
  practiceTasksCompletedCount: 95,
  practiceTasksTotalCount: 120,
  topicsWithHighCompletion: ['DSA', 'SQL', 'Java'],
  topicsWithLowCompletion: ['Spring Boot', 'Projects'],
};

const response = await generateExecutionIntelligence(mockInput);
console.log(response);
```

### 2. Verify Cache Behavior

```typescript
// First call — should hit Gemini
const response1 = await generateExecutionIntelligence(input, user.uid, false);
console.log('Cache hit:', !response1.cacheHit); // false (fresh call)

// Second call — should hit cache
const response2 = await generateExecutionIntelligence(input, user.uid, false);
console.log('Cache hit:', response2.cacheHit); // true (cached)

// Force refresh — should hit Gemini again
const response3 = await generateExecutionIntelligence(input, user.uid, true);
console.log('Cache hit:', response3.cacheHit); // false (forced refresh)
```

---

## Error Handling

### Graceful Degradation

```typescript
try {
  const response = await generateExecutionIntelligence(input, user.uid);
  
  if (!response.success) {
    // Show cached analysis if available
    const repo = getExecutionIntelligenceRepository();
    const cached = await repo.getIntelligence();
    
    if (cached) {
      return {
        analysis: cached,
        stale: true,
        error: 'Using cached analysis (AI unavailable)',
      };
    }
    
    return {
      analysis: null,
      error: 'Failed to generate analysis',
    };
  }
  
  return {
    analysis: response.data,
    stale: false,
  };
} catch (e) {
  console.error('Unexpected error:', e);
  return {
    analysis: null,
    error: 'An unexpected error occurred',
  };
}
```

---

## Best Practices

### 1. Don't Over-Refresh
- Respect the 2-hour cache TTL
- Only force refresh when meaningful changes occur
- Avoid refresh on every page load

### 2. Handle Loading States
- Show loading spinner during AI call
- Display cached data immediately while refreshing
- Provide clear feedback when analysis is stale

### 3. Error Recovery
- Always fall back to cached analysis
- Show user-friendly error messages
- Log errors for debugging but don't block UI

### 4. Data Quality
- Ensure all input data is accurate
- Validate data before calling AI
- Handle missing/incomplete data gracefully

### 5. Privacy
- Never log sensitive user data
- Respect user preferences for AI features
- Provide opt-out mechanism if needed

---

## Troubleshooting

### "Incomplete state" Error
**Cause**: Missing goal, analysis, or roadmap  
**Fix**: Ensure user has completed onboarding flow

### "No progress data found" Error
**Cause**: User hasn't started any tasks  
**Fix**: Check if user has progress; show empty state if needed

### AI Returns Low Confidence
**Cause**: Insufficient historical data  
**Fix**: Normal early in journey; confidence improves over time

### Cache Not Working
**Cause**: Cache key mismatch or TTL expired  
**Fix**: Verify cache key includes all relevant input fields

### Quota Exceeded Error
**Cause**: Daily Gemini quota reached  
**Fix**: Show cached data; prompt retry after cooldown

---

## Next Steps

1. Add the component to your desired page
2. Implement data gathering logic
3. Test refresh flow
4. Verify persistence
5. Monitor AI performance
6. Gather user feedback

---

**Questions?** Refer to `PHASE_8_SUMMARY.md` for architecture details.
