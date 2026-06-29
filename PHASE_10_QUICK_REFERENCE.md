# Phase 10 — Gamification Quick Reference

## Overview

Phase 10 extends the existing XP system into a complete gamification backend with levels, badges, streaks, weekly goals, and milestones.

**Backend Only — No UI in Phase 10 Part 1**

---

## File Structure

```
src/
├── types/
│   └── domain.ts                      ← Extended with Badge, WeeklyGoal, Milestone, etc.
├── config/
│   └── gamificationConfig.ts          ← Level thresholds, badge & milestone definitions
├── services/
│   ├── gamificationService.ts         ← Main orchestrator
│   ├── levelService.ts                ← Level computation
│   ├── badgeService.ts                ← Badge unlock logic
│   ├── streakService.ts               ← Extended streak tracking
│   ├── weeklyGoalService.ts           ← Weekly goal management
│   ├── milestoneService.ts            ← Milestone tracking
│   └── index.ts                       ← Service exports
└── repositories/
    ├── ProgressRepository.ts          ← Extended interface
    ├── FirestoreProgressRepository.ts ← Extended implementation
    └── LocalStorageProgressRepository.ts ← Extended implementation

docs/
└── PHASE_10_GAMIFICATION_ARCHITECTURE.md
```

---

## Quick Start

### 1. Initialize Gamification Service

```typescript
import { GamificationService } from '../services';
import { progressRepository } from '../repositories';

const gamification = new GamificationService(progressRepository);
```

### 2. Award XP with Auto-Events

```typescript
// Task completion
const result = await gamification.onTaskComplete('Complete auth system');
console.log(result.xpAwarded, result.levelUp, result.badgesUnlocked);

// Day completion
const { xpResult, streak } = await gamification.onDayComplete(
  '2024-01-15',
  'Day 1: Setup'
);

// Week completion
await gamification.onWeekComplete(1, 'Foundations');
```

### 3. Unlock Milestones

```typescript
await gamification.unlockMilestone('goal-analysis-complete');
await gamification.unlockMilestone('roadmap-generated');
await gamification.unlockMilestone('future-you-generated');
```

### 4. Get Complete State

```typescript
const state = await gamification.getGamificationState();
// { level, totalXP, streak, badges, milestones, weeklyGoal, tasksCompleted }
```

---

## Core Types

### LevelState

```typescript
{
  level: number;          // Current level (1-15+)
  currentXP: number;      // XP within current level
  nextLevelXP: number;    // XP needed for next level
  progress: number;       // 0-100%
  title?: string;         // "Beginner", "Intermediate", etc.
}
```

### Badge

```typescript
{
  id: string;             // 'first-mission', '7-day-streak', etc.
  title: string;
  description: string;
  icon: string;           // Emoji
  locked: boolean;        // true = not yet unlocked
  unlockedAt?: ISODateTime;
  category: 'milestone' | 'streak' | 'completion' | 'special';
}
```

### WeeklyGoal

```typescript
{
  weekStartDate: ISODate;       // Monday
  weekEndDate: ISODate;         // Sunday
  targetMissions: number;       // e.g., 5
  completedMissions: number;
  targetXP: number;             // e.g., 500
  earnedXP: number;
  completed: boolean;
  completedAt?: ISODateTime;
}
```

### Milestone

```typescript
{
  id: string;             // 'first-login', 'roadmap-generated', etc.
  title: string;
  description: string;
  icon: string;           // Emoji
  unlocked: boolean;
  unlockedAt?: ISODateTime;
}
```

### ExtendedStreakState

```typescript
{
  currentStreak: number;    // consecutive days
  longestStreak: number;
  lastActiveDate: ISODate;
  totalActiveDays: number;
  weeklyStreak: number;     // consecutive weeks with 5+ days
  monthlyStreak: number;    // consecutive months with 20+ days
  missedDays: number;
}
```

---

## Configuration

