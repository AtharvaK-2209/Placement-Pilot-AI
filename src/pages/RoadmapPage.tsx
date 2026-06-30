import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Code2,
  Trophy,
  RotateCcw,
  Briefcase,
  Flame,
  Clock,
  Calendar,
  Map,
  Zap,
  Star,
  RefreshCw,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { AuthenticatedLayout } from '../components/AuthenticatedLayout';
import { NoRoadmapEmptyState } from '../components/EmptyState';
import type { RoadmapResponse, RoadmapWeek } from '../ai/schemas/roadmap.schema';
import type { GoalInput } from '../types/goal';
import { ProgressService }         from '../services/progressService';
import { XPService }               from '../services/xpService';
import { StreakService }            from '../services/streakService';
import { AchievementService }      from '../services/achievementService';
import { RoadmapService }          from '../services/roadmapService';
import { RoadmapProgressService }  from '../services/roadmapProgressService';
import { useRepository }           from '../hooks/useRepository';
import { useRoadmapRepository }    from '../hooks/useRoadmapRepository';
import { useRoadmapProgressRepository } from '../hooks/useRoadmapProgressRepository';
import type { RoadmapProgress }    from '../types/roadmapProgress';
import { useAuth }            from '../contexts/AuthContext';
import { replanRoadmap }      from '../ai/dynamicReplanning';
import type { ReplanResult }  from '../ai/dynamicReplanning';
import { useGoalHealth }      from '../hooks/useGoalHealth';
import { useDeadlineRescue }  from '../hooks/useDeadlineRescue';
import GoalHealthCard          from '../components/GoalHealthCard';
import DeadlineRescueCard      from '../components/DeadlineRescueCard';
import type { WeekProgress, StreakState, Achievement } from '../types/progress';

// ─── Router state ─────────────────────────────────────────────────────────────

interface RoadmapLocationState {
  roadmapResult: RoadmapResponse;
  goalInput?: GoalInput;
}

// ─── Week type helpers ────────────────────────────────────────────────────────

function weekTypeIcon(type: RoadmapWeek['type']) {
  switch (type) {
    case 'revision':  return <RotateCcw size={13} />;
    case 'project':   return <Code2 size={13} />;
    case 'interview': return <Briefcase size={13} />;
    default:          return <BookOpen size={13} />;
  }
}

function weekTypeBadge(type: RoadmapWeek['type']) {
  switch (type) {
    case 'revision':  return 'border-warning/30 bg-warning/10 text-warning';
    case 'project':   return 'border-success/30 bg-success/10 text-success';
    case 'interview': return 'border-accent/30 bg-accent/10 text-accent';
    default:          return 'border-white/10 bg-white/5 text-text-secondary';
  }
}

function weekTypeLabel(type: RoadmapWeek['type']) {
  switch (type) {
    case 'revision':  return 'Revision';
    case 'project':   return 'Project';
    case 'interview': return 'Interview Prep';
    default:          return 'Learning';
  }
}

// ─── Shared card ──────────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/5 bg-bg-card ${className}`}>
      {children}
    </div>
  );
}

