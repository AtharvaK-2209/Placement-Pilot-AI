# Quick Test Guide - Bug 11B-08: Milestone Unlock Events

## 🚀 Quick Start

All milestone unlocks should now fire immediately upon completing qualifying actions.

---

## ✅ Test Scenario 1: First Login Milestone

**Step 1**: Open app in incognito window (ensure logged out)

**Step 2**: Sign in with Google or email/password

**Step 3**: Open browser console (F12 → Console)

**Expected Console Output**:
```
[AuthContext] ✓ User authenticated, emitting first-login event
[useMilestoneUnlocks] Attempting to unlock first-login milestone
[useMilestoneUnlocks] ✓ Unlocked first-login milestone
[PipelineDownstream] milestone_unlocked fired: {milestoneId: 'first-login', title: 'First Login'}
```

**Expected Result**: ✅ "First Login" milestone shows as unlocked immediately (no page refresh needed)

---

## ✅ Test Scenario 2: Goal Analyzed Milestone

**Step 1**: Navigate to `/goal` page

**Step 2**: Fill out the goal form:
- Goal: Any goal text
- Goal Type: Placement
- Deadline: Pick a future date
- Skill Level: Beginner
- Weekly Hours: 10
- Learning Style: Any option

**Step 3**: Click "Analyze Goal"

**Step 4**: Watch browser console

**Expected Console Output**:
```
[GoalPage] ✓ Goal analysis successful, emitting milestone event
[useMilestoneUnlocks] Attempting to unlock goal-analysis-complete milestone
[useMilestoneUnlocks] ✓ Unlocked goal-analysis-complete milestone
[PipelineDownstream] milestone_unlocked fired: {milestoneId: 'goal-analysis-complete', title: 'Goal Analyzed'}
```

**Expected Result**: ✅ "Goal Analyzed" milestone is unlocked immediately

---

## ✅ Test Scenario 3: Roadmap Created Milestone

**Step 1**: You should be on `/analysis` page (from previous test)

**Step 2**: Click "Generate Roadmap" button

**Step 3**: Watch browser console

**Expected Console Output**:
```
[AnalysisPage] ✓ Roadmap generated successfully, emitting milestone event
[useMilestoneUnlocks] Attempting to unlock roadmap-generated milestone
[useMilestoneUnlocks] ✓ Unlocked roadmap-generated milestone
[PipelineDownstream] milestone_unlocked fired: {milestoneId: 'roadmap-generated', title: 'Roadmap Created'}
```

**Expected Result**: ✅ "Roadmap Created" milestone is unlocked immediately

---

## ✅ Test Scenario 4: First Mission Milestone

**Step 1**: You should be on `/roadmap` page (from previous test)

**Step 2**: Select Week 1, Day 1

**Step 3**: Click "Generate Mission"

**Step 4**: Watch browser console

**Expected Console Output**:
```
[DailyMissionPage] ✓ First mission generated, emitting milestone event
[useMilestoneUnlocks] Attempting to unlock first-mission-complete milestone
[useMilestoneUnlocks] ✓ Unlocked first-mission-complete milestone
[PipelineDownstream] milestone_unlocked fired: {milestoneId: 'first-mission-complete', title: 'First Mission Complete'}
```

**Expected Result**: ✅ "First Mission Complete" milestone is unlocked immediately

---

## ✅ Test Scenario 5: No Duplicate Unlocks

**Step 1**: Complete Scenario 1-4 so all 4 milestones are unlocked

**Step 2**: Refresh the page (F5)

**Step 3**: Repeat the same action (e.g., go back to /goal and analyze goal again)

**Expected Result**: 
- ✅ Milestones remain unlocked after refresh
- ✅ No new unlock logs appear (milestone already unlocked)
- ✅ GamificationService returns null (already unlocked)

---

## ✅ Test Scenario 6: Persistence Across Sessions

**Step 1**: Complete all 4 milestones (Scenarios 1-4)

**Step 2**: Open browser DevTools → Application → Firestore

**Step 3**: Navigate to: `users/{your_uid}/progress/current`

