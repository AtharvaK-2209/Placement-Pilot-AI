# Phase 11A Verification Checklist

## Core Flow Testing - Comprehensive Checklist

**Date**: June 29, 2026  
**Tester**: _________________  
**Environment**: □ Development □ Staging □ Production

---

## Setup Verification

### Prerequisites
- [ ] Node.js installed (v18+)
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured with Firebase credentials
- [ ] Firebase project active and accessible
- [ ] Build completes without errors (`npm run build`)

### Environment Variables Check
```bash
VITE_FIREBASE_API_KEY=_______________
VITE_FIREBASE_AUTH_DOMAIN=_______________
VITE_FIREBASE_PROJECT_ID=_______________
VITE_FIREBASE_STORAGE_BUCKET=_______________
VITE_FIREBASE_MESSAGING_SENDER_ID=_______________
VITE_FIREBASE_APP_ID=_______________
VITE_GEMINI_API_KEY=_______________
```

---

## 1. Authentication Flow Testing

### 1.1 Google Sign-In
- [ ] Click "Continue with Google" button
- [ ] Google popup appears
- [ ] Select Google account
- [ ] Successfully redirected to `/dashboard`
- [ ] No console errors
- [ ] User icon/email displayed in header (if applicable)

**Notes**: _______________________________________

### 1.2 Email/Password Sign-In
- [ ] Enter valid email and password
- [ ] Click "Sign In"
- [ ] Successfully redirected to `/dashboard`
- [ ] No console errors

**Notes**: _______________________________________

### 1.3 Email/Password Registration
- [ ] Click "Create one" link
- [ ] Enter new email and password (min 6 chars)
- [ ] Click "Create Account"
- [ ] Account created successfully
- [ ] Redirected to `/dashboard`
- [ ] No console errors

**Notes**: _______________________________________

### 1.4 Sign Out
- [ ] Click logout/sign out button
- [ ] Redirected to `/login` or landing page
- [ ] Cannot access protected routes without re-authentication
- [ ] No console errors

**Notes**: _______________________________________

### 1.5 Session Persistence
- [ ] Sign in with any method
- [ ] Navigate to a protected page (e.g., `/roadmap`)
- [ ] Refresh the browser (F5 or Cmd+R)
- [ ] Still authenticated (not redirected to login)
- [ ] Page content loads correctly
- [ ] No console errors

**Notes**: _______________________________________

### 1.6 Protected Routes
- [ ] Sign out completely
- [ ] Try accessing `/dashboard` directly
  - [ ] Redirected to `/login`
- [ ] Try accessing `/roadmap` directly
  - [ ] Redirected to `/login`
- [ ] Try accessing `/daily-mission` directly
  - [ ] Redirected to `/login`
- [ ] No flash of protected content before redirect
- [ ] Loading spinner shown during auth check

**Notes**: _______________________________________

---

## 2. Goal Analysis Flow Testing

### 2.1 First-Time Goal Analysis
- [ ] Sign in
- [ ] Navigate to Goal page
- [ ] Fill out goal form:
  - Goal text: _______________________________________
  - Goal type: _______________________________________
  - Deadline: _______________________________________
  - Weekly hours: _______________________________________
- [ ] Submit form
- [ ] Analysis page loads with results
- [ ] Console shows: `[AI CACHE] GoalAnalysis — Cache MISS`
- [ ] Console shows: `[AI CACHE] GoalAnalysis — ✓ Request complete`
- [ ] All sections displayed:
  - [ ] Summary
  - [ ] Difficulty badge
  - [ ] Feasibility badge
  - [ ] Execution Mode
  - [ ] Goal Health Score
  - [ ] Timeline
  - [ ] Strengths list
  - [ ] Skill Gaps list
  - [ ] Recommendations list
- [ ] "Generate My Roadmap" button visible

**Notes**: _______________________________________

### 2.2 Cache Reuse (Same Goal)
- [ ] Navigate back to Goal page
- [ ] Submit EXACT same goal inputs as before
- [ ] Analysis page loads INSTANTLY
- [ ] Console shows: `[AI CACHE] GoalAnalysis — Cache HIT (memory)`
- [ ] Results are identical to previous analysis
- [ ] No Gemini API call made

**Notes**: _______________________________________

### 2.3 Page Refresh Recovery
- [ ] On Analysis page with loaded results
- [ ] Refresh browser (F5 or Cmd+R)
- [ ] Analysis page reloads successfully
- [ ] All data still displayed
- [ ] Console may show: `[AnalysisPage] Restored state from sessionStorage`
- [ ] No errors

