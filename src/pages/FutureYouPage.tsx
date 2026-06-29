/**
 * @file FutureYouPage.tsx
 *
 * Phase 8.5 (Part 2) — Future You Frontend
 *
 * HERO FEATURE:
 *   AI-generated career narrative showing where the user will be
 *   if they continue at their current pace.
 *
 * CARDS:
 *   1. Internship Probability (circular progress)
 *   2. Likely Skills (animated chips)
 *   3. Interview Readiness (percentage + reasoning)
 *   4. Estimated Offers (AI prediction, never guaranteed)
 *   5. Biggest Strength
 *   6. Predicted Weakness
 *   7. Burnout Risk (from Goal Health)
 *   8. Career Timeline (visual milestones)
 *   9. Future Narrative (2-4 paragraph story)
 *   10. AI Recommendations (max 5)
 *   11. Future Metrics (completion %, XP, streak, etc.)
 *   12. Overall Confidence (deterministic + AI)
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Sparkles,
  Target, AlertTriangle, Lightbulb, Calendar,
  BarChart3, Activity, Flame,
  Trophy, CheckCircle2, XCircle, Code2, Briefcase,
  Star,
} from 'lucide-react';
import { Button } from '../components/Button';
import { FutureYouSkeleton } from '../components/SkeletonLoader';
import { NoFuturePredictionEmptyState } from '../components/EmptyState';
import type { FutureYouPrediction } from '../ai/futureYou/futureYou.schema';
import { FutureYouService } from '../services/futureYouService';
import { useFutureYouRepository } from '../hooks/useFutureYouRepository';
import { useGoalHealth } from '../hooks/useGoalHealth';

// ─── Shared Card Component ─────────────────────────────────────────────────────

function Card({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-2xl border border-white/5 bg-bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${className}`} style={style}>
      {children}
    </div>
  );
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="text-accent">{icon}</span>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
        {children}
      </h2>
    </div>
  );
}

// ─── Circular Progress Indicator ───────────────────────────────────────────────

function CircularProgress({ percent, size = 120, strokeWidth = 8, color = '#6366F1' }: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <p className="text-3xl font-bold text-text-primary">{Math.round(percent)}%</p>
      </div>
    </div>
  );
}

// ─── Skill Chip ────────────────────────────────────────────────────────────────

function SkillChip({ skill, delay = 0 }: { skill: string; delay?: number }) {
  return (
    <span
      className="animate-fade-up rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs font-medium text-text-primary backdrop-blur-sm transition-all hover:border-accent/40 hover:bg-accent/10"
      style={{ animationDelay: `${delay}ms` }}
    >
      ✓ {skill}
    </span>
  );
}

// ─── Timeline Milestone ────────────────────────────────────────────────────────

interface Milestone {
  day: number;
  label: string;
  skills: string[];
  confidence: number;
  readiness: number;
}

function TimelineMilestone({ milestone, isLast }: { milestone: Milestone; isLast: boolean }) {
  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[15px] top-[32px] h-full w-[2px] bg-gradient-to-b from-accent/40 to-transparent" />
      )}

      {/* Dot */}
      <div className="relative z-10 mt-1 flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full border-2 border-accent bg-bg-card">
        <div className="h-2 w-2 rounded-full bg-accent" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <p className="text-sm font-bold text-text-primary">{milestone.label}</p>
        <p className="mb-2 text-xs text-text-secondary">Day {milestone.day}</p>
        
        <div className="flex flex-wrap gap-1.5">
          {milestone.skills.map((skill, i) => (
            <span key={i} className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-text-secondary">
              {skill}
            </span>
          ))}
        </div>

        <div className="mt-2 flex gap-4 text-xs text-text-secondary">
          <span>Confidence: {milestone.confidence}%</span>
          <span>Readiness: {milestone.readiness}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Risk Badge ────────────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const colors = {
    low:    { bg: 'border-success/30 bg-success/10', text: 'text-success' },
    medium: { bg: 'border-warning/30 bg-warning/10', text: 'text-warning' },
    high:   { bg: 'border-danger/30 bg-danger/10',   text: 'text-danger' },
  };

  const icons = {
    low:    <CheckCircle2 size={14} />,
    medium: <AlertTriangle size={14} />,
    high:   <XCircle size={14} />,
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 ${colors[level].bg} ${colors[level].text}`}>
      {icons[level]}
      <span className="text-xs font-semibold uppercase tracking-wider">
        {level}
      </span>
    </div>
  );
}

// ─── Confidence Label ──────────────────────────────────────────────────────────

function ConfidenceLabel({ confidence }: { confidence: number }) {
  const label = confidence >= 80 ? 'High' : confidence >= 60 ? 'Moderate' : 'Low';
  const color = confidence >= 80 ? 'text-success' : confidence >= 60 ? 'text-accent' : 'text-warning';
  
  return (
    <span className={`text-xs font-medium uppercase tracking-wider ${color}`}>
      {label}
    </span>
  );
}

// ─── FutureYouPage ─────────────────────────────────────────────────────────────

export default function FutureYouPage() {
  const navigate = useNavigate();
  const repo = useFutureYouRepository();
  const futureYouSvc = useMemo(() => new FutureYouService(repo), [repo]);
  
  const { score: goalHealthScore } = useGoalHealth();

  const [prediction, setPrediction] = useState<FutureYouPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load cached prediction on mount ─────────────────────────────────────────
  useEffect(() => {
    async function loadCached() {
      try {
        const cached = await futureYouSvc.getLatestPrediction();
        if (cached) {
          console.log('[FutureYouPage] Loaded cached prediction:', cached);
          setPrediction(cached);
        }
      } catch (err) {
        console.error('[FutureYouPage] Failed to load cached prediction:', err);
      }
    }
    loadCached();
  }, [futureYouSvc]);

  // ── Generate new prediction ─────────────────────────────────────────────────
  async function handleRefresh() {
    setLoading(true);
    setError(null);

    try {
      // TODO: Gather real context from all services
      // For now, using mock data structure
      const context = {
        currentGoal: 'Software Engineer',
        goalType: 'placement',
        deadline: '2026-12-31',
        difficulty: 'Medium',
        feasibility: 'High',
        executionMode: 'Balanced',
        roadmapVersion: 1,
        totalWeeks: 12,
        completedWeeks: 4,
        currentWeek: 5,
        remainingTopics: ['System Design', 'Advanced DSA'],
        overallCompletionPct: 40,
        completedTasks: 48,
        totalTasks: 120,
        completedDays: 28,
        totalXP: 2400,
        level: 5,
        achievementCount: 8,
        currentStreak: 7,
        longestStreak: 14,
        streakActiveToday: true,
        totalActiveDays: 28,
        goalHealthScore: goalHealthScore?.score ?? 75,
        goalHealthLevel: goalHealthScore?.level ?? 'healthy',
        healthTrend: 'stable' as const,
        burnoutRisk: goalHealthScore?.burnoutRisk ?? 'low' as const,
        deadlineRisk: 'low' as const,
        deadlineStatus: 'on_track' as const,
        estimatedCompletionDate: '2026-12-15',
        interviewReadinessScore: 68,
        strengths: ['Problem Solving', 'Consistency'],
        weaknesses: ['System Design', 'Communication'],
        behaviourPatterns: ['Morning learner', 'Weekend warrior'],
        missedTasksCount: 5,
        revisionTasksCompletedCount: 12,
        revisionTasksTotalCount: 15,
        projectTasksCompletedCount: 8,
        projectTasksTotalCount: 10,
        practiceTasksCompletedCount: 28,
        practiceTasksTotalCount: 35,
        topicsWithHighCompletion: ['Java', 'DSA Basics'],
        topicsWithLowCompletion: ['System Design'],
        deadlineRescueActive: false,
        replanCount: 0,
      };

      const result = await futureYouSvc.generatePrediction(context);
      if (result) {
        setPrediction(result);
      } else {
        setError('Failed to generate prediction');
      }
    } catch (err) {
      console.error('[FutureYouPage] Prediction generation failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  // ── Derived timeline milestones ─────────────────────────────────────────────
  const milestones: Milestone[] = prediction ? [
    {
      day: 0,
      label: 'Today',
      skills: ['Current State'],
      confidence: prediction.confidence * 0.6,
      readiness: prediction.estimatedInterviewConfidence * 0.6,
    },
    {
      day: Math.floor(prediction.targetDays * 0.33),
      label: `${Math.floor(prediction.targetDays * 0.33)} Days`,
      skills: prediction.predictedSkills.slice(0, 2),
      confidence: prediction.confidence * 0.75,
      readiness: prediction.estimatedInterviewConfidence * 0.75,
    },
    {
      day: Math.floor(prediction.targetDays * 0.66),
      label: `${Math.floor(prediction.targetDays * 0.66)} Days`,
      skills: prediction.predictedSkills.slice(2, 4),
      confidence: prediction.confidence * 0.9,
      readiness: prediction.estimatedInterviewConfidence * 0.9,
    },
    {
      day: prediction.targetDays,
      label: `${prediction.targetDays} Days (Target)`,
      skills: prediction.predictedSkills.slice(4, 6),
      confidence: prediction.confidence,
      readiness: prediction.estimatedInterviewConfidence,
    },
  ] : [];

  return (
    <div className="min-h-screen bg-bg-primary pb-24">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 border-b border-white/5 bg-bg-primary/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>

          <Button
            onClick={handleRefresh}
            disabled={loading}
            loading={loading}
            icon={<RefreshCw size={13} />}
            variant="secondary"
            size="sm"
          >
            {loading ? 'Generating...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* ── Hero Section ── */}
      <div className="mx-auto max-w-4xl px-6 pt-12">
        <div className="mb-12 text-center">
          <div className="mb-4 flex justify-center">
            <Sparkles size={48} className="text-accent" />
          </div>
          <h1 className="mb-3 bg-gradient-to-r from-accent via-text-primary to-accent bg-clip-text text-4xl font-bold text-transparent">
            ✨ Future You
          </h1>
          <p className="text-base text-text-secondary">
            If you continue at your current pace, here's where you're likely to be in the next{' '}
            <span className="font-semibold text-accent">
              {prediction?.targetDays ?? '—'}
            </span>{' '}
            days
          </p>
        </div>

        {/* ── Error State ── */}
        {error && (
          <Card className="mb-8 border-danger/30 bg-danger/10">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="shrink-0 text-danger" />
              <div>
                <p className="text-sm font-semibold text-danger">Prediction Failed</p>
                <p className="text-xs text-text-secondary">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* ── Empty State ── */}
        {!prediction && !loading && (
          <NoFuturePredictionEmptyState onRefresh={handleRefresh} />
        )}

        {/* ── Loading State ── */}
        {loading && (
          <FutureYouSkeleton />
        )}

        {/* ── Prediction Content ── */}
        {prediction && !loading && (
          <div className="space-y-6">
            {/* CARD 1: Internship Probability */}
            <Card className="animate-fade-up">
              <SectionHeading icon={<Target size={15} />}>
                Internship Probability
              </SectionHeading>
              <div className="flex flex-col items-center gap-4">
                <CircularProgress
                  percent={prediction.internshipReadiness ? 85 : 45}
                  size={140}
                  strokeWidth={10}
                  color={prediction.internshipReadiness ? '#22C55E' : '#F59E0B'}
                />
                <ConfidenceLabel confidence={prediction.confidence} />
              </div>
            </Card>

            {/* CARD 2: Likely Skills */}
            <Card className="animate-fade-up" style={{ animationDelay: '60ms' }}>
              <SectionHeading icon={<Code2 size={15} />}>
                Likely Skills
              </SectionHeading>
              <div className="flex flex-wrap gap-2">
                {prediction.predictedSkills.map((skill, i) => (
                  <SkillChip key={i} skill={skill} delay={i * 40} />
                ))}
              </div>
            </Card>

            {/* CARD 3: Interview Readiness */}
            <Card className="animate-fade-up" style={{ animationDelay: '100ms' }}>
              <SectionHeading icon={<Briefcase size={15} />}>
                Interview Readiness
              </SectionHeading>
              <div className="mb-3 flex items-baseline gap-2">
                <p className="text-3xl font-bold text-text-primary">
                  {prediction.estimatedInterviewConfidence}%
                </p>
                <ConfidenceLabel confidence={prediction.estimatedInterviewConfidence} />
              </div>
              <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-1000"
                  style={{ width: `${prediction.estimatedInterviewConfidence}%` }}
                />
              </div>
              <p className="text-xs text-text-secondary">
                {prediction.estimatedInterviewConfidence >= 80
                  ? 'Strong technical foundation. Ready for most interviews.'
                  : prediction.estimatedInterviewConfidence >= 60
                  ? 'Good progress. Need more practice with system design and behavioral questions.'
                  : 'Keep building fundamentals. Focus on DSA and communication skills.'}
              </p>
            </Card>

            {/* CARD 4: Estimated Offers */}
            <Card className="animate-fade-up" style={{ animationDelay: '110ms' }}>
              <SectionHeading icon={<Trophy size={15} />}>
                Estimated Offers
              </SectionHeading>
              <div className="mb-2 flex items-baseline gap-2">
                <p className="text-4xl font-bold text-text-primary">
                  {prediction.estimatedOffers}
                </p>
                <span className="text-sm text-text-secondary">potential offers</span>
              </div>
              <p className="text-xs italic text-text-secondary/70">
                ⚠️ AI prediction based on current execution. Not a guarantee.
              </p>
            </Card>

            {/* CARD 5: Biggest Strength */}
            <Card className="animate-fade-up" style={{ animationDelay: '120ms' }}>
              <SectionHeading icon={<Star size={15} />}>
                Biggest Strength
              </SectionHeading>
              <ul className="space-y-2">
                {prediction.biggestStrengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-primary">
                    <span className="mt-1 text-success">✓</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </Card>

            {/* CARD 6: Predicted Weakness */}
            <Card className="animate-fade-up" style={{ animationDelay: '130ms' }}>
              <SectionHeading icon={<AlertTriangle size={15} />}>
                Predicted Weakness
              </SectionHeading>
              <ul className="space-y-2">
                {prediction.biggestWeaknesses.map((weakness, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="mt-1 text-warning">⚠</span>
                    {weakness}
                  </li>
                ))}
              </ul>
            </Card>

            {/* CARD 7: Burnout Risk */}
            <Card className="animate-fade-up" style={{ animationDelay: '140ms' }}>
              <SectionHeading icon={<Flame size={15} />}>
                Burnout Risk
              </SectionHeading>
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-secondary">Current assessment</p>
                <RiskBadge level={goalHealthScore?.burnoutRisk ?? 'low'} />
              </div>
            </Card>

            {/* CARD 8: Career Timeline */}
            <Card className="animate-fade-up" style={{ animationDelay: '150ms' }}>
              <SectionHeading icon={<Calendar size={15} />}>
                Career Timeline
              </SectionHeading>
              <div className="mt-4">
                {milestones.map((milestone, i) => (
                  <TimelineMilestone
                    key={i}
                    milestone={milestone}
                    isLast={i === milestones.length - 1}
                  />
                ))}
              </div>
            </Card>

            {/* CARD 9: Future Narrative (Hero Feature) */}
            <Card className="animate-fade-up border-accent/20 bg-gradient-to-br from-accent/5 to-transparent" style={{ animationDelay: '160ms' }}>
              <SectionHeading icon={<Sparkles size={15} />}>
                Future Narrative
              </SectionHeading>
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                  {prediction.careerNarrative}
                </p>
              </div>
            </Card>

            {/* CARD 10: AI Recommendations */}
            <Card className="animate-fade-up" style={{ animationDelay: '170ms' }}>
              <SectionHeading icon={<Lightbulb size={15} />}>
                AI Recommendations
              </SectionHeading>
              <ul className="space-y-3">
                {prediction.personalizedRecommendations.slice(0, 5).map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="mt-1 shrink-0 text-accent">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </Card>

            {/* CARD 11: Future Metrics */}
            <Card className="animate-fade-up" style={{ animationDelay: '180ms' }}>
              <SectionHeading icon={<BarChart3 size={15} />}>
                Future Metrics
              </SectionHeading>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-text-secondary/60">
                    Est. Completion
                  </p>
                  <p className="text-xl font-bold text-text-primary">
                    {Math.min(100, Math.round(prediction.confidence * 0.95))}%
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-text-secondary/60">
                    Skills Gained
                  </p>
                  <p className="text-xl font-bold text-text-primary">
                    {prediction.predictedSkills.length}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-text-secondary/60">
                    Readiness Score
                  </p>
                  <p className="text-xl font-bold text-text-primary">
                    {prediction.estimatedInterviewConfidence}%
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-text-secondary/60">
                    Target Timeline
                  </p>
                  <p className="text-xl font-bold text-text-primary">
                    {prediction.targetDays} days
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-text-secondary/60">
                    Strengths
                  </p>
                  <p className="text-xl font-bold text-text-primary">
                    {prediction.biggestStrengths.length}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wider text-text-secondary/60">
                    Focus Areas
                  </p>
                  <p className="text-xl font-bold text-text-primary">
                    {prediction.biggestWeaknesses.length}
                  </p>
                </div>
              </div>
            </Card>

            {/* CARD 12: Overall Confidence */}
            <Card className="animate-fade-up" style={{ animationDelay: '190ms' }}>
              <SectionHeading icon={<Activity size={15} />}>
                Overall Confidence
              </SectionHeading>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-text-secondary">
                  AI confidence in this prediction
                </p>
                <ConfidenceLabel confidence={prediction.confidence} />
              </div>
              <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-success transition-all duration-1000"
                  style={{ width: `${prediction.confidence}%` }}
                />
              </div>
              <p className="text-xs font-bold text-accent">{prediction.confidence}%</p>
              <p className="mt-3 text-xs italic text-text-secondary/70">
                Based on deterministic analytics: completion trend, consistency, goal health, and deadline status.
                This is an AI estimation, not a guarantee of success.
              </p>
            </Card>

            {/* Footer Timestamp */}
            <div className="pt-4 text-center">
              <p className="text-xs text-text-secondary/60">
                Last updated: {new Date(prediction.predictedAt).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
