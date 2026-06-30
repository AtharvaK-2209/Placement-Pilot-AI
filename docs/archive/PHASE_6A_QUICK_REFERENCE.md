# Phase 6A Quick Reference Guide

Quick reference for using the new UX components added in Phase 6A.

---

## 📦 Importing Components

```typescript
// All-in-one import
import {
  Button,
  useToast,
  LoadingSpinner,
  EmptyState,
  SkeletonLoader,
} from '../components';

// Or individual imports
import { Button } from '../components/Button';
import { useToast } from '../components/ToastProvider';
```

---

## 🍞 Toast Notifications

### Basic Usage

```typescript
import { useToast } from '../components/ToastProvider';

function MyComponent() {
  const toast = useToast();
  
  // Success
  toast.success('Goal saved successfully!');
  
  // Error
  toast.error('Failed to load data', 'Please check your connection.');
  
  // Warning
  toast.warning('Goal health is declining');
  
  // Info
  toast.info('New feature available!');
}
```

### Custom Duration

```typescript
toast.show('Custom message', 'success', { 
  duration: 5000,  // 5 seconds
  description: 'Additional details here' 
});
```

---

## 🔘 Buttons

### Button Variants

```typescript
import { Button } from '../components/Button';

// Primary (default)
<Button onClick={handleClick}>
  Save Changes
</Button>

// Secondary
<Button variant="secondary" onClick={handleClick}>
  Cancel
</Button>

// Outline
<Button variant="outline" onClick={handleClick}>
  Learn More
</Button>

// Ghost (minimal)
<Button variant="ghost" onClick={handleClick}>
  Skip
</Button>

// Danger (destructive)
<Button variant="danger" onClick={handleDelete}>
  Delete Goal
</Button>
```

### Button Sizes

```typescript
<Button size="sm">Small</Button>
<Button size="md">Medium</Button> {/* default */}
<Button size="lg">Large</Button>
```

### Button States

```typescript
import { Save, ArrowRight } from 'lucide-react';

// With loading state
<Button 
  loading={isLoading} 
  disabled={isLoading}
  onClick={handleSave}
>
  {isLoading ? 'Saving...' : 'Save'}
</Button>

// With icon
<Button 
  icon={<Save size={16} />} 
  iconPosition="left"
>
  Save Goal
</Button>

// Icon on right
<Button 
  icon={<ArrowRight size={16} />} 
  iconPosition="right"
>
  Continue
</Button>

// Full width
<Button fullWidth>
  Get Started
</Button>

// Disabled
<Button disabled>
  Cannot Click
</Button>
```

### Icon Button

```typescript
import { IconButton } from '../components/Button';
import { X, Edit } from 'lucide-react';

<IconButton 
  icon={<X size={16} />}
  onClick={handleClose}
  aria-label="Close modal"
/>

<IconButton 
  icon={<Edit size={16} />}
  variant="primary"
  size="sm"
  aria-label="Edit goal"
/>
```

### Button Group

```typescript
import { ButtonGroup } from '../components/Button';

<ButtonGroup>
  <Button variant="primary">Save</Button>
  <Button variant="secondary">Cancel</Button>
</ButtonGroup>
```

---

## ⏳ Loading States

### Loading Spinners

```typescript
import { 
  LoadingSpinner,
  FullPageLoading,
  CardLoading,
  InlineLoading,
} from '../components/LoadingSpinner';

// Basic spinner
<LoadingSpinner size="md" message="Loading..." />

// Full page
<FullPageLoading message="Loading dashboard..." />

// Inside a card
<CardLoading message="Fetching data..." />

// Inline (small)
<InlineLoading message="Saving..." />
```

### Predefined Loading Messages

```typescript
import {
  AnalyzingLoader,
  GeneratingRoadmapLoader,
  GeneratingMissionLoader,
  ComputingHealthLoader,
  PredictingFutureLoader,
} from '../components/LoadingSpinner';

// Use specific loaders
{isAnalyzing && <AnalyzingLoader />}
{isGenerating && <GeneratingRoadmapLoader />}
```