**Notes**: _______________________________________

### 2.4 Direct URL Access (Edge Case)
- [ ] Copy analysis page URL
- [ ] Open new tab
- [ ] Paste URL and navigate
- [ ] Empty state shown OR cached data displayed
- [ ] "Back to Goal" button works
- [ ] No application crash

**Notes**: _______________________________________

### 2.5 Different Goal Analysis
- [ ] Navigate to Goal page
- [ ] Submit DIFFERENT goal inputs
- [ ] Console shows: `[AI CACHE] GoalAnalysis — Cache MISS`
- [ ] New analysis generated
- [ ] Results reflect new goal
- [ ] No data from previous goal shown

**Notes**: _______________________________________

---

## 3. Roadmap Flow Testing

### 3.1 First-Time Roadmap Generation
- [ ] From Analysis page, click "Generate My Roadmap"
- [ ] Roadmap page loads with results
- [ ] Console shows roadmap generation logs
- [ ] All sections displayed:
  - [ ] Roadmap title
  - [ ] Summary
  - [ ] Total weeks badge
  - [ ] Total hours badge
  - [ ] Execution mode badge
  - [ ] Weekly target hours
  - [ ] Week cards (all weeks listed)
- [ ] Week 1 is unlocked
- [ ] Week 2+ are locked (if applicable)

**Notes**: _______________________________________

### 3.2 Week Card Expansion
- [ ] Click any week card
- [ ] Card expands to show details
- [ ] Module sections visible
- [ ] Concepts listed
- [ ] Practice items listed
- [ ] Milestone displayed
- [ ] Click again to collapse

**Notes**: _______________________________________

### 3.3 Page Refresh Recovery
- [ ] On Roadmap page
- [ ] Refresh browser (F5 or Cmd+R)
- [ ] Roadmap reloads successfully
- [ ] All weeks still displayed
- [ ] Progress retained
- [ ] Console may show: `[RoadmapPage] Restored state from sessionStorage`

**Notes**: _______________________________________

### 3.4 No Duplicate Generation
- [ ] On Roadmap page
- [ ] Navigate back to Analysis page
- [ ] Click "Generate My Roadmap" again
- [ ] Roadmap loads from cache (instant)
- [ ] Console shows: `[AI CACHE] Roadmap — Cache HIT`
- [ ] Same roadmap displayed
- [ ] No new Gemini request

**Notes**: _______________________________________

### 3.5 Version Tracking
- [ ] On Roadmap page
- [ ] Check for version badge (e.g., "V1")
- [ ] Console shows: `[RoadmapPage] Roadmap progress updated`
- [ ] Firestore/localStorage contains version data

**Notes**: _______________________________________

---

## 4. Daily Mission Flow Testing

### 4.1 First Mission Generation
- [ ] On Roadmap page, click any week card
- [ ] Click "Start Daily Mission" or similar button
- [ ] Daily Mission page loads
- [ ] Day selector shows (1-7)
- [ ] Day 1 is pre-selected
- [ ] "Generate Day 1 Mission" button visible
- [ ] Click generate button
- [ ] Console shows: `[DailyMissionPage] Starting mission generation`
- [ ] Mission generates successfully
- [ ] Console shows: `[DailyMissionPage] ✓ Mission generated successfully`
- [ ] All sections visible:
  - [ ] Mission title
  - [ ] Learning tasks
  - [ ] Practice tasks
  - [ ] Revision tasks (if applicable)
  - [ ] Milestone
  - [ ] Motivation

**Notes**: _______________________________________

### 4.2 Task Completion & XP Award
- [ ] Click first unchecked task
- [ ] Task checkbox changes to checked
- [ ] "+10 XP" flash animation appears
- [ ] Console shows: `[useProgress] Awarding XP for task completion`
- [ ] Total XP counter updates
- [ ] Completion percentage updates
- [ ] No duplicate XP award

**XP Before**: _______ **XP After**: _______

**Notes**: _______________________________________

### 4.3 No Duplicate XP on Re-check
- [ ] Click same task to uncheck
- [ ] Task checkbox unchecks
- [ ] No XP awarded
- [ ] Click to check again
- [ ] Console shows: `wasAlreadyDone: true`
- [ ] No XP awarded (already received)

**Notes**: _______________________________________

