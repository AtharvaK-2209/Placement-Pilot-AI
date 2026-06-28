import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import type { RoadmapResponse, RoadmapWeek } from '../ai/schemas/roadmap.schema';
import type { GoalInput } from '../types/goal';
import { progressService } from '../services/index';
import { xpService }       from '../services/index';
import { streakService }   from '../services/index';
import { achievementService } from '../services/index';
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

function WeekCard({ week, weekProgress }: { week: RoadmapWeek; weekProgress?: WeekProgress }) {
  const [expanded, setExpanded] = useState(false);
  const pct = weekProgress?.completionPercent ?? 0;
  const done = weekProgress?.completed ?? false;

  return (
    <Card>
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-4 p-5 text-left transition-colors duration-150 hover:bg-white/2"
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

            {/* Week progress bar */}
            {pct > 0 && (
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1">
                  <ProgressBar percent={pct} color={done ? 'bg-success' : 'bg-accent'} />
                </div>
                <span className="text-xs text-text-secondary/50">{pct}%</span>
                {done && <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">✓</span>}
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
  const state = location.state as RoadmapLocationState | null;
  const roadmapResult = state?.roadmapResult;
  const goalInput = state?.goalInput;

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!roadmapResult) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-primary px-6 font-sans text-text-primary">
        <AlertTriangle size={40} className="text-warning" />
        <p className="text-lg font-semibold">No roadmap data found.</p>
        <button
          onClick={() => navigate('/goal')}
          className="rounded-xl bg-accent px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-accent/90"
        >
          Start Over
        </button>
      </div>
    );
  }

  // ── Failure ───────────────────────────────────────────────────────────────
  if (!roadmapResult.success) {
    return (
      <div className="min-h-screen bg-bg-primary font-sans text-text-primary">
        <header className="sticky top-0 z-40 border-b border-white/5 bg-bg-primary/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <span className="text-sm font-semibold">
              PlacementPilot <span className="text-accent">AI</span>
            </span>
          </div>
        </header>
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
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  const r = roadmapResult.data;

  // ── Progress state ────────────────────────────────────────────────────────
  const [weekProgressMap, setWeekProgressMap] = useState<Record<number, WeekProgress>>({});
  const [totalXP,    setTotalXP]    = useState(0);
  const [streak,     setStreak]     = useState<StreakState>({ currentStreak: 0, longestStreak: 0, lastActiveDate: '', totalActiveDays: 0 });
  const [levelInfo,  setLevelInfo]  = useState({ level: 1, currentXP: 0, nextLevelXP: 500, progress: 0 });
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    async function loadProgress() {
      const map: Record<number, WeekProgress> = {};
      for (const week of r.weeks) {
        map[week.week] = await progressService.getWeekProgress(week.week, week.title);
      }
      setWeekProgressMap(map);
      setTotalXP(await xpService.getTotal());
      setStreak(await streakService.getStreak());
      setLevelInfo(await xpService.getLevelInfo());
      setAchievements(await achievementService.getAll());
    }
    loadProgress();
  }, [r.weeks]);

  return (
    <div className="min-h-screen bg-bg-primary font-sans text-text-primary">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-bg-primary/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-text-secondary transition-colors duration-200 hover:text-text-primary"
          >
            <ArrowLeft size={16} />
            Back to Analysis
          </button>
          <span className="text-sm font-semibold">
            PlacementPilot <span className="text-accent">AI</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">

        {/* ── Hero ── */}
        <div className="mb-10 animate-fade-up">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
            Execution Roadmap
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            {r.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-secondary">
            {r.summary}
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
            <p className="text-2xl font-bold text-text-primary">{r.totalWeeks}</p>
          </Card>

          <Card className="flex flex-col gap-1 p-5">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
              <Clock size={14} className="text-text-secondary" />
            </div>
            <p className="text-xs font-medium uppercase tracking-widest text-text-secondary/60">
              Total Hours
            </p>
            <p className="text-2xl font-bold text-text-primary">{r.totalHours}</p>
          </Card>

          <Card className="flex flex-col gap-1 p-5">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
              <Flame size={14} className="text-accent" />
            </div>
            <p className="text-xs font-medium uppercase tracking-widest text-text-secondary/60">
              Execution Mode
            </p>
            <p className="text-lg font-bold text-accent">{r.executionMode}</p>
          </Card>

          <Card className="flex flex-col gap-1 p-5">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
              <Map size={14} className="text-text-secondary" />
            </div>
            <p className="text-xs font-medium uppercase tracking-widest text-text-secondary/60">
              Weekly Target
            </p>
            <p className="text-lg font-bold text-text-primary">
              {goalInput ? `${goalInput.weeklyHours} hrs` : `${Math.round(r.totalHours / r.totalWeeks)} hrs`}
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

        {/* ── Week cards ── */}
        <div
          className="flex flex-col gap-4 animate-fade-up"
          style={{ animationDelay: '120ms' }}
        >
          <div className="mb-2 flex items-center gap-2.5">
            <BookOpen size={15} className="text-accent" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
              Week-by-Week Plan
            </h2>
          </div>

          {r.weeks.map((week) => (
            <WeekCard key={week.week} week={week} weekProgress={weekProgressMap[week.week]} />
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="mt-10 flex flex-col items-center gap-4 pb-4 text-center">
          <button
            onClick={() => {
              // Pass the first learning week so the mission page has context
              const firstLearningWeek = r.weeks.find((w) => w.type === 'learning') ?? r.weeks[0];
              navigate('/daily-mission', {
                state: {
                  week:          firstLearningWeek,
                  weeklyHours:   goalInput?.weeklyHours ?? Math.round(r.totalHours / r.totalWeeks),
                  executionMode: r.executionMode,
                  roadmapTitle:  r.title,
                },
              });
            }}
            className="flex items-center gap-2 rounded-xl bg-accent px-10 py-4 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all duration-200 hover:bg-accent/90 hover:-translate-y-0.5 active:translate-y-0"
          >
            Generate Today's Mission →
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
  );
}
