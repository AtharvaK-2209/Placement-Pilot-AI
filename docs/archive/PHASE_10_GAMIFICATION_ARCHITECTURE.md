# Phase 10 — Gamification Architecture

## Overview

Phase 10 extends the existing XP system into a complete gamification engine with:
- **Configurable Levels** — XP thresholds and level progression
- **Extended Streaks** — Daily, weekly, and monthly tracking
- **Badge System** — Locked/unlocked achievements
- **XP History** — Complete event log with filtering
- **Weekly Goals** — Auto-generated targets with progress tracking
- **Milestones** — Journey tracking for key events

---

## Architecture Principles

### 1. Extend, Don't Duplicate
- Reuses existing `XPService`, `ProgressRepository`, and `UserProgress`
- No new storage backends — extends Firestore and localStorage implementations
- Maintains backward compatibility with existing XP system

### 2. Service Layer Pattern
Each gamification feature has its own service:
- `LevelService` — Level computation and thresholds
- `BadgeService` — Badge unlock logic
- `StreakService` — Extended streak tracking
- `WeeklyGoalService` — Weekly goal generation and updates
- `MilestoneService` — Milestone unlocking
- `GamificationService` — Unified orchestration layer

### 3. Configuration-Driven
All game mechanics defined in `src/config/gamificationConfig.ts`:
- Level thresholds
- Badge definitions
- Milestone templates
- Weekly goal targets

---

## Type System

### Extended Types (src/types/domain.ts)

```typescript
// Badge with lock state
interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  locked: boolean;
  unlockedAt?: ISODateTime;
  category: 'milestone' | 'streak' | 'completion' | 'special';
}

// Weekly goal tracking
interface WeeklyGoal {
  weekStartDate: ISODate;    // Monday
  weekEndDate: ISODate;      // Sunday
  targetMissions: number;
  completedMissions: number;
  targetXP: number;
  earnedXP: number;
  completed: boolean;
  completedAt?: ISODateTime;
}

// Milestone tracking
interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: ISODateTime;
}

// Extended streak with weekly/monthly
interface ExtendedStreakState extends StreakState {
  weeklyStreak: number;   // consecutive weeks with 5+ days
  monthlyStreak: number;  // consecutive months with 20+ days
  missedDays: number;
}

// Level state
interface LevelState {
  level: number;
  currentXP: number;      // XP within current level
  nextLevelXP: number;    // XP needed for next level
  progress: number;       // 0-100%
  title?: string;         // "Beginner", "Expert", etc.
}
```

### Extended UserProgress

```typescript
interface UserProgress {
  // Existing fields...
  totalXP: number;
  xpLog: XPEntry[];
  streak: StreakState;
  achievements: Achievement[];
  
  // Phase 10 additions
  badges?: Badge[];
  weeklyGoals?: WeeklyGoal[];
  milestones?: Milestone[];
  extendedStreak?: ExtendedStreakState;
}
```

---

## Services

### GamificationService (Orchestrator)

Central service that coordinates all gamification subsystems.

```typescript
// Award XP with automatic level-up and badge checks
const result = await gamificationService.awardXP('task_complete', 'Complete login feature');
// Returns: { xpAwarded, totalXP, levelUp, newLevel, badgesUnlocked }

// Handle day completion
const { xpResult, streak } = await gamificationService.onDayComplete(
  '2024-01-15',
  'Build Auth System'
);

// Get complete state snapshot
const state = await gamificationService.getGamificationState();
```

### LevelService

Computes levels from XP using configurable thresholds.

```typescript
const levelState = await levelService.getLevelState();
// { level: 5, currentXP: 200, nextLevelXP: 500, progress: 40, title: 'Intermediate' }

const newLevel = await levelService.checkLevelUp(150);
// Returns new level if XP would cause level-up, else null
```

### BadgeService

Manages badge unlocks with automatic condition checking.

```typescript
// Get all badges
const badges = await badgeService.getAllBadges();

// Check and unlock based on current progress
const newBadges = await badgeService.checkAndUnlockBadges();

// Manual unlock (for special events)
const badge = await badgeService.unlockBadge('first-mission');
```

### StreakService

Extended streak tracking with weekly/monthly metrics.