### 4.4 Day Completion XP
- [ ] Complete all tasks in the mission
- [ ] Last task triggers day completion
- [ ] "+50 XP" bonus awarded
- [ ] Console shows: `[useProgress] All tasks done, awarding day completion XP`
- [ ] Completion percentage = 100%
- [ ] "✓ Done" badge appears

**Notes**: _______________________________________

### 4.5 Mission Persistence
- [ ] With mission loaded and some tasks completed
- [ ] Refresh browser (F5 or Cmd+R)
- [ ] Mission reloads successfully
- [ ] Completed tasks remain checked
- [ ] Uncompleted tasks remain unchecked
- [ ] XP count preserved
- [ ] Console shows: `[DailyMissionPage] Restored state from sessionStorage`

**Notes**: _______________________________________

### 4.6 Resume Existing Mission
- [ ] On Daily Mission page
- [ ] Switch to Day 2 (click day selector)
- [ ] Generate Day 2 mission
- [ ] Complete some tasks
- [ ] Switch back to Day 1
- [ ] Console shows: `[DailyMissionPage] ✓ Loaded existing mission`
- [ ] Day 1 mission loads with previous state
- [ ] Completed tasks still checked
- [ ] No duplicate mission generated

**Notes**: _______________________________________

### 4.7 Back Navigation to Roadmap
- [ ] On Daily Mission page
- [ ] Click "Back to Roadmap" button
- [ ] Navigates to Roadmap page
- [ ] Console shows: `[RoadmapPage] Page focused, triggering refresh`
- [ ] Week progress updates
- [ ] Completed days reflected in week progress bar

**Notes**: _______________________________________

---

## 5. Week Unlock Testing

### 5.1 Week 2 Unlock (If Applicable)
- [ ] Complete at least 5 days of Week 1 missions (70%+ threshold)
- [ ] Return to Roadmap page
- [ ] Week 1 progress bar shows >70%
- [ ] Week 2 automatically unlocks
- [ ] Week 2 "🔒 Lock" icon removed
- [ ] Can click Week 2 to expand
- [ ] Console shows: `[RoadmapPage] Roadmap progress updated`

**Week 1 Completion**: _______% **Week 2 Unlocked**: □ Yes □ No

**Notes**: _______________________________________

---

## 6. Error Handling Testing

### 6.1 Network Failure Simulation
- [ ] Disconnect internet
- [ ] Try to generate Goal Analysis
- [ ] Error message displayed (graceful failure)
- [ ] Reconnect internet
- [ ] Retry succeeds
- [ ] Console shows retry attempts

**Notes**: _______________________________________

### 6.2 Invalid Firebase Credentials
- [ ] (Skip if production) Temporarily use invalid API key
- [ ] Try to sign in
- [ ] Error message displayed
- [ ] No application crash
- [ ] Restore valid credentials

**Notes**: _______________________________________

### 6.3 Gemini API Quota Exceeded
- [ ] (Skip unless testable) Exceed daily quota
- [ ] Friendly error message shown
- [ ] Console shows: `✗ 429 Quota Exceeded`
- [ ] Cached data still accessible
- [ ] "Try again later" message displayed

**Notes**: _______________________________________

---

## 7. Cross-Browser Testing

### 7.1 Chrome
- [ ] All authentication flows work
- [ ] All page transitions work
- [ ] Console has no errors
- [ ] UI renders correctly

**Version**: _____________ **Status**: □ Pass □ Fail

**Notes**: _______________________________________

### 7.2 Firefox
- [ ] All authentication flows work
- [ ] All page transitions work
- [ ] Console has no errors
- [ ] UI renders correctly

**Version**: _____________ **Status**: □ Pass □ Fail

**Notes**: _______________________________________

### 7.3 Safari
- [ ] All authentication flows work
- [ ] All page transitions work
- [ ] Console has no errors
- [ ] UI renders correctly

**Version**: _____________ **Status**: □ Pass □ Fail

**Notes**: _______________________________________

### 7.4 Edge
- [ ] All authentication flows work
- [ ] All page transitions work
- [ ] Console has no errors
- [ ] UI renders correctly

**Version**: _____________ **Status**: □ Pass □ Fail

**Notes**: _______________________________________

---

## 8. Performance Testing

### 8.1 Build Performance
- [ ] Build completes in <5 minutes
- [ ] No build errors or warnings
- [ ] Bundle size reasonable (<2MB gzipped)

**Build Time**: _______ seconds  
**Bundle Size**: _______ KB (gzipped)