function ProgressBar({ percent, color = 'bg-accent' }: { percent: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}

// ─── Week Card ────────────────────────────────────────────────────────────────

function WeekCard({ week, weekProgress, weekStatus }: {
  week: RoadmapWeek;
  weekProgress?: WeekProgress;
  weekStatus?: import('../types/roadmapProgress').WeekExecutionStatus;
}) {
  const [expanded, setExpanded] = useState(false);
  const pct  = weekProgress?.completionPercent ?? 0;
  const done = weekProgress?.completed ?? false;
  const isLocked = weekStatus?.status === 'locked';

  return (
    <Card className={isLocked ? 'opacity-50' : ''}>
      {/* Lock banner */}
      {isLocked && (
        <div className="flex items-center gap-2 border-b border-white/5 px-5 py-2.5">
          <Lock size={12} className="text-text-secondary/50" />
          <p className="text-xs text-text-secondary/50">
            Complete Week {week.week - 1} to unlock
          </p>
        </div>
      )}
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => !isLocked && setExpanded((v) => !v)}
        disabled={isLocked}
        className={[
          'flex w-full items-start justify-between gap-4 p-5 text-left transition-colors duration-150',
          isLocked ? 'cursor-not-allowed' : 'hover:bg-white/2',
        ].join(' ')}
      >
        <div className="flex items-start gap-4">
          {/* Week number badge */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-sm font-bold text-accent">
            {week.week}
          </div>

          <div className="flex flex-col gap-1.5">
            {/* Title */}
            <h3 className="text-sm font-semibold leading-snug text-text-primary">
              {week.title}
            </h3>

            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Week type badge */}
              <span
                className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${weekTypeBadge(week.type)}`}
              >
                {weekTypeIcon(week.type)}
                {weekTypeLabel(week.type)}
              </span>

              {/* Hours */}
              <span className="flex items-center gap-1 text-xs text-text-secondary/60">
                <Clock size={11} />
                {week.estimatedHours}h
              </span>

              {/* Module topics chips */}
              {week.modules.map((m) => (
                <span
                  key={m.blueprintId}
                  className="rounded-full border border-white/8 bg-white/4 px-2.5 py-0.5 text-xs text-text-secondary"
                >
                  {m.title}
                </span>
              ))}
            </div>

            {/* Focus note */}
            {week.focusNote && (
              <p className="text-xs italic text-text-secondary/50">{week.focusNote}</p>
            )}

            {/* Week progress display */}
            {(pct > 0 || (weekStatus?.generatedDays ?? 0) > 0) && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <ProgressBar percent={pct} color={done ? 'bg-success' : 'bg-accent'} />
                  </div>
                  <span className="text-xs text-text-secondary/50">{pct}%</span>
                  {done && <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">✓</span>}
                </div>
                
                {/* Daily mission progress details */}
                {weekStatus && ((weekStatus.generatedDays ?? 0) > 0 || (weekStatus.completedDays ?? 0) > 0) && (
                  <div className="flex items-center gap-3 text-xs text-text-secondary/60">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {weekStatus.completedDays ?? 0}/{weekStatus.generatedDays ?? 0} days completed
                    </span>
                    {(weekStatus.generatedDays ?? 0) < 7 && (
                      <span className="text-text-secondary/40">
                        ({7 - (weekStatus.generatedDays ?? 0)} days not generated)
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <span className="mt-0.5 shrink-0 text-text-secondary/50 transition-transform duration-200">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/5 p-5">
          <div className="grid gap-6 sm:grid-cols-2">
            {week.modules.map((mod) => (
              <div key={mod.blueprintId} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={13} className="text-accent" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    {mod.title}
                  </h4>
                </div>

                {/* Concepts */}
                {mod.concepts.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-text-secondary/60">
                      Concepts
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {mod.concepts.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/60" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Practice */}
                {mod.practice.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-text-secondary/60">
                      Practice
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {mod.practice.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-warning/60" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Milestone */}
                <div className="flex items-center gap-1.5 rounded-lg border border-success/20 bg-success/8 px-3 py-1.5">
                  <Trophy size={11} className="text-success" />
                  <span className="text-xs font-medium text-success">{mod.milestone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── RoadmapPage ──────────────────────────────────────────────────────────────

export default function RoadmapPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // ── Restore state from sessionStorage if location.state is missing ──
  const locationState = location.state as RoadmapLocationState | null;
  const [persistedState, setPersistedState] = useState<RoadmapLocationState | null>(() => {
    if (locationState) {
      // Save to sessionStorage for recovery
      sessionStorage.setItem('pp_roadmap_state', JSON.stringify(locationState));
      return locationState;
    }
    // Try to recover from sessionStorage
    const saved = sessionStorage.getItem('pp_roadmap_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as RoadmapLocationState;
        console.log('[RoadmapPage] Restored state from sessionStorage');
        return parsed;
      } catch (e) {
        console.error('[RoadmapPage] Failed to parse saved state:', e);
      }
    }
    return null;
  });

  // Update state when location.state changes
  useEffect(() => {
    if (locationState) {
      sessionStorage.setItem('pp_roadmap_state', JSON.stringify(locationState));
      setPersistedState(locationState);
    }
  }, [locationState]);

  const roadmapResult = persistedState?.roadmapResult;
  const goalInput = persistedState?.goalInput;

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!roadmapResult) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary px-6">
        <NoRoadmapEmptyState 
          onBackToGoal={() => navigate('/goal')}
        />
      </div>
    );
  }

  // ── Failure ───────────────────────────────────────────────────────────────
  if (!roadmapResult.success) {
    return (
      <AuthenticatedLayout noPadding maxWidth="full">
        <div className="min-h-screen bg-bg-primary font-sans text-text-primary">
          <main className="mx-auto flex max-w-3xl flex-col items-center justify-center px-6 py-28 text-center">
            <div className="w-full rounded-2xl border border-danger/20 bg-danger/10 p-10">
              <AlertTriangle size={36} className="mx-auto mb-4 text-danger" />
              <h2 className="text-xl font-bold text-text-primary">
                Failed to generate roadmap.
              </h2>
              <p className="mt-3 text-sm text-text-secondary">
                Something went wrong while connecting to Gemini. Please try again.
              </p>
              <button
                onClick={() => navigate(-1)}
                className="mt-8 rounded-xl bg-accent px-10 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all duration-200 hover:bg-accent/90 hover:-translate-y-0.5"
              >
                Try Again
              </button>
            </div>
          </main>
        </div>
      </AuthenticatedLayout>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  const r = roadmapResult.data;

  // ── Auth-aware repository + services ──────────────────────────────────────
  const { user }        = useAuth();
  const repo            = useRepository();
  const roadmapRepo     = useRoadmapRepository();
  const roadmapPRepo    = useRoadmapProgressRepository();
  const progressSvc     = useMemo(() => new ProgressService(repo),    [repo]);
  const xpSvc           = useMemo(() => new XPService(repo),          [repo]);
  const streakSvc       = useMemo(() => new StreakService(repo),      [repo]);
  const achievementSvc  = useMemo(() => new AchievementService(repo), [repo]);
  const roadmapSvc      = useMemo(() => new RoadmapService(roadmapRepo), [roadmapRepo]);
  const roadmapPSvc     = useMemo(() => new RoadmapProgressService(roadmapPRepo, repo), [roadmapPRepo, repo]);

  // ── Goal Health ───────────────────────────────────────────────────────────
  const { score: healthScore, history: healthHistory, loading: healthLoading, error: healthError, refresh: refreshHealth, loadCached: loadCachedHealth } = useGoalHealth();

  // ── Deadline Rescue ───────────────────────────────────────────────────────
  const { strategy: rescueStrategy, loading: rescueLoading, error: rescueError, checkActivation, activate: activateRescue, loadCached: loadCachedRescue, deactivate: deactivateRescue } = useDeadlineRescue();

  // ── Progress state ────────────────────────────────────────────────────────
  const [weekProgressMap, setWeekProgressMap] = useState<Record<number, WeekProgress>>({});
  const [totalXP,    setTotalXP]    = useState(0);
  const [streak,     setStreak]     = useState<StreakState>({ currentStreak: 0, longestStreak: 0, lastActiveDate: '', totalActiveDays: 0 });
  const [levelInfo,  setLevelInfo]  = useState({ level: 1, currentXP: 0, nextLevelXP: 500, progress: 0 });
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // ── Roadmap progress (week unlock) ────────────────────────────────────────
  const [roadmapProgress, setRoadmapProgress] = useState<RoadmapProgress | null>(null);

  // ── Replanning state ──────────────────────────────────────────────────────
  const [replanning,    setReplanning]    = useState(false);
  const [replanResult,  setReplanResult]  = useState<ReplanResult | null>(null);
  const [activeRoadmap, setActiveRoadmap] = useState(r); // tracks current (possibly replanned) roadmap
  const [activeVersion, setActiveVersion] = useState<number>(1); // version number of active roadmap

  // ── Progress refresh key to trigger reloads ──────────────────────────────
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadProgress() {
      console.log('[RoadmapPage] Loading progress data (refreshKey:', refreshKey, ')');
      
      const map: Record<number, WeekProgress> = {};
      for (const week of activeRoadmap.weeks) {
        const weekProgress = await progressSvc.getWeekProgress(week.week, week.title);
        map[week.week] = weekProgress;
        console.log(`[RoadmapPage] Week ${week.week}: ${weekProgress.completedDays}/7 days, ${weekProgress.completionPercent}% complete`);
      }
      setWeekProgressMap(map);
      setTotalXP(await xpSvc.getTotal());
      setStreak(await streakSvc.getStreak());
      setLevelInfo(await xpSvc.getLevelInfo());
      setAchievements(await achievementSvc.getAll());

      // ── Init roadmap progress + load week statuses ───────────────────────
      const rp = await roadmapPSvc.initRoadmapProgress(activeRoadmap.totalWeeks);
      // Recompute from saved day progress on every load
      const updatedRp = await roadmapPSvc.recomputeAndUnlock(activeRoadmap.totalWeeks);
      setRoadmapProgress(updatedRp ?? rp);

      console.log(`[RoadmapPage] Roadmap progress updated: ${(updatedRp ?? rp).completedWeeks}/${activeRoadmap.totalWeeks} weeks, unlocked through week ${(updatedRp ?? rp).unlockedWeek}`);

      // Load active version number; save V1 if this is the first load
      const versionNum = await roadmapSvc.getActiveVersionNumber();
      if (versionNum === null) {
        const saved = await roadmapSvc.saveVersion(r, 'initial', '', '');
        setActiveVersion(saved.version);
      } else {
        setActiveVersion(versionNum);
      }

      // Load cached health score (non-blocking)
      loadCachedHealth();
      
      // Load cached rescue strategy (non-blocking)
      loadCachedRescue();
    }
    loadProgress();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoadmap.weeks, repo, roadmapRepo, roadmapPRepo, refreshKey]);

  // ── Auto-refresh when page gains focus (user returns from daily mission) ───
  useEffect(() => {
    function handleFocus() {
      console.log('[RoadmapPage] Page focused, triggering refresh');
      setRefreshKey(prev => prev + 1);
    }

    function handleVisibilityChange() {
      if (!document.hidden) {
        console.log('[RoadmapPage] Page visible, triggering refresh');
        setRefreshKey(prev => prev + 1);
      }
    }

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // ── Replan handler ────────────────────────────────────────────────────────
  async function handleReplan() {
    setReplanning(true);
    setReplanResult(null);

    const deadlineMs   = new Date(goalInput?.deadline ?? '').getTime() - Date.now();
    const remainingDays = Math.max(0, Math.ceil(deadlineMs / (1000 * 60 * 60 * 24)));
    const completedWeeksCount = activeRoadmap.weeks.filter(
      (w) => (weekProgressMap[w.week]?.completionPercent ?? 0) === 100,
    ).length;
    const overallPct = activeRoadmap.totalWeeks > 0
      ? Math.round((completedWeeksCount / activeRoadmap.totalWeeks) * 100)
      : 0;

    const result = await replanRoadmap(
      {
        goalText:             goalInput?.goal ?? activeRoadmap.title,
        goalType:             goalInput?.goalType ?? 'placement',
        deadline:             goalInput?.deadline ?? '',
        weeklyHours:          goalInput?.weeklyHours ?? Math.round(activeRoadmap.totalHours / activeRoadmap.totalWeeks),
        executionMode:        activeRoadmap.executionMode,
        skillGaps:            [],
        strengths:            [],
        currentRoadmap:       activeRoadmap,
        completedWeeks:       completedWeeksCount,
        totalWeeks:           activeRoadmap.totalWeeks,
        overallCompletionPct: overallPct,
        totalXP,
        currentStreak:        streak.currentStreak,
        remainingDays,
        triggerReason:        'manual',
      },
      user?.uid,
    );

    if (result.success) {
      // Save new immutable version before swapping the active roadmap
      const saved = await roadmapSvc.saveVersion(
        result.data.updatedRoadmap,
        'manual',
        result.data.reason,
        result.data.changes.map((c) => c.description).join('; '),
      );
      setActiveVersion(saved.version);
      setActiveRoadmap(result.data.updatedRoadmap);
      setReplanResult(result.data);
      // Re-init progress for new roadmap size
      const rp = await roadmapPSvc.initRoadmapProgress(result.data.updatedRoadmap.totalWeeks);
      setRoadmapProgress(rp);
      refreshHealth(goalInput?.deadline);
    }
    setReplanning(false);
  }

  return (
    <AuthenticatedLayout noPadding maxWidth="full">
      <div className="min-h-screen bg-bg-primary font-sans text-text-primary">

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Contextual navigation */}
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-sm text-text-secondary transition-colors duration-200 hover:text-text-primary"
        >
          <ArrowLeft size={16} />
          Back to Analysis
        </button>

        {/* ── Hero ── */}
        <div className="mb-10 animate-fade-up">
          <div className="mb-2 flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Execution Roadmap
            </p>
            <span className="rounded-full border border-accent/25 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
              V{activeVersion}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            {activeRoadmap.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-secondary">
            {activeRoadmap.summary}
          </p>
        </div>

        {/* ── Roadmap stats ── */}
        <div
          className="mb-8 grid gap-4 sm:grid-cols-4 animate-fade-up"
          style={{ animationDelay: '60ms' }}
        >
          <Card className="flex flex-col gap-1 p-5">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
              <Calendar size={14} className="text-text-secondary" />
            </div>
            <p className="text-xs font-medium uppercase tracking-widest text-text-secondary/60">
              Total Weeks
            </p>
            <p className="text-2xl font-bold text-text-primary">{activeRoadmap.totalWeeks}</p>
          </Card>

          <Card className="flex flex-col gap-1 p-5">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
              <Clock size={14} className="text-text-secondary" />
            </div>
            <p className="text-xs font-medium uppercase tracking-widest text-text-secondary/60">
              Total Hours
            </p>
            <p className="text-2xl font-bold text-text-primary">{activeRoadmap.totalHours}</p>
          </Card>

          <Card className="flex flex-col gap-1 p-5">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
              <Flame size={14} className="text-accent" />
            </div>
            <p className="text-xs font-medium uppercase tracking-widest text-text-secondary/60">
              Execution Mode
            </p>
            <p className="text-lg font-bold text-accent">{activeRoadmap.executionMode}</p>
          </Card>

          <Card className="flex flex-col gap-1 p-5">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
              <Map size={14} className="text-text-secondary" />
            </div>
            <p className="text-xs font-medium uppercase tracking-widest text-text-secondary/60">
              Weekly Target
            </p>
            <p className="text-lg font-bold text-text-primary">
              {goalInput ? `${goalInput.weeklyHours} hrs` : `${Math.round(activeRoadmap.totalHours / activeRoadmap.totalWeeks)} hrs`}
            </p>
          </Card>
        </div>

        {/* ── Overall Progress ── */}
        {(totalXP > 0 || streak.currentStreak > 0 || achievements.length > 0) && (
          <div className="mb-8 animate-fade-up" style={{ animationDelay: '100ms' }}>
            <div className="mb-4 flex items-center gap-2.5">
              <Zap size={15} className="text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                Your Progress
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* XP card */}
              <Card className="flex flex-col gap-3 p-5">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-accent" />
                  <p className="text-xs font-medium uppercase tracking-widest text-text-secondary/60">Total XP</p>
                </div>
                <p className="text-2xl font-bold text-accent">{totalXP}</p>
                <ProgressBar percent={levelInfo.progress} color="bg-accent" />
                <p className="text-xs text-text-secondary/50">
                  Level {levelInfo.level} · {levelInfo.currentXP}/{levelInfo.nextLevelXP} XP to next
                </p>
              </Card>

              {/* Streak card */}
              <Card className="flex flex-col gap-3 p-5">
                <div className="flex items-center gap-2">
                  <Flame size={14} className="text-warning" />
                  <p className="text-xs font-medium uppercase tracking-widest text-text-secondary/60">Streak</p>
                </div>
                <p className="text-2xl font-bold text-warning">🔥 {streak.currentStreak} <span className="text-base font-normal text-text-secondary">days</span></p>
                <p className="text-xs text-text-secondary/50">
                  Longest: {streak.longestStreak} days · Total active: {streak.totalActiveDays}
                </p>
              </Card>

              {/* Achievements card */}
              <Card className="flex flex-col gap-3 p-5">
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-warning" />
                  <p className="text-xs font-medium uppercase tracking-widest text-text-secondary/60">Achievements</p>
                </div>
                {achievements.length === 0 ? (
                  <p className="text-sm text-text-secondary/50">None yet — complete your first mission!</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {achievements.map((a) => (
                      <span
                        key={a.id}
                        title={a.description}
                        className="flex items-center gap-1 rounded-full border border-white/10 bg-bg-secondary px-2.5 py-1 text-xs font-medium text-text-secondary"
                      >
                        {a.icon ?? '🏅'} {a.title}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ── Goal Health Card ── */}
        <div className="mb-8 animate-fade-up" style={{ animationDelay: '110ms' }}>
          <GoalHealthCard
            score={healthScore}
            history={healthHistory}
            loading={healthLoading}
            error={healthError}
            onRefresh={async () => {
              await refreshHealth(goalInput?.deadline);
              
              // Automatic rescue check after health refresh
              if (healthScore && goalInput?.deadline) {
                const check = await checkActivation(
                  healthScore.score,
                  healthScore.level,
                  healthScore.burnoutRisk ?? 'low',
                  healthScore.deadlineStatus ?? 'on_track',
                  healthScore.estimatedCompletionDate ?? '',
                  healthScore.estimatedDaysRemaining ?? 0,
                  goalInput.deadline,
                );
                
                // Auto-activate rescue if needed
                if (check?.shouldActivate && !rescueStrategy) {
                  await activateRescue(
                    healthScore.score,
                    healthScore.level,
                    healthScore.burnoutRisk ?? 'low',
                    healthScore.deadlineStatus ?? 'on_track',
                    healthScore.estimatedCompletionDate ?? '',
                    healthScore.estimatedDaysRemaining ?? 0,
                    goalInput.deadline,
                  );
                }
              }
            }}
          />
        </div>

        {/* ── Deadline Rescue Card ── */}
        {rescueStrategy && (
          <div className="mb-8 animate-fade-up" style={{ animationDelay: '115ms' }}>
            <DeadlineRescueCard
              strategy={rescueStrategy}
              loading={rescueLoading}
              error={rescueError}
              onDeactivate={deactivateRescue}
            />
          </div>
        )}

        {/* ── Future You Card ── */}
        <div className="mb-8 animate-fade-up" style={{ animationDelay: '117ms' }}>
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles size={15} className="text-accent" />
                <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                  Future You
                </h2>
              </div>
              <button
                onClick={() => navigate('/future-you')}
                className="rounded-lg border border-white/10 bg-bg-secondary px-3 py-2 text-xs font-medium text-text-secondary transition-all hover:border-accent/40 hover:text-text-primary"
              >
                View Prediction →
              </button>
            </div>
            <p className="mt-3 text-sm text-text-secondary">
              See where you'll be if you continue at your current pace. AI-powered career prediction based on your execution patterns.
            </p>
          </Card>
        </div>

        {/* ── Week cards ── */}
        <div
          className="flex flex-col gap-4 animate-fade-up"
          style={{ animationDelay: '120ms' }}
        >          <div className="mb-2 flex items-center gap-2.5">
            <BookOpen size={15} className="text-accent" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
              Week-by-Week Plan
            </h2>
          </div>

          {activeRoadmap.weeks.map((week) => (
            <WeekCard
              key={week.week}
              week={week}
              weekProgress={weekProgressMap[week.week]}
              weekStatus={roadmapProgress?.weekStatuses.find((s) => s.weekNumber === week.week)}
            />
          ))}
        </div>

        {/* ── Replan result card ── */}
        {replanResult && (
          <div className="mt-8 animate-fade-up rounded-2xl border border-success/20 bg-success/5 p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-success" />
              <h2 className="text-sm font-bold text-success">Roadmap Updated</h2>
              <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                replanResult.riskLevel === 'low'      ? 'border-success/30 bg-success/10 text-success' :
                replanResult.riskLevel === 'moderate' ? 'border-warning/30 bg-warning/10 text-warning' :
                'border-danger/30 bg-danger/10 text-danger'
              }`}>
                {replanResult.riskLevel.toUpperCase()} RISK
              </span>
            </div>

            {/* Reason */}
            <p className="mb-4 text-sm leading-relaxed text-text-secondary">{replanResult.reason}</p>

            {/* Recommended hours */}
            <p className="mb-4 text-xs text-text-secondary/60">
              Recommended pace: <span className="font-semibold text-text-secondary">{replanResult.recommendedWeeklyHours}</span>
            </p>

            {/* Changes */}
            {replanResult.changes.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-secondary/60">Changes Made</p>
                <ul className="flex flex-col gap-1.5">
                  {replanResult.changes.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
                      <span className="font-medium text-accent">[Week {c.weekNumber} · {c.type}]</span>
                      &nbsp;{c.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Priority adjustments */}
            {replanResult.priorityAdjustments.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-secondary/60">Priority Adjustments</p>
                <ul className="flex flex-col gap-1.5">
                  {replanResult.priorityAdjustments.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                        p.direction === 'increased' ? 'bg-success' : p.direction === 'decreased' ? 'bg-warning' : 'bg-danger'
                      }`} />
                      <span className="font-medium text-text-primary">{p.topic}</span>
                      &nbsp;— {p.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="mt-10 flex flex-col items-center gap-4 pb-4 text-center">
          <button
            onClick={() => {
              const firstLearningWeek = activeRoadmap.weeks.find((w) => w.type === 'learning') ?? activeRoadmap.weeks[0];
              navigate('/daily-mission', {
                state: {
                  week:          firstLearningWeek,
                  weeklyHours:   goalInput?.weeklyHours ?? Math.round(activeRoadmap.totalHours / activeRoadmap.totalWeeks),
                  executionMode: activeRoadmap.executionMode,
                  roadmapTitle:  activeRoadmap.title,
                  totalWeeks:    activeRoadmap.totalWeeks,
                },
              });
            }}
            className="flex items-center gap-2 rounded-xl bg-accent px-10 py-4 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all duration-200 hover:bg-accent/90 hover:-translate-y-0.5 active:translate-y-0"
          >
            Generate Today's Mission →
          </button>
          <button
            onClick={handleReplan}
            disabled={replanning}
            className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-8 py-3 text-sm font-semibold text-warning transition-all duration-200 hover:bg-warning/20 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:translate-y-0"
          >
            {replanning
              ? <><span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-warning/30 border-t-warning" />Replanning...</>
              : <><RefreshCw size={14} />Replan Roadmap</>
            }
          </button>
          <button
            onClick={() => navigate('/goal')}
            className="rounded-xl border border-white/10 bg-bg-card px-8 py-3 text-sm font-semibold text-text-primary transition-all duration-200 hover:border-white/20 hover:bg-bg-secondary hover:-translate-y-0.5"
          >
            ← Start a New Goal
          </button>
        </div>

      </main>
    </div>
    </AuthenticatedLayout>
  );
}