```typescript
// Update on day complete
const streak = await streakService.updateStreakOnDayComplete('2024-01-15');

// Get stats
const stats = await streakService.getStreakStats();
// { current: 7, longest: 14, weekly: 2, monthly: 1, totalActive: 45, missedDays: 3 }
```

### WeeklyGoalService

Auto-generates and tracks weekly goals.

```typescript
// Get or create current week's goal
const goal = await weeklyGoalService.getCurrentWeekGoal();

// Update after progress change
await weeklyGoalService.updateWeeklyGoalProgress();

// Get progress percentages
const progress = await weeklyGoalService.getCurrentWeekProgress();
// { missionProgress: 60, xpProgress: 80, overallProgress: 70 }
```

### MilestoneService

Tracks journey milestones and triggers badge unlocks.

```typescript
// Unlock milestone
const milestone = await milestoneService.unlockMilestone('first-login');

// Check unlock state
const unlocked = await milestoneService.isMilestoneUnlocked('goal-analysis-complete');

// Get completion stats
const percentage = await milestoneService.getCompletionPercentage();
```

---

## Configuration

### Level Thresholds (gamificationConfig.ts)

```typescript
export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1,  xpRequired: 0,     title: 'Beginner' },
  { level: 2,  xpRequired: 500,   title: 'Beginner' },
  { level: 3,  xpRequired: 1200,  title: 'Beginner' },
  { level: 4,  xpRequired: 2000,  title: 'Intermediate' },
  // ... up to level 15
];
```

Levels scale progressively — early levels require less XP, higher levels require more.

### Badge Definitions

```typescript
export const BADGE_DEFINITIONS: Omit<Badge, 'locked' | 'unlockedAt'>[] = [
  {
    id: 'first-mission',
    title: 'First Mission',
    description: 'Complete your first daily mission',
    icon: '🎯',
    category: 'milestone',
  },
  {
    id: '7-day-streak',
    title: '7 Day Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    category: 'streak',
  },
  // ... 18 total badges
];
```

Badge categories:
- `milestone` — Major journey events
- `streak` — Consecutive day achievements
- `completion` — Task count milestones
- `special` — Unique achievements

### Badge Unlock Conditions (badgeService.ts)

```typescript
private shouldUnlock(badgeId: string, stats: Stats): boolean {
  switch (badgeId) {
    case 'first-mission':
      return stats.completedDays >= 1;
    case '7-day-streak':
      return stats.currentStreak >= 7;
    case '100-tasks-complete':
      return stats.completedTasks >= 100;
    // ... etc
  }
}
```

Badges are checked automatically after XP awards, day completions, and streak updates.

### Milestone Definitions

```typescript
export const MILESTONE_DEFINITIONS: Omit<Milestone, 'unlocked' | 'unlockedAt'>[] = [
  { id: 'first-login', title: 'First Login', description: '...', icon: '👋' },
  { id: 'goal-analysis-complete', title: 'Goal Analyzed', description: '...', icon: '📊' },
  { id: 'roadmap-generated', title: 'Roadmap Created', description: '...', icon: '🗺️' },
  // ... 9 total milestones
];
```

Milestones unlock manually via `milestoneService.unlockMilestone()` when key events occur.

---

## Repository Extensions

### New Methods (ProgressRepository.ts)

```typescript
interface ProgressRepository {
  // Existing methods...
  
  // Phase 10 additions
  getXPHistory(startDate: string, endDate: string): Promise<XPEntry[]>;
  getTotalTasksCompleted(): Promise<number>;
}
```

Implemented in both `FirestoreProgressRepository` and `LocalStorageProgressRepository`.

---

## Usage Examples

### 1. Awarding XP with Full Event Handling

```typescript
const gamification = new GamificationService(progressRepo);

// Task completion
const result = await gamification.onTaskComplete('Setup authentication');
if (result.levelUp) {
  console.log(`Level up! ${result.previousLevel} → ${result.newLevel}`);
}
if (result.badgesUnlocked.length > 0) {
  console.log('New badges:', result.badgesUnlocked.map(b => b.title));
}

// Day completion
const { xpResult, streak } = await gamification.onDayComplete(
  new Date().toISOString().split('T')[0],
  'Complete Day 1 Mission'
);
console.log(`Streak: ${streak.currentStreak} days`);

// Week completion
await gamification.onWeekComplete(1, 'Foundations');
```

### 2. Checking Weekly Goal Progress

