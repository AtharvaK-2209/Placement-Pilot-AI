import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  Zap,
  CalendarDays,
  HeartPulse,
  TrendingUp,
  BookOpen,
  ListChecks,
  Sparkles,
  Square,
  Flame,
  Map,
} from 'lucide-react';
import { Button } from '../components/Button';
import { NoDataEmptyState } from '../components/EmptyState';
import type {
  GoalAnalysisResponse,
  Difficulty,
  Feasibility,
  ExecutionMode,
} from '../ai/schemas/goalAnalysis.schema';
import type { GoalInput } from '../types/goal';
import { generateRoadmap } from '../ai/roadmap';

// ─── Router state shape ───────────────────────────────────────────────────────

interface AnalysisLocationState {
  result: GoalAnalysisResponse;
  goalInput?: GoalInput;
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function difficultyColor(d: Difficulty) {
  return d === 'Easy' ? 'text-success' : d === 'Medium' ? 'text-warning' : 'text-danger';
}
function difficultyBg(d: Difficulty) {
  return d === 'Easy'
    ? 'bg-success/10 border-success/20'
    : d === 'Medium'
    ? 'bg-warning/10 border-warning/20'
    : 'bg-danger/10 border-danger/20';
}

function feasibilityColor(f: Feasibility) {
  return f === 'High' ? 'text-success' : f === 'Moderate' ? 'text-warning' : 'text-danger';
}
function feasibilityBg(f: Feasibility) {
  return f === 'High'
    ? 'bg-success/10 border-success/20'
    : f === 'Moderate'
    ? 'bg-warning/10 border-warning/20'
    : 'bg-danger/10 border-danger/20';
}

function executionModeColor(m: ExecutionMode) {
  switch (m) {
    case 'Relaxed':   return 'text-[#60A5FA]';   // blue-400
    case 'Balanced':  return 'text-success';
    case 'Focused':   return 'text-accent';
    case 'Intensive': return 'text-[#FB923C]';    // orange-400
    case 'Extreme':   return 'text-danger';
  }
}
function executionModeBg(m: ExecutionMode) {
  switch (m) {
    case 'Relaxed':   return 'bg-[#60A5FA]/10 border-[#60A5FA]/20';
    case 'Balanced':  return 'bg-success/10 border-success/20';
    case 'Focused':   return 'bg-accent/10 border-accent/20';
    case 'Intensive': return 'bg-[#FB923C]/10 border-[#FB923C]/20';
    case 'Extreme':   return 'bg-danger/10 border-danger/20';
  }
}

function healthBarColor(s: number) {
  return s >= 70 ? 'bg-success' : s >= 40 ? 'bg-warning' : 'bg-danger';
}
function healthTextColor(s: number) {
  return s >= 70 ? 'text-success' : s >= 40 ? 'text-warning' : 'text-danger';
}

function difficultyRating(d: Difficulty): number {
  return d === 'Easy' ? 3 : d === 'Medium' ? 6 : 9;
}

// ─── Timeline helpers ─────────────────────────────────────────────────────────

function formatDeadline(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function daysRemaining(iso: string): number {
  const deadline = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={[
        'rounded-2xl border border-white/5 bg-bg-card p-6',
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-2.5">
      <span className="text-accent">{icon}</span>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
        {children}
      </h2>
    </div>
  );
}

// ─── AnalysisPage ─────────────────────────────────────────────────────────────

export default function AnalysisPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as AnalysisLocationState | null;
  const result = state?.result;
  const goalInput = state?.goalInput;

  // ── Guard: direct URL access ───────────────────────────────────────────────
  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary px-6">
        <NoDataEmptyState 
          message="No analysis data found. Please start by setting your goal."
          onRefresh={() => navigate('/goal')}
        />
      </div>
    );
  }

