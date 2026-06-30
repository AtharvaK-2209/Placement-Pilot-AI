# Future You — Quick Reference

## 🎯 What Is Future You?

An AI-powered career prediction feature that shows users where they'll be if they continue at their current pace. Think of it as a "time machine" that looks into the user's future based on their execution patterns.

---

## 📍 How to Access

### Option 1: From Roadmap Dashboard
1. Open `/roadmap`
2. Scroll to "Future You" card (below Deadline Rescue)
3. Click **"View Prediction →"**

### Option 2: Direct URL
- Navigate to `/future-you`

---

## 🎨 Page Structure

```
┌─────────────────────────────────────────┐
│  ✨ Future You                          │  ← Hero Section
│  Motivational tagline                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  🎯 Internship Probability              │  ← Card 1
│  [Circular Progress: 85%]               │
│  Confidence: High                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  💻 Likely Skills                       │  ← Card 2
│  ✓ Java  ✓ DSA  ✓ Spring Boot          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  💼 Interview Readiness                 │  ← Card 3
│  68%  [Progress Bar]                    │
│  + Short reasoning                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  🏆 Estimated Offers                    │  ← Card 4
│  2-4 potential offers                   │
│  ⚠️ AI prediction disclaimer            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ⭐ Biggest Strength                    │  ← Card 5
│  • Problem Solving                      │
│  • Consistency                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ⚠️  Predicted Weakness                 │  ← Card 6
│  • System Design                        │
│  • Communication                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  🔥 Burnout Risk                        │  ← Card 7
│  [LOW] Risk Badge                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  📅 Career Timeline                     │  ← Card 8
│  Today → 30d → 60d → Target             │
│  Skills + Confidence + Readiness        │
└─────────────────────────────────────────┘

┌═════════════════════════════════════════┐
║  ✨ FUTURE NARRATIVE (Hero Feature)    ║  ← Card 9
║  2-4 paragraph AI-generated story       ║
║  Personal, motivating, and inspiring    ║
╚═════════════════════════════════════════╝

┌─────────────────────────────────────────┐
│  💡 AI Recommendations                  │  ← Card 10
│  • 5 actionable suggestions             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  📊 Future Metrics                      │  ← Card 11
│  Completion | Skills | Readiness        │
│  Timeline | Strengths | Focus Areas     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  📈 Overall Confidence                  │  ← Card 12
│  AI confidence: 82%  [Progress Bar]     │
│  + Confidence calculation explanation   │
└─────────────────────────────────────────┘
```

---

## 🎬 User Flow

### First Visit (No Cached Prediction)
1. User navigates to `/future-you`
2. Sees empty state with large Brain icon
3. "No prediction available yet"
4. Clicks **"Refresh"** button
5. Loading spinner appears: "Analyzing your progress..."
6. AI generates prediction (5-10 seconds)
7. All 12 cards animate into view
8. Prediction is cached for instant access

### Subsequent Visits (Cached Prediction)
1. User navigates to `/future-you`
2. Cached prediction loads **instantly**
3. All 12 cards display immediately
4. User can click **"Refresh"** to regenerate

### Error State
1. If prediction fails
2. Red error banner appears
3. "Prediction Failed" + error message
4. User can retry with **"Refresh"**

---

## 🎨 Visual Elements

### Circular Progress (Card 1)
- 140px diameter
- 10px stroke width
- Animated from 0% → target%
- Color: Green (ready) or Orange (not ready)

### Skill Chips (Card 2)
- Rounded pill shape
- Checkmark prefix (✓)
- Glassmorphism background
- Staggered animation (40ms between chips)
- Hover effect: accent border glow

### Timeline (Card 8)
- Vertical orientation
- 32px circular dots
- 2px connector lines
- 4 milestones (Today → 30d → 60d → Target)
- Each milestone shows skills + scores

### Risk Badge (Card 7)
- Color-coded: Green (low), Yellow (medium), Red (high)
- Icon: CheckCircle, AlertTriangle, or XCircle
- Glassmorphism background
- Uppercase text