### Progress Loader (Multi-step)

```typescript
import { ProgressLoader } from '../components/LoadingSpinner';

const steps = [
  'Analyzing goal...',
  'Checking feasibility...',
  'Generating roadmap...',
  'Finalizing plan...',
];

<ProgressLoader steps={steps} currentStep={currentStep} />
```

---

## 💀 Skeleton Loaders

### Page Skeletons

```typescript
import {
  DashboardSkeleton,
  RoadmapSkeleton,
  DailyMissionSkeleton,
  GoalAnalysisSkeleton,
  FutureYouSkeleton,
} from '../components/SkeletonLoader';

// Show skeleton while loading
{loading ? (
  <DashboardSkeleton />
) : (
  <DashboardContent data={data} />
)}
```

### Component Skeletons

```typescript
import {
  GoalHealthSkeleton,
  DeadlineRescueSkeleton,
  ContentSkeleton,
} from '../components/SkeletonLoader';

// Card skeleton
{healthLoading && <GoalHealthSkeleton />}

// Generic content skeleton
<ContentSkeleton lines={3} includeTitle />
```

### Base Skeleton Elements

```typescript
import { Skeleton, CardSkeleton } from '../components/SkeletonLoader';

// Custom skeleton layouts
<CardSkeleton>
  <Skeleton className="h-8 w-32 mb-4" />
  <Skeleton className="h-4 w-full" variant="text" />
  <Skeleton className="h-4 w-5/6" variant="text" />
  <Skeleton className="h-10 w-24 mt-4" variant="button" />
</CardSkeleton>

// Variants
<Skeleton variant="default" />  {/* rounded rectangle */}
<Skeleton variant="circle" />   {/* circular */}
<Skeleton variant="text" />     {/* text line */}
<Skeleton variant="button" />   {/* button shape */}
```

---

## 📭 Empty States

### Predefined Empty States

```typescript
import {
  NoGoalEmptyState,
  NoRoadmapEmptyState,
  NoMissionEmptyState,
  NoFuturePredictionEmptyState,
  NoGoalHealthEmptyState,
  NoDeadlineRescueEmptyState,
  NoDataEmptyState,
} from '../components/EmptyState';

// No goal set
{!goal && (
  <NoGoalEmptyState 
    onCreateGoal={() => navigate('/goal')} 
  />
)}

// No roadmap
{!roadmap && (
  <NoRoadmapEmptyState 
    onGenerateRoadmap={handleGenerate}
    onBackToGoal={() => navigate('/goal')}
  />
)}

// Generic no data
{!data && (
  <NoDataEmptyState 
    message="No progress data available yet"
    onRefresh={handleRefresh}
  />
)}
```

### Custom Empty State

```typescript
import { EmptyState } from '../components/EmptyState';
import { Trophy } from 'lucide-react';

<EmptyState
  icon={<Trophy size={32} />}
  title="No Achievements Yet"
  description="Complete your first mission to unlock achievements."
  action={{
    label: 'Start Mission',
    onClick: () => navigate('/daily-mission'),
  }}
  secondaryAction={{
    label: 'Learn More',
    onClick: () => setShowInfo(true),
  }}
/>
```

### Card-Sized Empty State

```typescript
import { CardEmptyState } from '../components/EmptyState';
import { Star } from 'lucide-react';

<CardEmptyState
  icon={<Star size={24} />}
  message="No achievements unlocked yet"
  action={{
    label: 'View All',
    onClick: handleViewAll,
  }}
/>
```

---

## 🛡️ Error Boundary

### Wrap Components

```typescript
import { ErrorBoundary } from '../components/ErrorBoundary';

// Wrap entire app (done in App.tsx)
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Wrap specific components
<ErrorBoundary 
  onReset={() => {
    // Reset component state
    setError(null);
  }}
>
  <ComplexComponent />
</ErrorBoundary>
```

### Custom Fallback