### Level Thresholds (src/config/gamificationConfig.ts)

```typescript
export const LEVEL_THRESHOLDS = [
  { level: 1,  xpRequired: 0,     title: 'Beginner' },
  { level: 2,  xpRequired: 500,   title: 'Beginner' },
  { level: 3,  xpRequired: 1200,  title: 'Beginner' },
  { level: 4,  xpRequired: 2000,  title: 'Intermediate' },
  // ... up to level 15
];
```

### Badge Definitions

18 badges across 4 categories:
- **Milestone**: first-mission, roadmap-completed, future-you-generated, deadline-survivor, goal-analysis-complete
- **Streak**: 7-day, 14-day, 30-day, 100-day
- **Completion**: 10, 50, 100, 250, 500 tasks
- **Special**: first-week-complete, level-10-reached, perfect-week, execution-intelligence

### Milestone Definitions

9 milestones tracking journey progress:
- first-login
- goal-analysis-complete
- roadmap-generated
- first-mission-complete
- first-week-complete
- future-you-generated
- deadline-rescue-used
- execution-intelligence-used
- roadmap-complete

### Weekly Goal Targets

```typescript
export const WEEKLY_GOAL_TARGETS = {
  missions: 5,   // Complete 5 missions per week
  xp: 500,       // Earn 500 XP per week
};
```

---

## API Reference

### GamificationService

```typescript
// XP & Levels
awardXP(source, description): Promise<XPAwardResult>
getLevelState(): Promise<LevelState>

// Event handlers
onTaskComplete(taskTitle): Promise<XPAwardResult>
onDayComplete(dayDate, missionTitle): Promise<{ xpResult, streak }>
onWeekComplete(weekNumber, weekTitle): Promise<XPAwardResult>

// Streaks
updateStreakOnDayComplete(dayDate): Promise<ExtendedStreakState>
getExtendedStreak(): Promise<ExtendedStreakState>

// Badges
getAllBadges(): Promise<Badge[]>
getUnlockedBadges(): Promise<Badge[]>
unlockBadge(badgeId): Promise<Badge | null>

// Milestones
unlockMilestone(milestoneId): Promise<Milestone | null>
getAllMilestones(): Promise<Milestone[]>
getUnlockedMilestones(): Promise<Milestone[]>

// Weekly Goals
getCurrentWeeklyGoal(): Promise<WeeklyGoal>
getAllWeeklyGoals(): Promise<WeeklyGoal[]>
getCurrentWeekProgress(): Promise<{ missionProgress, xpProgress, overallProgress }>

// Complete State
getGamificationState(): Promise<GamificationState>
```

### LevelService

```typescript
getLevelState(): Promise<LevelState>
getLevelForXP(xp): number
checkLevelUp(xpToAdd): Promise<number | null>
```

### BadgeService

```typescript
getAllBadges(): Promise<Badge[]>
getUnlockedBadges(): Promise<Badge[]>
getLockedBadges(): Promise<Badge[]>
unlockBadge(badgeId): Promise<Badge | null>
checkAndUnlockBadges(): Promise<Badge[]>  // Auto-checks all conditions
```

### StreakService

```typescript
getExtendedStreak(): Promise<ExtendedStreakState>
updateStreakOnDayComplete(dayDate): Promise<ExtendedStreakState>
getStreakStats(): Promise<{ current, longest, weekly, monthly, totalActive, missedDays }>
```

### WeeklyGoalService

```typescript
getCurrentWeekGoal(): Promise<WeeklyGoal>
getAllWeeklyGoals(): Promise<WeeklyGoal[]>
updateWeeklyGoalProgress(): Promise<WeeklyGoal>
getCurrentWeekProgress(): Promise<{ missionProgress, xpProgress, overallProgress }>
getCompletedWeeklyGoalsCount(): Promise<number>
```

### MilestoneService