### Confidence Label
- Text-based: "High", "Moderate", "Low"
- Color-coded: Green (80+), Blue (60+), Yellow (40+)
- Uppercase, tracking-wider

---

## 🔄 Refresh Behavior

### When User Clicks "Refresh"
1. Button becomes disabled
2. RefreshCw icon spins
3. Text changes to "Generating..."
4. FutureYouService gathers context:
   - Goal data
   - Roadmap progress
   - Completion metrics
   - Streak data
   - Goal health scores
   - Execution intelligence
5. Makes **ONE** Gemini API call
6. Saves prediction to repository
7. Updates UI with new prediction
8. Button becomes enabled again

### Cache Behavior
- Prediction stored in:
  - **Firestore** (authenticated users)
  - **LocalStorage** (guest users)
- Path: `users/{uid}/futureSimulation/latest`
- Loads on page mount
- No expiration (manual refresh only)

---

## 🎯 Key Features

### ✅ Always Present
- Hero section with sparkle icon
- Refresh button (sticky header)
- Back button navigation
- Timestamp footer

### 🎨 Visual Polish
- Glassmorphism cards
- Staggered animations (60-190ms)
- Smooth hover effects
- Responsive grid layouts
- Dark theme consistency

### 🔒 Disclaimers
- "AI prediction based on current execution"
- "Not a guarantee"
- Clear labeling as "estimation"
- Confidence scores visible

---

## 📱 Responsive Behavior

### Mobile (< 640px)
- Single column layout
- Skill chips wrap naturally
- Metrics grid: 2 columns
- Timeline: full width
- Progress ring: 120px

### Tablet (640px - 1024px)
- Single column layout
- Metrics grid: 2 columns
- Cards full width

### Desktop (> 1024px)
- Max width: 4xl (896px)
- Metrics grid: 3 columns
- Optimal reading width

---

## 🔧 Developer Notes

### Component Location
```
src/pages/FutureYouPage.tsx
```

### Hook Location
```
src/hooks/useFutureYouRepository.ts
```

### Service Location
```
src/services/futureYouService.ts
```

### Route
```tsx
<Route path="/future-you" element={<ProtectedRoute><FutureYouPage /></ProtectedRoute>} />
```

### Dependencies
- `lucide-react` (icons)
- `react-router-dom` (navigation)
- `FutureYouService` (data)
- `useFutureYouRepository` (storage)
- `useGoalHealth` (burnout risk)

---

## 🎯 Design Tokens

### Colors
```css
--accent:    #6366F1  /* Primary brand */
--success:   #22C55E  /* Positive */
--warning:   #F59E0B  /* Caution */
--danger:    #EF4444  /* Critical */
--bg-card:   #1E293B  /* Card background */
```

### Typography
```css
font-family: 'Inter'
text-xs:     12px
text-sm:     14px
text-2xl:    24px
text-3xl:    30px
text-4xl:    36px
```

### Animations
```css
animate-fade-up: 0.5s ease both
transition-all:  200ms
```

---

## ✅ Testing Checklist

- [ ] Navigate to `/future-you`
- [ ] Empty state displays correctly
- [ ] Click "Refresh" button
- [ ] Loading state shows spinner
- [ ] All 12 cards appear after generation
- [ ] Circular progress animates smoothly
- [ ] Skill chips animate with stagger
- [ ] Timeline displays 4 milestones
- [ ] Risk badge shows correct color
- [ ] Confidence label displays correctly
- [ ] Future narrative is readable
- [ ] Recommendations list appears (max 5)
- [ ] Metrics grid is responsive
- [ ] Overall confidence bar animates
- [ ] Timestamp shows at bottom
- [ ] Back button navigates correctly
- [ ] Refresh generates new prediction
- [ ] Cached prediction loads instantly
- [ ] Responsive on mobile/tablet/desktop
- [ ] No console errors

---

## 🚀 Quick Start

```bash
# Navigate to Future You page
http://localhost:5173/future-you

# Or from Roadmap Dashboard
Click "View Prediction →" in Future You card
```

---

**Status**: ✅ Ready for User Testing
**Version**: Phase 8.5 Part 2
**Last Updated**: June 29, 2026
