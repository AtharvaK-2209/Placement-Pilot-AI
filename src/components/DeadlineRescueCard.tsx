/**
 * @file DeadlineRescueCard.tsx
 *
 * Phase 9: Deadline Rescue Mode UI Component
 *
 * Displays rescue strategy when user is behind schedule.
 */

import { AlertTriangle, CheckCircle2, Clock, TrendingUp, X } from 'lucide-react';
import type {
  RescueStrategy,
  RescueStatus,
  RecoveryAction,
} from '../ai/deadlineRescue/deadlineRescue.schema';

// ─── Color Helpers ─────────────────────────────────────────────────────────────

function statusColor(s: RescueStatus) {
  return s === 'active' ? 'text-warning' : s === 'critical' ? 'text-danger' : 'text-success';
}

function statusBg(s: RescueStatus) {
  return s === 'active' ? 'border-warning/30 bg-warning/10' : s === 'critical' ? 'border-danger/30 bg-danger/10' : 'border-success/30 bg-success/10';
}

function statusLabel(s: RescueStatus) {
  return s === 'active' ? 'ACTIVE' : s === 'critical' ? 'CRITICAL' : s === 'monitoring' ? 'Monitoring' : 'Not Needed';
}

function priorityColor(p: 'high' | 'medium' | 'low') {
  return p === 'high' ? 'text-danger' : p === 'medium' ? 'text-warning' : 'text-text-secondary';
}

// ─── Recovery Action Item ──────────────────────────────────────────────────────

function RecoveryActionItem({ action }: { action: RecoveryAction }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 size={14} className={`mt-0.5 shrink-0 ${priorityColor(action.priority)}`} />
      <div className="flex-1">
        <p className="text-sm font-medium text-text-primary">{action.description}</p>
        <p className="text-xs text-text-secondary/70">Impact: {action.impact}</p>
      </div>
    </li>
  );
}

// ─── Deadline Rescue Card ──────────────────────────────────────────────────────

interface Props {
  strategy: RescueStrategy | null;
  loading: boolean;
  error: string | null;
  onDeactivate: () => void;
}

export default function DeadlineRescueCard({
  strategy,
  loading,
  error,
  onDeactivate,
}: Props) {
  // Don't show card if rescue not needed
  if (!strategy || strategy.status === 'not_needed') {
    return null;
  }

  const isActive = strategy.status === 'active' || strategy.status === 'critical';

  return (
    <div className={`rounded-2xl border p-6 transition-all duration-200 ${statusBg(strategy.status)} hover:-translate-y-0.5 hover:shadow-lg`}>

      {/* ── Header ── */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AlertTriangle size={15} className={statusColor(strategy.status)} />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
            Deadline Rescue Mode
          </h2>
        </div>
        
        {isActive && (
          <button
            onClick={onDeactivate}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-bg-secondary px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-white/20 hover:text-text-primary"
            title="Deactivate Rescue Mode"
          >
            <X size={11} />
            Deactivate
          </button>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-warning" />
          <p className="text-xs text-text-secondary/60">Generating rescue strategy…</p>
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-danger" />
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      {/* ── Strategy ── */}
      {strategy && !loading && (
        <div className="flex flex-col gap-5">

          {/* Status Badge + Days Behind */}
          <div className="flex items-center justify-between">
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColor(strategy.status)} ${statusBg(strategy.status)}`}>
              🟠 {statusLabel(strategy.status)}
            </span>
            
            {strategy.daysBehind > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <Clock size={12} className="text-text-secondary/60" />
                <span className="font-semibold text-text-secondary">{strategy.daysBehind} days behind</span>
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="rounded-lg border border-white/5 bg-bg-secondary p-3">
            <p className="text-xs font-medium text-text-secondary/60 mb-1">REASON</p>
            <p className="text-sm leading-relaxed text-text-secondary">{strategy.reason}</p>
          </div>

          {/* Recovery Actions */}
          {strategy.recoveryActions.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary/60">
                Recovery Plan
              </p>
              <ul className="flex flex-col gap-2.5">
                {strategy.recoveryActions.map((action, i) => (
                  <RecoveryActionItem key={i} action={action} />
                ))}
              </ul>
            </div>
          )}

          {/* Modules to Skip */}
          {strategy.modulesToSkip.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary/60">
                Modules to Skip
              </p>
              <div className="flex flex-wrap gap-2">
                {strategy.modulesToSkip.map((mod, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-white/10 bg-bg-secondary px-2.5 py-1 text-xs text-text-secondary"
                  >
                    {mod}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Weeks to Merge */}
          {strategy.weeksToMerge.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary/60">
                Weeks to Merge
              </p>
              <div className="flex flex-wrap gap-2">
                {strategy.weeksToMerge.map((weeks, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-white/10 bg-bg-secondary px-2.5 py-1 text-xs text-text-secondary"
                  >
                    Week {weeks.join(' + ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {/* Recommended Daily Hours */}
            <div className="flex flex-col gap-1 rounded-lg border border-white/5 bg-bg-secondary px-3 py-2">
              <p className="text-xs font-medium text-text-secondary/60">Daily Hours</p>
              <p className="text-lg font-bold text-text-primary">{strategy.recommendedDailyHours}h</p>
            </div>

            {/* Estimated Completion */}
            <div className="flex flex-col gap-1 rounded-lg border border-white/5 bg-bg-secondary px-3 py-2">
              <p className="text-xs font-medium text-text-secondary/60">Est. Completion</p>
              <p className="text-xs font-bold text-text-primary">{strategy.estimatedDaysRemaining} days</p>
            </div>

            {/* Recovery Probability */}
            <div className="flex flex-col gap-1 rounded-lg border border-white/5 bg-bg-secondary px-3 py-2">
              <p className="text-xs font-medium text-text-secondary/60">Recovery Chance</p>
              <div className="flex items-center gap-1">
                <TrendingUp size={14} className={strategy.recoveryProbability >= 70 ? 'text-success' : 'text-warning'} />
                <p className="text-lg font-bold text-text-primary">{strategy.recoveryProbability}%</p>
              </div>
            </div>
          </div>

          {/* Motivational Message */}
          <div className="rounded-lg border border-accent/20 bg-accent/10 p-3">
            <p className="text-sm font-medium italic text-accent">{strategy.motivationalMessage}</p>
          </div>

          {/* Confidence + Timestamp */}
          <div className="flex items-center justify-between text-xs text-text-secondary/50">
            <p>Confidence: <span className="font-semibold text-text-secondary">{strategy.confidence}%</span></p>
            <p>{new Date(strategy.computedAt).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}