**Step 4**: Verify in the `milestones` array:

```json
"milestones": [
  {
    "id": "first-login",
    "unlocked": true,
    "unlockedAt": "2026-06-30T12:00:00.000Z",
    ...
  },
  {
    "id": "goal-analysis-complete",
    "unlocked": true,
    "unlockedAt": "2026-06-30T12:05:00.000Z",
    ...
  },
  {
    "id": "roadmap-generated",
    "unlocked": true,
    "unlockedAt": "2026-06-30T12:10:00.000Z",
    ...
  },
  {
    "id": "first-mission-complete",
    "unlocked": true,
    "unlockedAt": "2026-06-30T12:15:00.000Z",
    ...
  },
  ...
]
```

**Step 5**: Close browser completely

**Step 6**: Reopen and log in again

**Step 7**: Check Achievements UI

**Expected Result**: 
- ✅ All 4 milestones show as unlocked
- ✅ Timestamps are preserved from Firestore
- ✅ No new unlock events are emitted

---

## 🔍 Debugging Tips

### Check Console Logs

Open browser console (F12) and search for:
- `[AuthContext]` - Authentication events
- `[GoalPage]` - Goal analysis events
- `[AnalysisPage]` - Roadmap generation events
- `[DailyMissionPage]` - Mission generation events
- `[useMilestoneUnlocks]` - Milestone unlock attempts
- `[PipelineDownstream]` - Event broadcasting

### Check Firestore

**Path**: `users/{uid}/progress/current`

**Look for**:
- `milestones` array exists
- Each milestone has `unlocked: true` when unlocked
- Each milestone has `unlockedAt` timestamp

### Check Browser Network

- Open DevTools → Network
- Look for Firestore writes after each milestone unlock
- Document path should be: `projects/{project}/databases/(default)/documents/users/{uid}/progress/current`

### Common Issues

| Issue | Solution |
|-------|----------|
| Milestones not unlocking | Check browser console for errors, verify Firestore is writable |
| Duplicate unlocks | Should not happen - GamificationService has idempotent check |
| UI not updating | Make sure component is listening to `milestone_unlocked` event |
| Milestones disappear after refresh | Firestore write may have failed - check DevTools Network |

---

## 📊 Expected Behavior Summary

| Action | Trigger | Event | Milestone Unlocked | Firestore Updated |
|--------|---------|-------|-------------------|------------------|
| Sign in | AuthContext | `first_login` | ✅ First Login | ✅ Yes |
| Analyze goal | GoalPage | `goal_analysis_complete` | ✅ Goal Analyzed | ✅ Yes |
| Generate roadmap | AnalysisPage | `roadmap_generated` | ✅ Roadmap Created | ✅ Yes |
| Generate mission (W1D1) | DailyMissionPage | `first_mission_generated` | ✅ First Mission Complete | ✅ Yes |
| Repeat same action | (any) | (no event) | ✅ Stays unlocked | ✅ No change |
| Refresh browser | (manual) | (no event) | ✅ Remains unlocked | ✅ Loaded from DB |
| Logout → Login | AuthContext | `first_login` | ✅ Already unlocked | ✅ No duplicate |

---

## 📋 Checklist

- [ ] Scenario 1: First Login milestone unlocks immediately
- [ ] Scenario 2: Goal Analyzed milestone unlocks immediately  
- [ ] Scenario 3: Roadmap Created milestone unlocks immediately
- [ ] Scenario 4: First Mission Complete milestone unlocks immediately
- [ ] Scenario 5: Repeat actions don't create duplicate events
- [ ] Scenario 6: Milestones persist after page refresh
- [ ] Firestore documents contain correct milestone data
- [ ] Browser console shows all expected log messages
- [ ] No TypeScript errors during build
- [ ] No runtime errors in console

---

## 🎯 Success Criteria

All tests pass ✅ = Bug 11B-08 is FIXED

If any test fails, check:
1. Console logs for error messages
2. Firestore connectivity
3. Browser cache (try clearing)
4. Check for typos in milestone IDs