### 8.2 Page Load Performance
- [ ] Landing page loads in <2s
- [ ] Dashboard loads in <3s (authenticated)
- [ ] Analysis page loads in <2s (cached)
- [ ] Roadmap page loads in <2s (cached)

**Notes**: _______________________________________

### 8.3 Cache Performance
- [ ] Memory cache hit: <10ms
- [ ] LocalStorage cache hit: <100ms
- [ ] Firestore cache hit: <1s
- [ ] Check console logs for timing

**Notes**: _______________________________________

---

## 9. Data Persistence Testing

### 9.1 Authenticated User Data Persistence
- [ ] Sign in
- [ ] Complete a full user journey (Goal → Analysis → Roadmap → Mission)
- [ ] Sign out
- [ ] Sign in again
- [ ] All data preserved:
  - [ ] Goal analysis
  - [ ] Roadmap
  - [ ] Daily missions
  - [ ] Task completion state
  - [ ] XP and progress

**Notes**: _______________________________________

### 9.2 Guest User Data Persistence (If Applicable)
- [ ] Use app without signing in
- [ ] Complete some actions
- [ ] Refresh page
- [ ] Data preserved in localStorage
- [ ] Sign in
- [ ] Data migrated to Firestore

**Notes**: _______________________________________

---

## 10. Console Logs Verification

### Expected Logs (No Errors)

**Goal Analysis**:
```
[AI CACHE] GoalAnalysis Request
[AI CACHE] GoalAnalysis — Cache MISS (all layers)
[AI CACHE] GoalAnalysis — Calling Gemini...
[AI CACHE] GoalAnalysis — ✓ Gemini response received
[AI CACHE] GoalAnalysis — ✓ Request complete
```

**Roadmap**:
```
[Roadmap] Step 1 — Coverage Planning...
[Roadmap] Step 2 — Week Allocation...
[Roadmap] Step 3 — Building Prompt...
[Roadmap] Step 4 — Calling Gemini...
[Roadmap] Step 5 — Parsing JSON...
[Roadmap] Step 6 — Validating Schema...
[Roadmap] ✓ Roadmap Generated successfully
```

**Daily Mission**:
```
[DailyMissionPage] Starting mission generation
[DailyMissionPage] ✓ Mission generated successfully
[DailyMissionPage] ✓ Mission saved to repository
[useProgress] Toggling task "..."
[useProgress] Awarding XP for task completion
[useProgress] State updated successfully
```

**Firestore Operations**:
```
[FirestoreMissionRepository] ✓ Saved mission to Firestore
[FirestoreMissionRepository] ✓ Found mission in Firestore
```

- [ ] All expected logs present
- [ ] No red errors in console
- [ ] No yellow warnings (except build warnings)

**Notes**: _______________________________________

---

## 11. Final Checklist

### Critical Path Testing
- [ ] User can sign in successfully
- [ ] User can create and analyze a goal
- [ ] User can generate a roadmap
- [ ] User can generate daily missions
- [ ] User can complete tasks and earn XP
- [ ] User can navigate back and forth without data loss
- [ ] Page refresh preserves all state
- [ ] Sign out and sign in preserves data

### Bug Verification
- [ ] No duplicate XP awards
- [ ] No mission regeneration on reload
- [ ] No roadmap regeneration on reload
- [ ] No cache invalidation bugs
- [ ] No authentication state bugs
- [ ] No data loss on page refresh

### Production Readiness
- [ ] Build completes successfully
- [ ] No console errors in production build
- [ ] All environment variables configured
- [ ] Firebase project accessible
- [ ] Gemini API key valid and working
- [ ] Firestore rules configured correctly
- [ ] Authentication providers enabled in Firebase

---

## Test Results Summary

**Total Test Cases**: 100+  
**Passed**: _______  
**Failed**: _______  
**Skipped**: _______  
**Pass Rate**: _______%  

### Critical Issues Found
1. _______________________________________
2. _______________________________________
3. _______________________________________

### Non-Critical Issues Found
1. _______________________________________
2. _______________________________________
3. _______________________________________

### Recommendations
1. _______________________________________
2. _______________________________________
3. _______________________________________

---

**Tested By**: _______________________________________  
**Date**: _______________________________________  
**Duration**: _______ hours  
**Environment**: □ Dev □ Staging □ Production  
**Status**: □ APPROVED □ NEEDS FIXES □ BLOCKED

**Sign-off**: _______________________________________