```typescript
const goal = await gamification.getCurrentWeeklyGoal();
const progress = await gamification.getCurrentWeekProgress();

console.log(`Missions: ${goal.completedMissions}/${goal.targetMissions}`);
console.log(`XP: ${goal.earnedXP}/${goal.targetXP}`);
console.log(`Overall: ${progress.overallProgress}%`);
```

### 3. Unlocking Milestones

```typescript
// After goal analysis
await gamification.unlockMilestone('goal-analysis-complete');

// After roadmap generation
await gamification.unlockMilestone('roadmap-generated');

// After Future You simulation
await gamification.unlockMilestone('future-you-generated');
```

### 4. Getting Complete Gamification State

```typescript
const state = await gamification.getGamificationState();

// Use in dashboard UI
console.log('Level:', state.level.level, state.level.title);
console.log('XP:', state.totalXP);
console.log('Streak:', state.streak.currentStreak);
console.log('Badges:', state.badges.filter(b => !b.locked).length, '/', state.badges.length);
console.log('Milestones:', state.milestones.filter(m => m.unlocked).length);
console.log('Tasks:', state.tasksCompleted);
```

---

## Data Flow

### XP Award Flow

```
User completes task
  ↓
gamificationService.onTaskComplete()
  ↓
xpService.award() → adds XP entry
  ↓
levelService.checkLevelUp() → detects level change
  ↓
badgeService.checkAndUnlockBadges() → checks all conditions
  ↓
weeklyGoalService.updateWeeklyGoalProgress() → updates goal
  ↓
Returns XPAwardResult with all events
```

### Streak Update Flow

```
User completes day
  ↓
gamificationService.onDayComplete()
  ↓
xpService.award('day_complete')
  ↓
streakService.updateStreakOnDayComplete()
  ↓
Calculate daily streak
  ↓
Calculate weekly streak (weeks with 5+ days)
  ↓
Calculate monthly streak (months with 20+ days)
  ↓
badgeService.checkAndUnlockBadges() → unlock streak badges
  ↓
milestoneService.unlockMilestone('first-mission-complete') if first day
```

### Weekly Goal Generation

```
User requests current weekly goal
  ↓
weeklyGoalService.getCurrentWeekGoal()
  ↓
getWeekBounds(new Date()) → Monday-Sunday
  ↓
Check if goal exists for current week
  ↓
If not: create new goal with targets from config
  ↓
Persist in UserProgress.weeklyGoals[]
```

---

## Persistence Strategy

### Single-Document Pattern

All gamification data persists in the existing `UserProgress` document:

**Firestore:**
```
users/{uid}/progress/current
  → totalXP, xpLog, streak, achievements
  → badges, weeklyGoals, milestones, extendedStreak
```

**LocalStorage:**
```
"pp_progress"
  → Same structure as Firestore
```

### Data Structure

```typescript
{
  roadmapTitle: "My Roadmap",
  startedAt: "2024-01-01T00:00:00Z",
  totalXP: 1250,
  xpLog: [
    { id: "...", source: "task_complete", amount: 10, earnedAt: "...", description: "..." },
    // ...
  ],
  streak: {
    currentStreak: 7,
    longestStreak: 14,
    lastActiveDate: "2024-01-15",
    totalActiveDays: 45
  },
  extendedStreak: {
    // includes all streak fields plus:
    weeklyStreak: 2,
    monthlyStreak: 1,
    missedDays: 3
  },
  badges: [
    { id: "first-mission", title: "...", locked: false, unlockedAt: "..." },
    { id: "7-day-streak", title: "...", locked: true },
    // ...
  ],
  weeklyGoals: [
    {
      weekStartDate: "2024-01-08",
      weekEndDate: "2024-01-14",
      targetMissions: 5,
      completedMissions: 5,
      targetXP: 500,
      earnedXP: 550,
      completed: true,
      completedAt: "2024-01-14T20:00:00Z"
    },
    // current week...
  ],
  milestones: [
    { id: "first-login", title: "...", unlocked: true, unlockedAt: "..." },
    { id: "roadmap-generated", title: "...", unlocked: false },
    // ...
  ],
  days: { ... },
  achievements: [ ... ],
  updatedAt: "2024-01-15T12:00:00Z"
}
```

---

## Integration Points

### Where to Call Gamification Services

