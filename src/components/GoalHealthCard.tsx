/**
 * @file GoalHealthCard.tsx
 *
 * Phase 7.1 enhancements:
 *   - Trend badge (↑ +5, ↓ -8, → stable)
 *   - Confidence display
 *   - Expandable structured weaknesses (title + reason + recommendation)
 *   - Mini SVG history graph (last 7 evaluations)
 */

import { useState }    from 'react';
import {
  HeartPulse, TrendingUp, AlertTriangle,
  Lightbulb, RefreshCw, ChevronDown, ChevronUp,
  Flame, Calendar, TrendingDown, Activity, AlertCircle,
} from 'lucide-react';
import type {
  GoalHealthScore,
  GoalHealthHistoryEntry,
  HealthLevel,
  HealthWeakness,
  BurnoutRisk,
  DeadlineStatus,
} from '../ai/goalHealth/goalHealth.schema';

// ─── Colour helpers ────────────────────────────────────────────────────────────

function levelColor(l: HealthLevel)   { return l === 'excellent' || l === 'healthy' ? 'text-success' : l === 'warning' ? 'text-warning' : 'text-danger'; }
function levelBg(l: HealthLevel)      { return l === 'excellent' ? 'border-success/30 bg-success/10' : l === 'healthy' ? 'border-success/20 bg-success/5' : l === 'warning' ? 'border-warning/30 bg-warning/10' : 'border-danger/30 bg-danger/10'; }
function barColor(l: HealthLevel)     { return l === 'excellent' || l === 'healthy' ? 'bg-success' : l === 'warning' ? 'bg-warning' : 'bg-danger'; }
function levelLabel(l: HealthLevel)   { return l.charAt(0).toUpperCase() + l.slice(1); }

function burnoutColor(b: BurnoutRisk) { return b === 'low' ? 'text-success' : b === 'medium' ? 'text-warning' : 'text-danger'; }
function burnoutBg(b: BurnoutRisk)    { return b === 'low' ? 'border-success/30 bg-success/10' : b === 'medium' ? 'border-warning/30 bg-warning/10' : 'border-danger/30 bg-danger/10'; }
function burnoutLabel(b: BurnoutRisk) { return b.charAt(0).toUpperCase() + b.slice(1); }

function deadlineColor(d: DeadlineStatus) {
  return d === 'on_track' ? 'text-success' : d === 'slightly_behind' ? 'text-warning' : 'text-danger';
}
function deadlineBg(d: DeadlineStatus) {
  return d === 'on_track' ? 'border-success/30 bg-success/10' : d === 'slightly_behind' ? 'border-warning/30 bg-warning/10' : 'border-danger/30 bg-danger/10';
}
function deadlineLabel(d: DeadlineStatus) {
  return d === 'on_track' ? '🟢 On Track' : d === 'slightly_behind' ? '🟡 Slightly Behind' : d === 'rescue_active' ? '🔴 Rescue Mode Active' : '🔴 Critical';
}
function deadlineIcon(d: DeadlineStatus) {
  return d === 'on_track' ? null : d === 'slightly_behind' ? <AlertCircle size={12} /> : <AlertTriangle size={12} />;
}

// ─── Mini history graph ────────────────────────────────────────────────────────

