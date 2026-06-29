/**
 * @file GamificationDashboard.tsx
 * 
 * Main gamification dashboard page showing all gamification features.
 * Displays level, XP, badges, streaks, milestones, and weekly goals.
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { useGamification } from '../../hooks/useGamification';

import LevelCard from './LevelCard';
import StreakCard from './StreakCard';
import BadgeGallery from './BadgeGallery';
import XPHistoryTimeline from './XPHistoryTimeline';
import WeeklyGoalsCard from './WeeklyGoalsCard';
import MilestonesTimeline from './MilestonesTimeline';

export default function GamificationDashboard() {
  const navigate = useNavigate();
  const { data: state, currentWeekProgress, xpLog, loading, error, refresh } = useGamification();

  // ─── Loading State ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-accent" />
          <p className="text-sm text-text-secondary">Loading gamification...</p>
        </div>
      </div>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────────────────
  if (error || !state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary px-6">
        <div className="max-w-md rounded-2xl border border-danger/20 bg-danger/10 p-6 text-center">
          <AlertTriangle className="mx-auto mb-4 text-danger" size={32} />
          <h2 className="mb-2 text-lg font-bold text-text-primary">Failed to Load</h2>
          <p className="mb-4 text-sm text-text-secondary">{error?.message || 'Unknown error'}</p>
          <button
            onClick={refresh}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-12 animate-[fade-up_0.5s_ease_both]">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-6 flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-4xl font-extrabold text-text-primary">
                Your Achievements
              </h1>
              <p className="text-lg text-text-secondary">
                Track your progress, unlock badges, and reach new milestones
              </p>
            </div>
            <button
              onClick={refresh}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-bg-card px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:border-white/20 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Column 1: Level & Streak */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Level Card */}
            <div className="animate-[fade-up_0.6s_ease_both]">
              <LevelCard level={state.level} totalXP={state.totalXP} />
            </div>

            {/* Badge Gallery */}
            <div className="animate-[fade-up_0.7s_ease_both]">
              <BadgeGallery badges={state.badges} />
            </div>

            {/* XP History */}
            <div className="animate-[fade-up_0.8s_ease_both]">
              <XPHistoryTimeline xpLog={xpLog} limit={15} />
            </div>
          </div>

          {/* Column 2: Streak, Weekly Goals & Milestones */}
          <div className="flex flex-col gap-6">
            {/* Streak Card */}
            <div className="animate-[fade-up_0.6s_ease_both]">
              <StreakCard streak={state.streak} />
            </div>

            {/* Weekly Goals */}
            <div className="animate-[fade-up_0.7s_ease_both]">
              <WeeklyGoalsCard
                weeklyGoal={state.weeklyGoal}
                currentWeekProgress={currentWeekProgress}
              />
            </div>
          </div>
        </div>

        {/* Milestones Timeline (Full Width) */}
        <div className="mt-6 animate-[fade-up_0.9s_ease_both]">
          <MilestonesTimeline milestones={state.milestones} />
        </div>

        {/* Stats Summary */}
        <div className="mt-12 animate-[fade-up_1s_ease_both] rounded-2xl border border-white/5 bg-bg-card p-6">
          <h2 className="mb-6 text-2xl font-bold text-text-primary">Journey Stats</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="rounded-lg border border-white/5 bg-bg-secondary px-4 py-3">
              <p className="text-xs font-medium text-text-secondary/60">Tasks Completed</p>
              <p className="text-2xl font-bold text-text-primary">{state.tasksCompleted}</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-bg-secondary px-4 py-3">
              <p className="text-xs font-medium text-text-secondary/60">Badges Unlocked</p>
              <p className="text-2xl font-bold text-text-primary">
                {state.badges.filter((b) => !b.locked).length}
              </p>
            </div>
            <div className="rounded-lg border border-white/5 bg-bg-secondary px-4 py-3">
              <p className="text-xs font-medium text-text-secondary/60">Milestones Reached</p>
              <p className="text-2xl font-bold text-text-primary">
                {state.milestones.filter((m) => m.unlocked).length}
              </p>
            </div>
            <div className="rounded-lg border border-white/5 bg-bg-secondary px-4 py-3">
              <p className="text-xs font-medium text-text-secondary/60">Active Days</p>
              <p className="text-2xl font-bold text-text-primary">
                {state.streak.totalActiveDays}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