```typescript
getAllMilestones(): Promise<Milestone[]>
getUnlockedMilestones(): Promise<Milestone[]>
getLockedMilestones(): Promise<Milestone[]>
unlockMilestone(milestoneId): Promise<Milestone | null>
isMilestoneUnlocked(milestoneId): Promise<boolean>
getUnlockedCount(): Promise<number>
getTotalCount(): number
getCompletionPercentage(): Promise<number>
```

---

## Integration Points

### Where to Call Gamification

| Event | Call |
|-------|------|
| Task completed | `gamification.onTaskComplete(taskTitle)` |
| Day completed | `gamification.onDayComplete(date, title)` |
| Week completed | `gamification.onWeekComplete(weekNum, title)` |
| Goal analysis done | `gamification.unlockMilestone('goal-analysis-complete')` |
| Roadmap generated | `gamification.unlockMilestone('roadmap-generated')` |
| Future You run | `gamification.unlockMilestone('future-you-generated')` |
| Deadline Rescue used | `gamification.unlockMilestone('deadline-rescue-used')` |
| First login | `gamification.unlockMilestone('first-login')` |

---

## Data Persistence

### UserProgress Extension

```typescript
interface UserProgress {
  // Existing fields (unchanged)
  totalXP: number;
  xpLog: XPEntry[];
  streak: StreakState;
  achievements: Achievement[];
  
  // Phase 10 additions (optional)
  badges?: Badge[];
  weeklyGoals?: WeeklyGoal[];
  milestones?: Milestone[];
  extendedStreak?: ExtendedStreakState;
}
```

All data persists in single document:
- **Firestore**: `users/{uid}/progress/current`
- **LocalStorage**: `"pp_progress"`

### Repository Extensions

```typescript
interface ProgressRepository {
  // New methods
  getXPHistory(startDate, endDate): Promise<XPEntry[]>
  getTotalTasksCompleted(): Promise<number>
}
```

---

## XP Rewards Table

| Event | XP |
|-------|----|
| task_complete | 10 |
| day_complete | 50 |
| week_complete | 200 |
| streak_bonus | 25 |
| milestone | 100 |
| achievement | 150 |

---

## Badge Unlock Conditions

### Milestone Badges
- **first-mission**: completedDays >= 1
- **roadmap-completed**: milestone 'roadmap-complete' unlocked
- **future-you-generated**: milestone 'future-you-generated' unlocked
- **deadline-survivor**: milestone 'deadline-rescue-used' unlocked
- **goal-analysis-complete**: milestone 'goal-analysis-complete' unlocked

### Streak Badges
- **7-day-streak**: currentStreak >= 7
- **14-day-streak**: currentStreak >= 14
- **30-day-streak**: currentStreak >= 30
- **100-day-streak**: currentStreak >= 100

### Completion Badges
- **10-tasks-complete**: completedTasks >= 10
- **50-tasks-complete**: completedTasks >= 50
- **100-tasks-complete**: completedTasks >= 100
- **250-tasks-complete**: completedTasks >= 250
- **500-tasks-complete**: completedTasks >= 500

### Special Badges
- **first-week-complete**: completedWeeks >= 1
- **level-10-reached**: level >= 10
- **perfect-week**: completedWeeks >= 1
- **execution-intelligence**: milestone 'execution-intelligence-used' unlocked

---

## Example Flows

### Complete Task Flow

```typescript
// 1. User completes task
await progressService.updateTask(weekNum, dayNum, taskTitle, true);

// 2. Award XP
const result = await gamification.onTaskComplete(taskTitle);

// 3. Show level-up notification if applicable
if (result.levelUp) {
  showNotification(`Level ${result.newLevel}!`);
}

// 4. Show badge notifications
result.badgesUnlocked.forEach(badge => {
  showNotification(`Badge unlocked: ${badge.title}`);
});
```

### Complete Day Flow

