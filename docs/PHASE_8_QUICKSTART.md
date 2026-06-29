# Phase 8 — Execution Intelligence Agent — Quick Start Guide

Get the Execution Intelligence Agent running in **5 minutes**.

---

## 🚀 Quick Integration (Minimal Example)

### Step 1: Import the Component

```typescript
import ExecutionIntelligenceCard from '../components/ExecutionIntelligenceCard';
import { generateExecutionIntelligence } from '../ai/executionIntelligence/executionIntelligence';
import type { ExecutionIntelligenceScore } from '../ai/executionIntelligence/executionIntelligence.schema';
```

### Step 2: Add State

```typescript
const [analysis, setAnalysis] = useState<ExecutionIntelligenceScore | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Step 3: Create Minimal Input (for testing)

```typescript
const testInput = {
  // Goal
  currentGoal: 'Get placed in FAANG',
  goalType: 'placement',
  deadline: '2027-12-31',
  difficulty: 'Hard',
  feasibility: 'Moderate',
  executionMode: 'Intensive',
  
  // Roadmap
  roadmapVersion: 1,
  totalWeeks: 24,
  completedWeeks: 8,
  currentWeek: 9,
  remainingWeeks: 16,
  
  // Time
  remainingDays: 180,
  remainingHours: 4320,
  weeklyHours: 20,
  
  // Progress
  overallCompletionPct: 35,
  completedTasks: 145,
  totalTasks: 400,
  completedDays: 56,
  
  // Gamification
  totalXP: 7250,
  level: 15,
  achievementCount: 8,
  
  // Streaks
  currentStreak: 7,
  longestStreak: 12,
  streakActiveToday: true,
  totalActiveDays: 56,
  consistencyRate: 85,
  
  // Health
  goalHealthScore: 78,
  goalHealthLevel: 'healthy',
  
  // Patterns
  weeklyCompletionPattern: [80, 85, 75, 90],
  replanCount: 0,
  
  // Task patterns
  missedTasksCount: 12,
  revisionTasksCompletedCount: 18,
  revisionTasksTotalCount: 25,
  projectTasksCompletedCount: 2,
  projectTasksTotalCount: 4,
  practiceTasksCompletedCount: 95,
  practiceTasksTotalCount: 120,
  
  // Topics
  topicsWithHighCompletion: ['DSA', 'SQL', 'Java'],
  topicsWithLowCompletion: ['Spring Boot', 'Projects'],
};
```

### Step 4: Create Refresh Handler

```typescript
async function handleRefresh() {
  setLoading(true);
  setError(null);

  try {
    const response = await generateExecutionIntelligence(testInput);
    
    if (response.success) {
      setAnalysis(response.data);
    } else {
      setError('Failed to generate analysis');
    }
  } catch (e) {
    setError('An error occurred');
  } finally {
    setLoading(false);
  }
}
```

### Step 5: Render the Component

```typescript
<ExecutionIntelligenceCard
  analysis={analysis}
  loading={loading}
  error={error}
  onRefresh={handleRefresh}
/>
```

---

## ✅ Complete Minimal Example

```typescript
import { useState } from 'react';
import ExecutionIntelligenceCard from '../components/ExecutionIntelligenceCard';
import { generateExecutionIntelligence } from '../ai/executionIntelligence/executionIntelligence';
import type { ExecutionIntelligenceScore } from '../ai/executionIntelligence/executionIntelligence.schema';