| Event | Method | Location |
|-------|--------|----------|
| Task completion | `gamification.onTaskComplete()` | ProgressService.updateTask() |
| Day completion | `gamification.onDayComplete()` | ProgressService (after all tasks done) |
| Week completion | `gamification.onWeekComplete()` | ProgressService (after 7 days done) |
| Goal analysis done | `gamification.unlockMilestone('goal-analysis-complete')` | Goal analysis UI |
| Roadmap generated | `gamification.unlockMilestone('roadmap-generated')` | Roadmap generation UI |
| Future You run | `gamification.unlockMilestone('future-you-generated')` | Future You UI |
| Deadline Rescue used | `gamification.unlockMilestone('deadline-rescue-used')` | Deadline Rescue UI |

---

## Testing Strategy

### Unit Tests (services)

Test each service in isolation:

```typescript
// levelService.test.ts
describe('LevelService', () => {
  it('computes correct level from XP', async () => {
    const repo = new MockProgressRepository({ totalXP: 1200 });
    const service = new LevelService(repo);
    const state = await service.getLevelState();
    expect(state.level).toBe(3);
  });
});

// badgeService.test.ts
describe('BadgeService', () => {
  it('unlocks streak badges at correct thresholds', async () => {
    const repo = new MockProgressRepository({ 
      streak: { currentStreak: 7 }
    });
    const service = new BadgeService(repo);
    const badges = await service.checkAndUnlockBadges();
    expect(badges.find(b => b.id === '7-day-streak')).toBeDefined();
  });
});
```

### Integration Tests (gamificationService)

Test complete flows:

```typescript
describe('GamificationService', () => {
  it('awards XP and triggers level-up', async () => {
    const repo = new MockProgressRepository({ totalXP: 490 });
    const service = new GamificationService(repo);
    
    const result = await service.awardXP('task_complete', 'Test task');
    
    expect(result.xpAwarded).toBe(10);
    expect(result.levelUp).toBe(true);
    expect(result.newLevel).toBe(2);
  });
});
```

---

## Performance Considerations

### Lazy Initialization

Gamification data initializes on first access:
- Badges initialize from definitions on first read
- Milestones initialize from definitions on first read
- Weekly goals create on-demand for current week
- Extended streak initializes from base streak

### Batch Operations

All badge checks run in a single pass:

```typescript
async checkAndUnlockBadges(): Promise<Badge[]> {
  // Compute stats once
  const stats = await this.computeStats();
  
  // Check all badges in single loop
  for (const badge of badges) {
    if (this.shouldUnlock(badge.id, stats)) {
      // unlock
    }
  }
}
```

### Caching Strategy

Services are stateless — all state lives in ProgressRepository.
For dashboard views, call `gamificationService.getGamificationState()` once and cache in component state.

---

## Migration & Backward Compatibility

### Existing Users

No migration needed. New fields are optional:

```typescript
interface UserProgress {
  // Required fields work unchanged
  totalXP: number;
  xpLog: XPEntry[];
  streak: StreakState;
  
  // New fields are optional
  badges?: Badge[];
  weeklyGoals?: WeeklyGoal[];
  milestones?: Milestone[];
  extendedStreak?: ExtendedStreakState;
}
```

Services handle missing data gracefully:

```typescript
async getAllBadges(): Promise<Badge[]> {
  const progress = await this.repo.getProgress();
  if (!progress?.badges) {
    return this.initializeBadges(); // Create from definitions
  }
  return progress.badges;
}
```

### Existing XP System

All existing XP functionality unchanged:
- `xpService.award()` — works as before
- `xpService.getTotal()` — works as before
- `xpService.getLevelInfo()` — deprecated but still works

New code should use `GamificationService` for richer events.

---

## Future Enhancements

### Phase 10.2 (Future)

- **Leaderboards** — Compare with other users
- **Custom Badges** — User-created achievements
- **Streak Freeze** — Protect streaks with XP
- **Daily Challenges** — Bonus XP opportunities
- **Season System** — Reset progress seasonally
- **Badge Tiers** — Bronze/Silver/Gold variants

### Phase 10.3 (Future)

- **Social Features** — Share badges, challenge friends
- **Badge Showcase** — Pin favorite badges to profile
- **XP Boosters** — Temporary multipliers
- **Milestone Rewards** — Unlock features/themes