```typescript
// 1. All tasks completed
const dayComplete = dayProgress.completionPercent === 100;

if (dayComplete) {
  // 2. Award day XP and update streak
  const { xpResult, streak } = await gamification.onDayComplete(
    dayProgress.startedAt.split('T')[0],
    dayProgress.missionTitle
  );
  
  // 3. Show notifications
  showNotification(`Day complete! +${xpResult.xpAwarded} XP`);
  showNotification(`Streak: ${streak.currentStreak} days 🔥`);
  
  // 4. Check for new badges
  xpResult.badgesUnlocked.forEach(badge => {
    showNotification(`Badge: ${badge.title} ${badge.icon}`);
  });
}
```

### Dashboard State

```typescript
// Get complete gamification state for dashboard
const state = await gamification.getGamificationState();

// Render stats
console.log(`Level ${state.level.level} - ${state.level.title}`);
console.log(`${state.level.currentXP}/${state.level.nextLevelXP} XP (${state.level.progress}%)`);
console.log(`Streak: ${state.streak.currentStreak} days`);
console.log(`Badges: ${state.badges.filter(b => !b.locked).length}/${state.badges.length}`);
console.log(`Milestones: ${state.milestones.filter(m => m.unlocked).length}/${state.milestones.length}`);
console.log(`Weekly: ${state.weeklyGoal.completedMissions}/${state.weeklyGoal.targetMissions} missions`);
```

---

## Testing

### Unit Test Example

```typescript
import { LevelService } from '../services/levelService';
import { MockProgressRepository } from '../test/mocks';

describe('LevelService', () => {
  it('computes correct level for XP', async () => {
    const repo = new MockProgressRepository({ totalXP: 1200 });
    const service = new LevelService(repo);
    
    const state = await service.getLevelState();
    
    expect(state.level).toBe(3);
    expect(state.title).toBe('Beginner');
    expect(state.currentXP).toBe(0);  // 1200 - 1200 (threshold for level 3)
    expect(state.nextLevelXP).toBe(800);  // 2000 - 1200
  });
});
```

### Integration Test Example

```typescript
import { GamificationService } from '../services/gamificationService';
import { MockProgressRepository } from '../test/mocks';

describe('GamificationService', () => {
  it('triggers level-up and badge unlock', async () => {
    const repo = new MockProgressRepository({ 
      totalXP: 490,
      streak: { currentStreak: 6 }
    });
    const service = new GamificationService(repo);
    
    // Award 10 XP (task_complete)
    const result = await service.onTaskComplete('Test task');
    
    expect(result.xpAwarded).toBe(10);
    expect(result.totalXP).toBe(500);
    expect(result.levelUp).toBe(true);
    expect(result.newLevel).toBe(2);
  });
});
```

---

## Verification Checklist

✅ **Types Extended**
- Badge, WeeklyGoal, Milestone, ExtendedStreakState added to domain.ts
- UserProgress extended with optional gamification fields
- LevelState interface defined

✅ **Services Implemented**
- LevelService — level computation
- BadgeService — badge unlock logic
- StreakService — extended tracking
- WeeklyGoalService — goal management
- MilestoneService — milestone tracking
- GamificationService — orchestrator

✅ **Configuration**
- gamificationConfig.ts with level thresholds, badge definitions, milestone definitions
- Weekly goal targets configured

✅ **Repository Extended**
- ProgressRepository interface extended
- FirestoreProgressRepository implements new methods
- LocalStorageProgressRepository implements new methods

✅ **Documentation**
- Architecture document
- Quick reference guide

✅ **No Regressions**
- Existing XP system works unchanged
- Optional fields don't break existing code
- Services handle missing data gracefully

---

## Next Steps (Phase 10 Part 2 — UI)

- Gamification Dashboard component
- Level Progress Bar
- Badge Gallery (locked/unlocked)
- Weekly Goal Card
- Milestone Timeline
- Streak Display with fire animation
- XP History Chart
- Level-up Modal
- Badge Unlock Toast