function MiniGraph({ history }: { history: GoalHealthHistoryEntry[] }) {
  const last7 = history.slice(-7);
  if (last7.length < 2) return null;

  const scores  = last7.map((h) => h.score);
  const minS    = Math.min(...scores);
  const maxS    = Math.max(...scores);
  const range   = maxS - minS || 1;
  const W       = 160;
  const H       = 40;
  const pad     = 6;
  const step    = (W - pad * 2) / (last7.length - 1);

  const pts = scores.map((s, i) => ({
    x: pad + i * step,
    y: H - pad - ((s - minS) / range) * (H - pad * 2),
    score: s,
  }));

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary/60">
        Last {last7.length} evaluations
      </p>
      <svg width={W} height={H} className="overflow-visible">
        <polyline
          points={polyline}
          fill="none"
          stroke="rgba(99,102,241,0.5)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill="#6366F1" />
            <text
              x={p.x}
              y={p.y - 7}
              textAnchor="middle"
              fontSize="8"
              fill="rgba(148,163,184,0.7)"
            >
              {p.score}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Expandable weakness item ─────────────────────────────────────────────────

function WeaknessItem({ weakness }: { weakness: HealthWeakness | string }) {
  const [open, setOpen] = useState(false);

  // Plain string fallback (resilience for old data)
  if (typeof weakness === 'string') {
    return (
      <li className="flex items-start gap-2 text-xs text-text-secondary">
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
        {weakness}
      </li>
    );
  }

  const hasDetail = weakness.reason || weakness.recommendation;

  return (
    <li className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => hasDetail && setOpen((v) => !v)}
        className={`flex items-start gap-2 text-left text-xs transition-colors ${hasDetail ? 'cursor-pointer hover:text-text-primary' : 'cursor-default'} text-text-secondary`}
      >
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
        <span className="flex-1">{weakness.title}</span>
        {hasDetail && (
          <span className="mt-0.5 shrink-0 text-text-secondary/40">
            {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </span>
        )}
      </button>
      {open && hasDetail && (
        <div className="ml-3.5 flex flex-col gap-1 rounded-lg border border-white/5 bg-bg-secondary px-3 py-2">
          {weakness.reason && (
            <p className="text-xs text-text-secondary/70">
              <span className="font-medium text-text-secondary">Reason:</span> {weakness.reason}
            </p>
          )}
          {weakness.recommendation && (
            <p className="text-xs text-text-secondary/70">
              <span className="font-medium text-text-secondary">Fix:</span> {weakness.recommendation}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

// ─── GoalHealthCard ────────────────────────────────────────────────────────────

interface Props {
  score:     GoalHealthScore | null;
  history:   GoalHealthHistoryEntry[];
  loading:   boolean;
  error:     string | null;
  onRefresh: () => void;
}

export default function GoalHealthCard({ score, history, loading, error, onRefresh }: Props) {
  return (
    <div className="rounded-2xl border border-white/5 bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">

      {/* ── Header ── */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <HeartPulse size={15} className="text-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
            Goal Health
          </h2>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-bg-secondary px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-white/20 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Analyzing…' : 'Refresh'}
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && !score && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
          <p className="text-xs text-text-secondary/60">Analyzing your execution health…</p>
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-danger" />
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      {/* ── Score ── */}
      {score && !loading && (
        <div className="flex flex-col gap-5">

          {/* Score + level + trend */}
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <p className={`text-5xl font-extrabold leading-none ${levelColor(score.level)}`}>
                  {score.score}
                </p>
                {/* Trend badge */}
                {score.trend && score.trend.direction !== 'stable' && (
                  <span className={`flex items-center gap-0.5 text-sm font-bold ${score.trend.direction === 'up' ? 'text-success' : 'text-danger'}`}>
                    {score.trend.direction === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(score.trend.delta)}
                  </span>
                )}
                {score.trend?.direction === 'stable' && (
                  <span className="flex items-center gap-0.5 text-sm font-bold text-text-secondary/40">
                    <Activity size={14} />
                    stable
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-text-secondary/50">/ 100</p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${levelColor(score.level)} ${levelBg(score.level)}`}>
                {levelLabel(score.level)}
              </span>
              {/* Confidence */}
              <p className="text-xs text-text-secondary/50" title="Confidence reflects how certain the AI is about this evaluation">
                Confidence <span className="font-semibold text-text-secondary">{score.confidence}%</span>
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor(score.level)}`}
              style={{ width: `${score.score}%` }}
            />
          </div>

          {/* ── Phase 8.1: Dashboard Metrics ────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Overall Completion */}
            <div className="flex flex-col gap-1 rounded-lg border border-white/5 bg-bg-secondary px-3 py-2">
              <p className="text-xs font-medium text-text-secondary/60">Completion</p>
              <p className="text-lg font-bold text-text-primary">{score.overallCompletion}%</p>
            </div>

            {/* Current Streak */}
            <div className="flex flex-col gap-1 rounded-lg border border-white/5 bg-bg-secondary px-3 py-2">
              <p className="text-xs font-medium text-text-secondary/60">Streak</p>
              <p className="flex items-center gap-1 text-lg font-bold text-text-primary">
                <Flame size={14} className="text-orange-500" />
                {score.currentStreak} days
              </p>
            </div>

            {/* Burnout Risk */}
            <div className="flex flex-col gap-1 rounded-lg border border-white/5 bg-bg-secondary px-3 py-2">
              <p className="text-xs font-medium text-text-secondary/60">Burnout Risk</p>
              <span className={`w-fit rounded-full border px-2 py-0.5 text-xs font-bold ${burnoutColor(score.burnoutRisk)} ${burnoutBg(score.burnoutRisk)}`}>
                {burnoutLabel(score.burnoutRisk)}
              </span>
            </div>

            {/* ETA */}
            <div className="flex flex-col gap-1 rounded-lg border border-white/5 bg-bg-secondary px-3 py-2">
              <p className="text-xs font-medium text-text-secondary/60">Est. Completion</p>
              <p className="flex items-center gap-1 text-xs font-bold text-text-primary" title={score.estimatedCompletionDate}>
                <Calendar size={12} className="text-accent" />
                {score.estimatedDaysRemaining > 0 
                  ? `${score.estimatedDaysRemaining} days`
                  : 'Complete'}
              </p>
            </div>
          </div>

          {/* ── Phase 9: Deadline Status ──────────────────────────────────────────── */}
          {score.deadlineStatus && score.deadlineStatus !== 'on_track' && (
            <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${deadlineColor(score.deadlineStatus)} ${deadlineBg(score.deadlineStatus)}`}>
              {deadlineIcon(score.deadlineStatus)}
              <p className="text-xs font-bold">{deadlineLabel(score.deadlineStatus)}</p>
            </div>
          )}

          {/* Summary */}
          <p className="text-sm leading-relaxed text-text-secondary">{score.summary}</p>

          {/* Strengths + Weaknesses */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <TrendingUp size={12} className="text-success" />
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary/60">Strengths</p>
              </div>
              <ul className="flex flex-col gap-1.5">
                {score.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-warning" />
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary/60">Weaknesses</p>
              </div>
              <ul className="flex flex-col gap-2">
                {score.weaknesses.map((w, i) => (
                  <WeaknessItem key={i} weakness={w} />
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          {score.recommendations.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <Lightbulb size={12} className="text-accent" />
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary/60">Recommendations</p>
              </div>
              <ul className="flex flex-col gap-1.5">
                {score.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mini history graph */}
          {history.length >= 2 && <MiniGraph history={history} />}

          {/* Timestamp */}
          <p className="text-right text-xs text-text-secondary/30">
            {new Date(score.computedAt).toLocaleString()}
          </p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!score && !loading && !error && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <HeartPulse size={28} className="text-text-secondary/30" />
          <p className="text-xs text-text-secondary/50">
            Click Refresh to compute your goal health score.
          </p>
        </div>
      )}
    </div>
  );
}