  // ── Failure state ──────────────────────────────────────────────────────────
  if (!result.success) {
    return (
      <div className="min-h-screen bg-bg-primary font-sans text-text-primary">
        <header className="sticky top-0 z-40 border-b border-white/5 bg-bg-primary/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <button
              onClick={() => navigate('/goal')}
              className="flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              <ArrowLeft size={16} />
              Back
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
              Failed to analyze your goal.
            </h2>
            <p className="mt-3 text-sm text-text-secondary">
              Something went wrong while connecting to Gemini. Please check
              your API key or try again.
            </p>
            <button
              onClick={() => navigate('/goal')}
              className="mt-8 rounded-xl bg-accent px-10 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all duration-200 hover:bg-accent/90 hover:-translate-y-0.5"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────
  const d = result.data;
  const rating = difficultyRating(d.difficulty);

  const [roadmapLoading, setRoadmapLoading] = useState(false);

  async function handleGenerateRoadmap() {
    if (!goalInput) return;
    setRoadmapLoading(true);
    const roadmapResult = await generateRoadmap(goalInput, d);
    setRoadmapLoading(false);
    navigate('/roadmap', { state: { roadmapResult, goalInput, analysisResult: result } });
  }

  // Timeline — computed entirely on the frontend from the user's deadline
  const deadline = goalInput?.deadline ?? '';
  const deadlineLabel = deadline ? formatDeadline(deadline) : null;
  const days = deadline ? daysRemaining(deadline) : null;

  return (
    <div className="min-h-screen bg-bg-primary font-sans text-text-primary">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-bg-primary/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <button
            onClick={() => navigate('/goal')}
            className="flex items-center gap-2 text-sm text-text-secondary transition-colors duration-200 hover:text-text-primary"
          >
            <ArrowLeft size={16} />
            Edit Goal
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
            Goal Analysis Complete
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Goal Analysis Complete
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-secondary">
            Our AI analyzed your goal, evaluated its feasibility, identified
            your strengths and skill gaps, and prepared personalized
            recommendations.
          </p>
        </div>

        {/* ── Summary ── */}
        <div className="mb-6 animate-fade-up" style={{ animationDelay: '60ms' }}>
          <Card className="border-accent/15 bg-accent/5 hover:border-accent/25">
            <SectionHeading icon={<Sparkles size={15} />}>Summary</SectionHeading>
            <p className="text-sm leading-relaxed text-text-primary">{d.summary}</p>
          </Card>
        </div>

        {/* ── Metric cards — 4 columns ── */}
        <div
          className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-up"
          style={{ animationDelay: '120ms' }}
        >
          {/* Difficulty */}
          <Card className={difficultyBg(d.difficulty)}>
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
              <Zap size={16} className={difficultyColor(d.difficulty)} />
            </div>
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-text-secondary/70">
              Difficulty
            </p>
            <p className={`text-3xl font-bold ${difficultyColor(d.difficulty)}`}>
              {d.difficulty}
            </p>
            <div className="mt-3 flex gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className={[
                    'h-1.5 flex-1 rounded-full transition-all duration-300',
                    i < rating
                      ? difficultyColor(d.difficulty).replace('text-', 'bg-')
                      : 'bg-white/10',
                  ].join(' ')}
                />
              ))}
            </div>
            <p className="mt-1.5 text-xs text-text-secondary/50">{rating} / 10</p>
          </Card>

          {/* Feasibility */}
          <Card className={feasibilityBg(d.feasibility)}>
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
              <TrendingUp size={16} className={feasibilityColor(d.feasibility)} />
            </div>
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-text-secondary/70">
              Feasibility
            </p>
            <p className={`text-3xl font-bold ${feasibilityColor(d.feasibility)}`}>
              {d.feasibility}
            </p>
          </Card>

          {/* Execution Mode — replaces Estimated Hours */}
          <Card className={executionModeBg(d.executionMode)}>
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
              <Flame size={16} className={executionModeColor(d.executionMode)} />
            </div>
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-text-secondary/70">
              Execution Mode
            </p>
            <p className={`text-3xl font-bold ${executionModeColor(d.executionMode)}`}>
              {d.executionMode}
            </p>
            <p className="mt-2 text-xs text-text-secondary/60">
              Recommended: {d.recommendedWeeklyHours}
            </p>
          </Card>

          {/* Goal Health Score */}
          <Card>
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
              <HeartPulse size={16} className={healthTextColor(d.goalHealthPrediction)} />
            </div>
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-text-secondary/70">
              Health Score
            </p>
            <p className={`text-3xl font-bold ${healthTextColor(d.goalHealthPrediction)}`}>
              {d.goalHealthPrediction}
              <span className="ml-1 text-base font-normal text-text-secondary">/ 100</span>
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-700 ${healthBarColor(d.goalHealthPrediction)}`}
                style={{ width: `${d.goalHealthPrediction}%` }}
              />
            </div>
          </Card>
        </div>

        {/* ── Timeline card (full-width under metrics) ── */}
        {deadlineLabel !== null && days !== null && (
          <div className="mb-6 animate-fade-up" style={{ animationDelay: '160ms' }}>
            <Card className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
                  <CalendarDays size={16} className="text-text-secondary" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-text-secondary/70">
                    Timeline
                  </p>
                  <p className="text-lg font-semibold text-text-primary">{deadlineLabel}</p>
                </div>
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-medium uppercase tracking-widest text-text-secondary/70">
                  Remaining
                </p>
                <p className="text-lg font-semibold text-text-primary">
                  {days > 0 ? `${days} Days` : days === 0 ? 'Today' : 'Deadline passed'}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* ── Strengths + Skill Gaps ── */}
        <div
          className="mb-6 grid gap-4 sm:grid-cols-2 animate-fade-up"
          style={{ animationDelay: '200ms' }}
        >
          <Card>
            <SectionHeading icon={<TrendingUp size={15} />}>Strengths</SectionHeading>
            <ul className="flex flex-col gap-2.5">
              {d.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                  {s}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionHeading icon={<BookOpen size={15} />}>Skill Gaps</SectionHeading>
            <ul className="flex flex-col gap-2.5">
              {d.skillGaps.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                  {s}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* ── Recommendations ── */}
        <div
          className="mb-10 animate-fade-up"
          style={{ animationDelay: '260ms' }}
        >
          <div className="mb-4 flex items-center gap-2.5">
            <span className="text-accent"><ListChecks size={15} /></span>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
              Recommendations
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {d.recommendations.map((rec, i) => (
              <div
                key={i}
                className="group flex items-start gap-4 rounded-xl border border-white/5 bg-bg-card px-5 py-4 transition-all duration-200 hover:border-accent/20 hover:bg-accent/5 hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="mt-0.5 shrink-0 text-text-secondary/40 transition-colors duration-200 group-hover:text-accent/60">
                  <Square size={16} strokeWidth={1.5} />
                </span>
                <p className="text-sm leading-relaxed text-text-secondary transition-colors duration-200 group-hover:text-text-primary">
                  {rec}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer CTA ── */}
        <div className="flex flex-col items-center gap-4 pb-4 text-center">
          <Button
            onClick={handleGenerateRoadmap}
            disabled={!goalInput}
            loading={roadmapLoading}
            icon={<Map size={16} />}
            size="lg"
          >
            {roadmapLoading ? 'Generating Roadmap...' : 'Generate My Roadmap'}
          </Button>
          <Button
            onClick={() => navigate('/goal')}
            variant="secondary"
          >
            ← Analyze a Different Goal
          </Button>
        </div>

      </main>
    </div>
  );
}