export default function TestPage() {
  const [analysis, setAnalysis] = useState<ExecutionIntelligenceScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRefresh() {
    setLoading(true);
    setError(null);

    try {
      const testInput = {
        currentGoal: 'Get placed in FAANG',
        goalType: 'placement',
        deadline: '2027-12-31',
        difficulty: 'Hard',
        feasibility: 'Moderate',
        executionMode: 'Intensive',
        roadmapVersion: 1,
        totalWeeks: 24,
        completedWeeks: 8,
        currentWeek: 9,
        remainingWeeks: 16,
        remainingDays: 180,
        remainingHours: 4320,
        weeklyHours: 20,
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

      const response = await generateExecutionIntelligence(testInput);
      
      if (response.success) {
        setAnalysis(response.data);
      } else {
        setError('Failed to generate analysis');
      }
    } catch (e) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Execution Intelligence Test</h1>
      <ExecutionIntelligenceCard
        analysis={analysis}
        loading={loading}
        error={error}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
```

---

## 🔥 What You'll See

After clicking "Refresh", you'll see:

### 1. Overall Performance
A high-level assessment like:
- "Excellent execution — ahead of schedule"
- "Behind schedule but recovering well"
- "Strong pace with minor inconsistencies"

### 2. Interview Readiness
A score from 0-100 with a color-coded progress bar.

### 3. Risk Indicators
- **Burnout Risk**: Low/Medium/High
- **Deadline Risk**: Low/Medium/High

### 4. Strong Topics
Topics where you're performing well (>80% completion):
- "DSA"
- "SQL"
- "Java"

### 5. Needs Attention
Topics that need work (<50% completion):
- "Spring Boot"
- "Projects"

### 6. Behavioral Patterns (Expandable)
AI-detected habits like:
- "Strong weekday consistency"
- "Skips revision tasks occasionally"
- "Excellent morning discipline"

### 7. Coaching Recommendations (Expandable)
Specific, actionable advice:
- "Increase Spring Boot practice by 2 hours this week"
- "Attempt one mock interview by week end"
- "Continue your current DSA pace"

### 8. Motivational Message
Personalized encouragement:
> "You're ahead of schedule with 87% consistency. Your DSA skills are interview-ready. Keep this momentum and you'll achieve your goal before the deadline."

---

## 🎯 Next Steps

### For Testing
1. Copy the minimal example above
2. Create a test page or add to an existing page
3. Run your app
4. Click "Refresh" and watch the AI analyze

### For Production
1. Replace `testInput` with real data from your state
2. Add persistence (save to repository)
3. Add history tracking
4. Integrate with other pages
5. Add auto-refresh triggers (on replan, goal health refresh)

---

## 📚 Full Documentation

- **Complete Integration Guide**: `docs/EXECUTION_INTELLIGENCE_INTEGRATION.md`
- **Architecture Details**: `PHASE_8_SUMMARY.md`
- **Testing Checklist**: `docs/PHASE_8_CHECKLIST.md`
- **Example Page**: `src/pages/ProgressAnalyticsPage.tsx.example`

---

## 🐛 Troubleshooting

### "Cannot find module" error
**Fix**: Make sure you're importing from the correct paths:
```typescript
import { generateExecutionIntelligence } from '../ai/executionIntelligence/executionIntelligence';
```

### Build fails with TypeScript errors
**Fix**: Run `npm run build` to see specific errors. All types are properly exported.

### AI returns error
**Fix**: Check console for details. Common issues:
- Missing Gemini API key in `.env`
- Invalid input data (missing required fields)
- API quota exceeded

### Component doesn't display
**Fix**: Check that you're passing all required props:
- `analysis` (can be null initially)
- `loading` (boolean)
- `error` (string | null)
- `onRefresh` (function)

---

## ✨ Tips

### 1. Start Simple
Use the test input first to verify everything works, then replace with real data.

### 2. Check Console
The agent logs detailed information to the console for debugging.

### 3. Inspect Cache
After first refresh, second refresh should be instant (cached).

### 4. Force Refresh
Pass `forceRefresh: true` to bypass cache:
```typescript
await generateExecutionIntelligence(input, userId, true);
```

### 5. Handle Errors Gracefully
Always show cached data if AI fails:
```typescript
if (!response.success) {
  // Try to show cached data
  const repo = getExecutionIntelligenceRepository();
  const cached = await repo.getIntelligence();
  if (cached) setAnalysis(cached);
}
```

---

## 🎉 You're Ready!

The Execution Intelligence Agent is **production-ready** and follows the same battle-tested architecture as all other agents in the system.

**Happy coding! 🚀**
