/**
 * @file healthMetrics.ts
 *
 * Deterministic calculations for Goal Health dashboard metrics.
 * Phase 8.1: ETA, completion %, days remaining.
 *
 * ── RULES ────────────────────────────────────────────────────────────
 * All calculations are deterministic — NO AI calls.
 * Used to populate GoalHealthScore with calculated metrics.
 * ─────────────────────────────────────────────────────────────────────
 */

// ─── ETA Calculation ───────────────────────────────────────────────────────────

export interface ETAResult {
  /** Estimated completion date as ISO date string (YYYY-MM-DD) */
  estimatedCompletionDate: string;
  /** Estimated days remaining (can be negative if behind) */
  estimatedDaysRemaining:  number;
  /** Whether the user is on track (true), ahead (true), or behind (false) */
  onTrack:                 boolean;
  /** Days ahead (+) or behind (-) compared to deadline */
  deadlineDelta:           number;
}

/**
 * Computes estimated completion date based on current progress rate.
 *
 * Algorithm:
 * 1. Calculate weekly completion rate from completed weeks
 * 2. If rate is 0, assume 1 week per week (default pace)
 * 3. Estimate remaining weeks = remainingWeeks / weeklyRate
 * 4. Project completion date from today + remaining weeks
 * 5. Compare with deadline to determine if on track
 */
export function calculateETA(params: {
  completedWeeks:   number;
  totalWeeks:       number;
  deadline:         string;
  currentDate?:     string;
}): ETAResult {
  const { completedWeeks, totalWeeks, deadline, currentDate } = params;

  const today = currentDate ? new Date(currentDate) : new Date();
  
  // DEFENSIVE: Ensure deadline is a valid date string
  let deadlineDate: Date;
  if (!deadline || isNaN(new Date(deadline).getTime())) {
    // If deadline is invalid, calculate a default one (8 weeks from now)
    deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + (56)); // 8 weeks
  } else {
    deadlineDate = new Date(deadline);
  }

  // Calculate remaining work
  const remainingWeeks = Math.max(0, totalWeeks - completedWeeks);

  // Calculate weekly completion rate
  // Assume we've been working for at least completedWeeks
  const weeksElapsed = Math.max(completedWeeks, 1);
  const weeklyRate = completedWeeks / weeksElapsed;

  // Estimate remaining time
  let estimatedWeeksRemaining: number;
  if (weeklyRate <= 0) {
    // No progress yet — assume 1 week per week
    estimatedWeeksRemaining = remainingWeeks;
  } else {
    // Project based on current rate
    estimatedWeeksRemaining = remainingWeeks / weeklyRate;
  }

  // Calculate estimated completion date
  const estimatedCompletionDate = new Date(today);
  estimatedCompletionDate.setDate(
    estimatedCompletionDate.getDate() + Math.ceil(estimatedWeeksRemaining * 7)
  );

  // Calculate days remaining
  const estimatedDaysRemaining = Math.ceil(
    (estimatedCompletionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate deadline delta
  const deadlineDelta = Math.ceil(
    (deadlineDate.getTime() - estimatedCompletionDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    estimatedCompletionDate: estimatedCompletionDate.toISOString().split('T')[0],
    estimatedDaysRemaining,
    onTrack:                 deadlineDelta >= 0,
    deadlineDelta,
  };
}

// ─── Human-readable ETA formatting ────────────────────────────────────────────

/**
 * Formats ETA result into user-friendly message.
 *
 * Examples:
 * - "12 August 2026"
 * - "Likely to finish 5 days before deadline"
 * - "Likely to finish 9 days late"
 */
export function formatETA(eta: ETAResult): string {
  const completionDate = new Date(eta.estimatedCompletionDate);

  // Format date nicely
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  const dateStr = completionDate.toLocaleDateString('en-US', options);

  // Check if on track
  if (eta.deadlineDelta === 0) {
    return `${dateStr} (on deadline)`;
  } else if (eta.deadlineDelta > 0) {
    return `${dateStr} (${Math.abs(eta.deadlineDelta)} days early)`;
  } else {
    return `${dateStr} (${Math.abs(eta.deadlineDelta)} days late)`;
  }
}

// ─── Weekly Trend Calculation ──────────────────────────────────────────────────

/**
 * Calculates the score change from the previous week.
 * Used to display ↑ +6 or ↓ -4 badges.
 */
export function calculateWeeklyTrend(
  currentScore:  number,
  previousScore: number | undefined,
): { delta: number; direction: 'up' | 'down' | 'stable' } {
  if (previousScore === undefined) {
    return { delta: 0, direction: 'stable' };
  }

  const delta = currentScore - previousScore;

  return {
    delta,
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable',
  };
}
