/**
 * @file ExecutionIntelligenceCard.tsx
 *
 * Phase 8: Execution Intelligence Agent UI Component
 *
 * Displays:
 *   - Overall performance assessment
 *   - Interview readiness score
 *   - Strengths & weaknesses
 *   - Behavioral patterns
 *   - Personalized recommendations
 *   - Burnout & deadline risk indicators
 *   - Motivational insight
 */

import { useState } from 'react';
import {
  Brain, TrendingUp, AlertTriangle, Lightbulb,
  RefreshCw, Target, Flame, Clock, Activity,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import type {
  ExecutionIntelligenceScore,
  RiskLevel,
} from '../ai/executionIntelligence/executionIntelligence.schema';

// ─── Risk level helpers ────────────────────────────────────────────────────────

function riskColor(level: RiskLevel) {
  return level === 'low' ? 'text-success' : level === 'medium' ? 'text-warning' : 'text-danger';
}

function riskBg(level: RiskLevel) {
  return level === 'low'
    ? 'border-success/30 bg-success/10'
    : level === 'medium'
    ? 'border-warning/30 bg-warning/10'
    : 'border-danger/30 bg-danger/10';
}

function riskLabel(level: RiskLevel) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function readinessColor(score: number) {
  return score >= 80 ? 'text-success' : score >= 60 ? 'text-accent' : score >= 40 ? 'text-warning' : 'text-danger';
}

function readinessBarColor(score: number) {
  return score >= 80 ? 'bg-success' : score >= 60 ? 'bg-accent' : score >= 40 ? 'bg-warning' : 'bg-danger';
}

// ─── Expandable section ────────────────────────────────────────────────────────

function ExpandableSection({
  title,
  icon,
  items,
  emptyMessage,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  emptyMessage?: string;
}) {
  const [expanded, setExpanded] = useState(true);

  if (items.length === 0 && !emptyMessage) return null;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between gap-2 text-left transition-colors hover:text-text-primary"
      >
        <div className="flex items-center gap-1.5">
          {icon}
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary/60">
            {title}
          </p>
        </div>
        <span className="text-text-secondary/40">
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </span>
      </button>

      {expanded && (
        <ul className="flex flex-col gap-1.5">
          {items.length > 0 ? (
            items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
                {item}
              </li>
            ))
          ) : (
            <li className="text-xs italic text-text-secondary/50">{emptyMessage}</li>
          )}
        </ul>
      )}
    </div>
  );
}

// ─── ExecutionIntelligenceCard ────────────────────────────────────────────────

interface Props {
  analysis: ExecutionIntelligenceScore | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function ExecutionIntelligenceCard({
  analysis,
  loading,
  error,
  onRefresh,
}: Props) {
  return (
    <div className="rounded-2xl border border-white/5 bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      {/* ── Header ── */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Brain size={15} className="text-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
            Execution Intelligence
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
      {loading && !analysis && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
          <p className="text-xs text-text-secondary/60">
            Analyzing your execution patterns…
          </p>
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-danger" />
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      {/* ── Analysis ── */}
      {analysis && !loading && (
        <div className="flex flex-col gap-5">
          {/* Overall Performance */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-secondary/60">
                Overall Performance
              </p>
              <p className="text-base font-bold text-text-primary">
                {analysis.overallPerformance}
              </p>
            </div>

            {/* Confidence */}
            <div className="flex flex-col items-end gap-1">
              <p className="text-xs text-text-secondary/50">
                Confidence{' '}
                <span className="font-semibold text-text-secondary">
                  {analysis.confidence}%
                </span>
              </p>
            </div>
          </div>

          {/* Interview Readiness */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Target size={12} className={readinessColor(analysis.interviewReadiness)} />
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary/60">
                  Interview Readiness
                </p>
              </div>
              <p className={`text-2xl font-extrabold ${readinessColor(analysis.interviewReadiness)}`}>
                {analysis.interviewReadiness}%
              </p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-700 ${readinessBarColor(analysis.interviewReadiness)}`}
                style={{ width: `${analysis.interviewReadiness}%` }}
              />
            </div>
          </div>

          {/* Risk Indicators */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={`rounded-lg border px-3 py-2 ${riskBg(analysis.burnoutRisk)}`}>
              <div className="flex items-center gap-2">
                <Flame size={13} className={riskColor(analysis.burnoutRisk)} />
                <p className="text-xs font-semibold text-text-secondary">Burnout Risk</p>
              </div>
              <p className={`mt-1 text-sm font-bold ${riskColor(analysis.burnoutRisk)}`}>
                {riskLabel(analysis.burnoutRisk)}
              </p>
            </div>

            <div className={`rounded-lg border px-3 py-2 ${riskBg(analysis.deadlineRisk)}`}>
              <div className="flex items-center gap-2">
                <Clock size={13} className={riskColor(analysis.deadlineRisk)} />
                <p className="text-xs font-semibold text-text-secondary">Deadline Risk</p>
              </div>
              <p className={`mt-1 text-sm font-bold ${riskColor(analysis.deadlineRisk)}`}>
                {riskLabel(analysis.deadlineRisk)}
              </p>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <TrendingUp size={12} className="text-success" />
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary/60">
                  Strong Topics
                </p>
              </div>
              <ul className="flex flex-col gap-1.5">
                {analysis.strengths.length > 0 ? (
                  analysis.strengths.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-text-secondary"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                      {s}
                    </li>
                  ))
                ) : (
                  <li className="text-xs italic text-text-secondary/50">
                    No strong patterns detected yet
                  </li>
                )}
              </ul>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-warning" />
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary/60">
                  Needs Attention
                </p>
              </div>
              <ul className="flex flex-col gap-1.5">
                {analysis.weaknesses.length > 0 ? (
                  analysis.weaknesses.map((w, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-text-secondary"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                      {w}
                    </li>
                  ))
                ) : (
                  <li className="text-xs italic text-text-secondary/50">
                    No weaknesses detected
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Behavioral Patterns */}
          <ExpandableSection
            title="Behavioral Patterns"
            icon={<Activity size={12} className="text-accent" />}
            items={analysis.behaviourPatterns}
            emptyMessage="Not enough data to detect patterns yet"
          />

          {/* Recommendations */}
          <ExpandableSection
            title="Coaching Recommendations"
            icon={<Lightbulb size={12} className="text-accent" />}
            items={analysis.recommendations}
          />

          {/* Motivational Message */}
          {analysis.motivationalMessage && (
            <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3">
              <p className="text-sm leading-relaxed text-text-secondary">
                {analysis.motivationalMessage}
              </p>
            </div>
          )}

          {/* Timestamp */}
          <p className="text-right text-xs text-text-secondary/30">
            {new Date(analysis.computedAt).toLocaleString()}
          </p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!analysis && !loading && !error && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Brain size={28} className="text-text-secondary/30" />
          <p className="text-xs text-text-secondary/50">
            Click Refresh to analyze your execution patterns.
          </p>
        </div>
      )}
    </div>
  );
}
