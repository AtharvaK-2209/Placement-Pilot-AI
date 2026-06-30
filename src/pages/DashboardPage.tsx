/**
 * @file DashboardPage.tsx
 *
 * Phase 5.2 — Dashboard Frontend
 * Main landing page after login that displays user's complete status.
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import { useGamification } from '../hooks/useGamification';
import { AuthenticatedLayout } from '../components/AuthenticatedLayout';
import { GamificationSummary } from '../components/gamification';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import { NoDataEmptyState } from '../components/EmptyState';
import {
  Sun,
  Moon,
  Target,
  Calendar,
  TrendingUp,
  Map,
  BookOpen,
  Activity,
  HeartPulse,
  Clock,
  Flame,
  ArrowRight,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  LifeBuoy,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get goal from localStorage or app state (simplified for now)
  const goal = null; // TODO: Get from app state when available
  const displayName = user?.displayName || 'there';

  const { data, loading, error, refresh } = useDashboard(goal, displayName);
  const gamification = useGamification();

  // ─── Loading State ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AuthenticatedLayout>
        <DashboardSkeleton />
      </AuthenticatedLayout>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <AuthenticatedLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="max-w-md">
            <NoDataEmptyState 
              message={error?.message || 'Unable to load dashboard data'} 
              onRefresh={refresh}
            />
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // ─── Helper Functions ────────────────────────────────────────────────────────
  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return <Sun size={24} className="text-warning" />;
    if (hour < 17) return <Sun size={24} className="text-accent" />;
    return <Moon size={24} className="text-accent" />;
  };

  const getHealthColor = (level?: string) => {
    if (!level) return 'text-text-secondary';
    if (level === 'excellent' || level === 'healthy') return 'text-success';
    if (level === 'warning') return 'text-warning';
    return 'text-danger';
  };

  const getBurnoutColor = (risk?: string) => {
    if (!risk) return 'text-text-secondary';
    if (risk === 'low') return 'text-success';
    if (risk === 'medium') return 'text-warning';
    return 'text-danger';
  };

  // ─── Main Dashboard UI ───────────────────────────────────────────────────────
  return (
    <AuthenticatedLayout>
      <div>
        
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* HERO SECTION */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-12 animate-[fade-up_0.5s_ease_both]">
          <div className="flex items-center gap-3 mb-3">
            {getGreetingIcon()}
            <h1 className="text-4xl font-extrabold text-text-primary">
              {data.greeting.message}, {data.greeting.displayName}
            </h1>
          </div>
          <p className="text-lg text-text-secondary">
            Ready to move one step closer to your goal?
          </p>
          <p className="mt-2 text-sm text-text-secondary/60">
            {data.greeting.currentDate} · {data.greeting.currentTime}
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* MAIN GRID */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* ─── Column 1: Mission + Goal ───────────────────────────────────── */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            
            {/* CARD 1: Today's Mission */}
            {data.mission ? (
              <div className="animate-[fade-up_0.6s_ease_both] rounded-2xl border border-white/5 bg-bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-xl">
                <div className="mb-5 flex items-center gap-2.5">
                  <BookOpen size={15} className="text-accent" />
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                    Today's Mission
                  </h2>
                </div>
                
                <h3 className="mb-4 text-2xl font-bold text-text-primary">
                  {data.mission.title}
                </h3>
                
                <div className="mb-4 grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-white/5 bg-bg-secondary px-3 py-2">
                    <p className="text-xs text-text-secondary/60">Week</p>
                    <p className="text-lg font-bold text-text-primary">
                      {data.mission.weekNumber}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-bg-secondary px-3 py-2">
                    <p className="text-xs text-text-secondary/60">Day</p>
                    <p className="text-lg font-bold text-text-primary">
                      {data.mission.dayNumber}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-bg-secondary px-3 py-2">
                    <p className="text-xs text-text-secondary/60">Completion</p>
                    <p className="text-lg font-bold text-text-primary">
                      {data.mission.completionPercent}%
                    </p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-700"
                    style={{ width: `${data.mission.completionPercent}%` }}
                  />
                </div>
                
                <button
                  onClick={() => navigate('/daily-mission')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 font-semibold text-white transition-all hover:bg-accent/90 hover:shadow-lg"
                >
                  {data.mission.completed ? (
                    <>
                      <CheckCircle2 size={18} />
                      Mission Complete
                    </>
                  ) : (
                    <>
                      Continue Learning
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="animate-[fade-up_0.6s_ease_both] rounded-2xl border border-white/5 bg-bg-card p-6">
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <BookOpen size={32} className="text-text-secondary/30" />
                  <p className="text-sm text-text-secondary/60">
                    No mission available yet. Start by setting your goal!
                  </p>
                  <button
                    onClick={() => navigate('/goal')}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
                  >
                    Set Goal
                  </button>
                </div>
              </div>
            )}
            
            {/* CARD 2: Current Goal */}
            {data.goal ? (
              <div className="animate-[fade-up_0.7s_ease_both] rounded-2xl border border-white/5 bg-bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-xl">
                <div className="mb-5 flex items-center gap-2.5">
                  <Target size={15} className="text-accent" />
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                    Current Goal
                  </h2>
                </div>
                
                <h3 className="mb-4 text-xl font-bold text-text-primary">
                  {data.goal.goal}
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/5 bg-bg-secondary px-3 py-2">
                    <p className="text-xs text-text-secondary/60">Execution Mode</p>
                    <p className="text-sm font-bold text-text-primary">
                      {data.goal.executionMode || 'Balanced'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-bg-secondary px-3 py-2">
                    <p className="text-xs text-text-secondary/60">Completion</p>
                    <p className="text-sm font-bold text-text-primary">
                      {data.progress.overallCompletion}%
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            
          </div>
          
          {/* ─── Column 2: Health + Gamification + Week ──────────────────────────────── */}
          <div className="flex flex-col gap-6">
            
            {/* CARD 3: Gamification Summary */}
            {gamification.data && !gamification.loading && (
              <div className="animate-[fade-up_0.8s_ease_both]">
                <GamificationSummary
                  level={gamification.data.level}
                  totalXP={gamification.data.totalXP}
                  streak={gamification.data.streak}
                  latestBadge={gamification.data.badges.find((b) => !b.locked)}
                  weeklyGoal={gamification.data.weeklyGoal}
                  currentWeekProgress={gamification.currentWeekProgress}
                />
              </div>
            )}

            {/* CARD 4: Goal Health */}
            {data.goalHealth ? (
              <div className="animate-[fade-up_0.8s_ease_both] rounded-2xl border border-white/5 bg-bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <HeartPulse size={15} className="text-accent" />
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                      Goal Health
                    </h2>
                  </div>
                  <span className={`text-2xl font-extrabold ${getHealthColor(data.goalHealth.level)}`}>
                    {data.goalHealth.score}
                  </span>
                </div>
                
                <p className="mb-4 text-sm text-text-secondary">
                  {data.goalHealth.summary}
                </p>
                
                <div className="mb-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Flame size={14} className="text-warning" />
                    <span className="text-text-secondary">Burnout Risk</span>
                  </div>
                  <span className={`font-bold ${getBurnoutColor(data.goalHealth.burnoutRisk)}`}>
                    {data.goalHealth.burnoutRisk.toUpperCase()}
                  </span>
                </div>
                
                <div className="mb-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-success" />
                    <span className="text-text-secondary">Trend</span>
                  </div>
                  <span className="font-bold text-text-primary">
                    {data.goalHealth.trend === 'up' ? '↑ Improving' : 
                     data.goalHealth.trend === 'down' ? '↓ Declining' : '→ Stable'}
                  </span>
                </div>
                
                <button
                  onClick={() => navigate('/roadmap')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-bg-secondary px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:border-white/20 hover:text-text-primary"
                >
                  View Details
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : null}
            
            {/* CARD 5: Current Week */}
            {data.roadmap ? (
              <div className="animate-[fade-up_1s_ease_both] rounded-2xl border border-white/5 bg-bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-xl">
                <div className="mb-5 flex items-center gap-2.5">
                  <Calendar size={15} className="text-accent" />
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                    Current Week
                  </h2>
                </div>
                
                <div className="mb-4 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-text-primary">
                    Week {data.roadmap.currentWeek}
                  </span>
                  <span className="text-sm text-text-secondary/60">
                    of {data.roadmap.totalWeeks}
                  </span>
                </div>
                
                <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-700"
                    style={{ width: `${data.roadmap.currentWeekProgress}%` }}
                  />
                </div>
                
                <p className="mb-4 text-xs text-text-secondary/60">
                  {data.roadmap.currentWeekProgress}% complete
                </p>
                
                <button
                  onClick={() => navigate('/roadmap')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-bg-secondary px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:border-white/20 hover:text-text-primary"
                >
                  <Map size={14} />
                  Open Roadmap
                </button>
              </div>
            ) : null}
            
          </div>
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CARD 6: Upcoming Deadline */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {data.deadline ? (
          <div className="mt-6 animate-[fade-up_1.1s_ease_both] rounded-2xl border border-white/5 bg-bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-accent" />
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                    Upcoming Deadline
                  </h2>
                  <p className="mt-1 text-2xl font-bold text-text-primary">
                    {data.deadline.remainingDays} days remaining
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 md:items-end">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                    data.deadline.onTrack 
                      ? 'border-success/30 bg-success/10 text-success' 
                      : 'border-danger/30 bg-danger/10 text-danger'
                  }`}>
                    {data.deadline.onTrack ? '✓ On Track' : '⚠ Behind Schedule'}
                  </span>
                </div>
                <p className="text-xs text-text-secondary/60">
                  ETA: {new Date(data.deadline.estimatedCompletion).toLocaleDateString()}
                </p>
                {data.deadlineRescue?.active && (
                  <button
                    onClick={() => navigate('/roadmap')}
                    className="flex items-center gap-1.5 rounded-lg border border-danger/20 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:border-danger/30"
                  >
                    <LifeBuoy size={12} />
                    Rescue Mode Active
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}
        
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* QUICK ACTIONS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="mt-12 animate-[fade-up_1.2s_ease_both]">
          <h2 className="mb-6 text-2xl font-bold text-text-primary">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            
            {data.quickActions.canViewRoadmap && (
              <button
                onClick={() => navigate('/roadmap')}
                className="group flex items-center gap-4 rounded-xl border border-white/5 bg-bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lg"
              >
                <div className="rounded-lg bg-accent/10 p-3">
                  <Map size={20} className="text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary group-hover:text-accent">
                    Roadmap
                  </h3>
                  <p className="text-xs text-text-secondary">View your plan</p>
                </div>
              </button>
            )}
            
            {data.quickActions.canStartMission && (
              <button
                onClick={() => navigate('/daily-mission')}
                className="group flex items-center gap-4 rounded-xl border border-white/5 bg-bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-success/30 hover:shadow-lg"
              >
                <div className="rounded-lg bg-success/10 p-3">
                  <BookOpen size={20} className="text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary group-hover:text-success">
                    Today's Mission
                  </h3>
                  <p className="text-xs text-text-secondary">Start learning</p>
                </div>
              </button>
            )}
            
            {data.quickActions.canViewFutureYou && (
              <button
                onClick={() => navigate('/future-you')}
                className="group flex items-center gap-4 rounded-xl border border-white/5 bg-bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lg"
              >
                <div className="rounded-lg bg-accent/10 p-3">
                  <Sparkles size={20} className="text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary group-hover:text-accent">
                    Future You
                  </h3>
                  <p className="text-xs text-text-secondary">See your prediction</p>
                </div>
              </button>
            )}
            
            {data.quickActions.canCheckGoalHealth && (
              <button
                onClick={() => navigate('/roadmap')}
                className="group flex items-center gap-4 rounded-xl border border-white/5 bg-bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-warning/30 hover:shadow-lg"
              >
                <div className="rounded-lg bg-warning/10 p-3">
                  <HeartPulse size={20} className="text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary group-hover:text-warning">
                    Goal Health
                  </h3>
                  <p className="text-xs text-text-secondary">Check your status</p>
                </div>
              </button>
            )}
            
            <button
              onClick={() => navigate('/gamification')}
              className="group flex items-center gap-4 rounded-xl border border-white/5 bg-bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lg"
            >
              <div className="rounded-lg bg-accent/10 p-3">
                <Activity size={20} className="text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary group-hover:text-accent">
                  Achievements
                </h3>
                <p className="text-xs text-text-secondary">View badges & stats</p>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/roadmap')}
              className="group flex items-center gap-4 rounded-xl border border-white/5 bg-bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lg"
            >
              <div className="rounded-lg bg-accent/10 p-3">
                <Activity size={20} className="text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary group-hover:text-accent">
                  Execution Intelligence
                </h3>
                <p className="text-xs text-text-secondary">View insights</p>
              </div>
            </button>
            
            {data.quickActions.canActivateRescue && (
              <button
                onClick={() => navigate('/roadmap')}
                className="group flex items-center gap-4 rounded-xl border border-danger/20 bg-danger/10 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-danger/30 hover:shadow-lg"
              >
                <div className="rounded-lg bg-danger/20 p-3">
                  <LifeBuoy size={20} className="text-danger" />
                </div>
                <div>
                  <h3 className="font-semibold text-danger">
                    Deadline Rescue
                  </h3>
                  <p className="text-xs text-text-secondary">Activate recovery</p>
                </div>
              </button>
            )}
          </div>
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* REFRESH BUTTON */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-bg-card px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:border-white/20 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Dashboard
          </button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