```typescript
import { ErrorBoundary, ErrorFallback } from '../components/ErrorBoundary';

<ErrorBoundary
  fallback={
    <ErrorFallback 
      error={error}
      resetError={() => setError(null)}
    />
  }
>
  <MyComponent />
</ErrorBoundary>
```

---

## 🚫 404 Page

The 404 page is automatically handled by the catch-all route in `App.tsx`:

```typescript
<Route path="*" element={<NotFoundPage />} />
```

Users will see the custom 404 page when navigating to invalid routes.

---

## 🎨 Styling Conventions

### Colors

```typescript
// From design system (src/index.css)
bg-bg-primary      // #0B1120 - Main background
bg-bg-secondary    // #111827 - Secondary background
bg-bg-card         // #1E293B - Card background

text-text-primary     // #F8FAFC - Primary text
text-text-secondary   // #94A3B8 - Secondary text

text-accent    // #6366F1 - Accent (purple)
text-success   // #22C55E - Success (green)
text-warning   // #F59E0B - Warning (orange)
text-danger    // #EF4444 - Error (red)
```

### Common Patterns

```typescript
// Card container
className="rounded-2xl border border-white/5 bg-bg-card p-6"

// Button-like interactive element
className="rounded-xl bg-accent px-6 py-3 text-white hover:bg-accent/90"

// Section heading
className="text-xs font-semibold uppercase tracking-widest text-text-secondary"

// Card hover effect
className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
```

---

## 🔄 Common Patterns

### Loading → Content Transition

```typescript
function MyPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData().then(result => {
      setData(result);
      setLoading(false);
    });
  }, []);
  
  if (loading) {
    return <DashboardSkeleton />;
  }
  
  if (!data) {
    return <NoDataEmptyState onRefresh={fetchData} />;
  }
  
  return <DashboardContent data={data} />;
}
```

### Async Action with Toast

```typescript
const toast = useToast();
const [saving, setSaving] = useState(false);

async function handleSave() {
  setSaving(true);
  try {
    await saveGoal(goal);
    toast.success('Goal saved successfully!');
    navigate('/dashboard');
  } catch (error) {
    toast.error('Failed to save goal', error.message);
  } finally {
    setSaving(false);
  }
}

return (
  <Button 
    onClick={handleSave}
    loading={saving}
    disabled={saving}
  >
    {saving ? 'Saving...' : 'Save Goal'}
  </Button>
);
```

### Error Handling Pattern

```typescript
const toast = useToast();
const [error, setError] = useState(null);

async function fetchData() {
  try {
    setError(null);
    const result = await api.getData();
    return result;
  } catch (err) {
    setError(err);
    toast.error('Failed to load data', 'Please try again.');
    throw err;
  }
}

if (error) {
  return (
    <NoDataEmptyState 
      message={error.message}
      onRefresh={fetchData}
    />
  );
}
```

---

## 🎯 Best Practices

### Do's ✅

- Use skeleton loaders for initial page loads
- Show descriptive loading messages
- Use toast for transient feedback (success, errors)
- Disable buttons during async operations
- Provide empty states with clear CTAs
- Use consistent button variants across the app
- Test responsive layouts on mobile devices
- Ensure minimum 44px touch targets on mobile
- Provide keyboard navigation
- Add aria-labels to icon buttons

### Don'ts ❌

- Don't use browser `alert()` - use toast notifications
- Don't show blank screens - use skeletons or empty states
- Don't expose error stack traces to users
- Don't allow duplicate button clicks during loading
- Don't forget loading states for async operations
- Don't hardcode colors - use design tokens
- Don't forget mobile responsive testing
- Don't skip accessibility attributes
- Don't use `console.log()` in production code

---

## 📚 Related Files

- **Components:** `src/components/`
- **Summary:** `PHASE_6A_SUMMARY.md`
- **Verification:** `PHASE_6A_VERIFICATION.md`
- **Styles:** `src/index.css`

---

**Last Updated:** December 29, 2024  
**Phase:** 6A - Core UX & Functional Polish
