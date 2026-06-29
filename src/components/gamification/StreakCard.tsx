/**
 * @file StreakCard.tsx
 * 
 * Premium streak display with fire emoji and extended metrics.
 * Shows daily, weekly, and monthly streak information.
 */

import { Flame, Trophy, Calendar, TrendingUp } from 'lucide-react';
import type { ExtendedStreakState } from '../../types/domain';

interface StreakCardProps {
  streak: ExtendedStreakState;
}

export default function StreakCard({ streak }: StreakCardProps) {
  return (
    <div className="rounded-2xl border border-white/5 bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2.5">
        <Flame size={15} className="text-warning" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
          Streak Tracker
        </h2>
      </div>

      {/* Main Streak Display */}
      <div className="mb-6 flex items-center justify-center gap-4 rounded-xl border border-warning/20 bg-gradient-to-br from-warning/10 to-danger/5 p-6">
        <Flame size={48} className="text-warning drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
        <div>
          <p className="text-xs font-medium text-text-secondary/60">CURRENT STREAK</p>
          <p className="text-5xl font-extrabold text-text-primary">{streak.currentStreak}</p>
          <p className="text-sm font-medium text-text-secondary">days in a row</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Longest Streak */}
        <div className="rounded-lg border border-white/5 bg-bg-secondary px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={14} className="text-warning" />
            <p className="text-xs font-medium text-text-secondary/60">Longest Streak</p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{streak.longestStreak}</p>
          <p className="text-xs text-text-secondary/60">days</p>
        </div>

        {/* Total Active Days */}
        <div className="rounded-lg border border-white/5 bg-bg-secondary px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className="text-success" />
            <p className="text-xs font-medium text-text-secondary/60">Total Active</p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{streak.totalActiveDays}</p>
          <p className="text-xs text-text-secondary/60">days</p>
        </div>

        {/* Weekly Streak */}
        <div className="rounded-lg border border-white/5 bg-bg-secondary px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-accent" />
            <p className="text-xs font-medium text-text-secondary/60">Weekly Streak</p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{streak.weeklyStreak}</p>
          <p className="text-xs text-text-secondary/60">weeks (5+ days)</p>
        </div>

        {/* Monthly Streak */}
        <div className="rounded-lg border border-white/5 bg-bg-secondary px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-accent" />
            <p className="text-xs font-medium text-text-secondary/60">Monthly Streak</p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{streak.monthlyStreak}</p>
          <p className="text-xs text-text-secondary/60">months (20+ days)</p>
        </div>
      </div>

      {/* Missed Days (if any) */}
      {streak.missedDays > 0 && (
        <div className="mt-4 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3">
          <p className="text-xs text-text-secondary/60">
            <span className="font-bold text-danger">{streak.missedDays}</span> missed days since start
          </p>
        </div>
      )}

      {/* Last Active */}
      {streak.lastActiveDate && (
        <p className="mt-4 text-center text-xs text-text-secondary/40">
          Last active: {new Date(streak.lastActiveDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
