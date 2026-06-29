/**
 * @file WeeklyGoalsCard.tsx
 * 
 * Premium weekly goals display with progress bars and completion tracking.
 * Shows mission and XP goals for the current week.
 */

import { Target, CheckCircle2, Zap, TrendingUp } from 'lucide-react';
import type { WeeklyGoal } from '../../types/domain';

interface WeeklyGoalsCardProps {
  weeklyGoal: WeeklyGoal;
  currentWeekProgress: {
    missionProgress: number;
    xpProgress: number;
    overallProgress: number;
  };
}

export default function WeeklyGoalsCard({
  weeklyGoal,
  currentWeekProgress,
}: WeeklyGoalsCardProps) {
  const missionPercent = (weeklyGoal.completedMissions / weeklyGoal.targetMissions) * 100;
  const xpPercent = (weeklyGoal.earnedXP / weeklyGoal.targetXP) * 100;

  const isComplete = weeklyGoal.completed;
  const isMissionComplete = weeklyGoal.completedMissions >= weeklyGoal.targetMissions;
  const isXPComplete = weeklyGoal.earnedXP >= weeklyGoal.targetXP;

  return (
    <div className="rounded-2xl border border-white/5 bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Target size={15} className="text-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
            Weekly Goals
          </h2>
        </div>
        {isComplete && (
          <div className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1">
            <CheckCircle2 size={12} className="text-success" />
            <span className="text-xs font-bold text-success">Complete</span>
          </div>
        )}
      </div>

      {/* Week Info */}
      <div className="mb-6 rounded-lg border border-white/5 bg-bg-secondary p-4">
        <p className="mb-1 text-xs font-medium text-text-secondary/60">Current Week</p>
        <p className="text-sm text-text-primary">
          {new Date(weeklyGoal.weekStartDate).toLocaleDateString()} -{' '}
          {new Date(weeklyGoal.weekEndDate).toLocaleDateString()}
        </p>
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-text-secondary/60">Overall Progress</span>
          <span className="text-sm font-bold text-accent">
            {currentWeekProgress.overallProgress.toFixed(0)}%
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-success transition-all duration-700"
            style={{ width: `${currentWeekProgress.overallProgress}%` }}
          />
        </div>
      </div>

      {/* Goals */}
      <div className="space-y-4">
        {/* Mission Goal */}
        <div
          className={`rounded-lg border p-4 transition-all ${
            isMissionComplete
              ? 'border-success/30 bg-success/10'
              : 'border-white/5 bg-bg-secondary'
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={14} className={isMissionComplete ? 'text-success' : 'text-accent'} />
              <span className="text-sm font-medium text-text-secondary">Mission Goal</span>
            </div>
            {isMissionComplete && (
              <CheckCircle2 size={14} className="text-success" />
            )}
          </div>

          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-text-primary">
              {weeklyGoal.completedMissions}
            </span>
            <span className="text-sm text-text-secondary">
              / {weeklyGoal.targetMissions} missions
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isMissionComplete ? 'bg-success' : 'bg-accent'
              }`}
              style={{ width: `${Math.min(missionPercent, 100)}%` }}
            />
          </div>

          {!isMissionComplete && (
            <p className="mt-2 text-xs text-text-secondary/60">
              {weeklyGoal.targetMissions - weeklyGoal.completedMissions} missions remaining
            </p>
          )}
        </div>

        {/* XP Goal */}
        <div
          className={`rounded-lg border p-4 transition-all ${
            isXPComplete
              ? 'border-success/30 bg-success/10'
              : 'border-white/5 bg-bg-secondary'
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={14} className={isXPComplete ? 'text-success' : 'text-warning'} />
              <span className="text-sm font-medium text-text-secondary">XP Goal</span>
            </div>
            {isXPComplete && (
              <CheckCircle2 size={14} className="text-success" />
            )}
          </div>

          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-text-primary">
              {weeklyGoal.earnedXP}
            </span>
            <span className="text-sm text-text-secondary">
              / {weeklyGoal.targetXP} XP
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isXPComplete ? 'bg-success' : 'bg-warning'
              }`}
              style={{ width: `${Math.min(xpPercent, 100)}%` }}
            />
          </div>

          {!isXPComplete && (
            <p className="mt-2 text-xs text-text-secondary/60">
              {weeklyGoal.targetXP - weeklyGoal.earnedXP} XP remaining
            </p>
          )}
        </div>
      </div>

      {/* Completion Message */}
      {isComplete && weeklyGoal.completedAt && (
        <div className="mt-6 rounded-lg border border-success/30 bg-success/10 p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp size={16} className="text-success" />
            <p className="text-sm font-bold text-success">Week Complete!</p>
          </div>
          <p className="text-xs text-text-secondary/60">
            Completed on {new Date(weeklyGoal.completedAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Motivational Message */}
      {!isComplete && (
        <div className="mt-6 rounded-lg border border-accent/20 bg-accent/10 p-4 text-center">
          <p className="text-xs text-accent">
            {currentWeekProgress.overallProgress >= 75
              ? '🎯 Almost there! Keep pushing!'
              : currentWeekProgress.overallProgress >= 50
              ? '💪 Great progress! You\'re halfway there!'
              : currentWeekProgress.overallProgress >= 25
              ? '🚀 Good start! Keep the momentum going!'
              : '✨ Let\'s make this week count!'}
          </p>
        </div>
      )}
    </div>
  );
}
