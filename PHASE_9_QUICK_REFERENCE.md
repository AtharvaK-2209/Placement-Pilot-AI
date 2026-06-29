# Phase 9 Quick Reference — Deadline Rescue Mode

## 🚀 Quick Start

### Activation
```typescript
import { useDeadlineRescue } from '../hooks/useDeadlineRescue';

const { strategy, checkActivation, activate, deactivate } = useDeadlineRescue();

// Check if rescue needed (deterministic, no AI)
const check = await checkActivation(
  goalHealthScore,
  goalHealthLevel,
  burnoutRisk,
  deadlineRisk,
  estimatedCompletionDate,
  estimatedDaysRemaining,
  deadline
);

// If needed, activate rescue (AI call)
if (check.shouldActivate) {
  await activate(/* ... params */);
}
```

### Display
```typescript
import DeadlineRescueCard from '../components/DeadlineRescueCard';

<DeadlineRescueCard
  strategy={strategy}
  loading={loading}
  error={error}
  onDeactivate={deactivate}
/>
```

## 📋 Activation Criteria

Activates if ANY of:
- ✓ Days behind ≥ 7
- ✓ ETA > deadline
- ✓ Deadline risk = high
- ✓ Goal Health < 40
- ✓ Days/week < 5
- ✓ Pace < required × 0.7

## 🎯 Recovery Actions

| Type | Description | Risk |
|------|-------------|------|
| `skip_optional` | Skip non-critical | Low |
| `merge_weeks` | Combine weeks | Medium |
| `compress_revision` | Reduce revision | Medium |
| `focus_high_weight` | Prioritize DSA | Low |
| `increase_hours` | Boost study time | High |

## 💾 Firestore Structure

```
users/{uid}/
  └─ deadlineRescue/
      ├─ latest         (current strategy)
      └─ history/       (immutable log)
          └─ {timestamp}
```

## ⚡ Performance

- Activation check: < 5ms (no AI)
- Strategy gen: 500-1000ms
- Token usage: ~1000 tokens
- Cache TTL: 1 hour

## 🎨 UI Components

```typescript
// Deadline status in Goal Health
deadlineStatus: 'on_track' | 'slightly_behind' | 'rescue_active' | 'critical'

// Color codes
🟢 On Track (green)
🟡 Slightly Behind (yellow)  
🔴 Rescue Active (red)
🔴 Critical (red)
```

## 📊 Example Strategy

```json
{
  "status": "active",
  "daysBehind": 9,
  "recoveryActions": [
    {
      "type": "merge_weeks",
      "description": "Merge Week 3 + 4",
      "impact": "Saves 5 days",
      "priority": "high"
    }
  ],
  "recommendedDailyHours": 2.5,
  "recoveryProbability": 82,
  "confidence": 88
}
```

## 🔗 Integration Points

- **Goal Health**: Computes deadline status
- **Execution Intelligence**: Provides deadline risk
- **Progress Tracking**: Reads completion data
- **AI Request Manager**: Handles caching

---

**For complete documentation, see:**
- `PHASE_9_SUMMARY.md` — Overview
- `PHASE_9_VERIFICATION.md` — Testing
- `PHASE_9_COMPLETE.md` — Implementation details
- `PHASE_9_FINAL_REPORT.txt` — Text report
