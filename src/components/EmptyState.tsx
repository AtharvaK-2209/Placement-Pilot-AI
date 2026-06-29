/**
 * @file EmptyState.tsx
 * Phase 6A — Empty state components for various scenarios
 */

import React from 'react';
import {
  Target,
  Map,
  BookOpen,
  Sparkles,
  HeartPulse,
  LifeBuoy,
  AlertCircle,
} from 'lucide-react';

// ─── Base Empty State ──────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  secondaryAction 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-text-secondary/40">
        {icon}
      </div>
      <div className="max-w-md">
        <h3 className="mb-2 text-lg font-semibold text-text-primary">{title}</h3>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
      {(action || secondaryAction) && (
        <div className="flex flex-col gap-3 sm:flex-row">
          {action && (
            <button
              onClick={action.onClick}
              className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all duration-200 hover:bg-accent/90 hover:-translate-y-0.5 active:translate-y-0"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="rounded-xl border border-white/10 bg-bg-card px-6 py-3 text-sm font-semibold text-text-primary transition-all duration-200 hover:border-white/20 hover:bg-bg-secondary hover:-translate-y-0.5"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Predefined Empty States ───────────────────────────────────────────────────

export function NoGoalEmptyState({ onCreateGoal }: { onCreateGoal: () => void }) {
  return (
    <EmptyState
      icon={<Target size={32} />}
      title="No Active Goal"
      description="Start your journey by setting a clear goal. Our AI will analyze it and create a personalized roadmap for you."
      action={{
        label: 'Set Your Goal',
        onClick: onCreateGoal,
      }}
    />
  );
}

export function NoRoadmapEmptyState({ 
  onGenerateRoadmap, 
  onBackToGoal 
}: { 
  onGenerateRoadmap?: () => void; 
  onBackToGoal: () => void; 
}) {
  return (
    <EmptyState
      icon={<Map size={32} />}
      title="No Roadmap Generated Yet"
      description="Your personalized learning roadmap will appear here once generated. It will break down your goal into manageable weekly modules."
      action={onGenerateRoadmap ? {
        label: 'Generate Roadmap',
        onClick: onGenerateRoadmap,
      } : undefined}
      secondaryAction={{
        label: 'Set Goal First',
        onClick: onBackToGoal,
      }}
    />
  );
}

export function NoMissionEmptyState({ 
  onGenerateMission,
  onBackToRoadmap,
}: { 
  onGenerateMission?: () => void;
  onBackToRoadmap: () => void;
}) {
  return (
    <EmptyState
      icon={<BookOpen size={32} />}
      title="No Mission Available"
      description="Daily missions break down your weekly goals into focused daily tasks. Select a day and generate your mission to get started."
      action={onGenerateMission ? {
        label: 'Generate Mission',
        onClick: onGenerateMission,
      } : undefined}
      secondaryAction={{
        label: 'Back to Roadmap',
        onClick: onBackToRoadmap,
      }}
    />
  );
}

export function NoFuturePredictionEmptyState({ 
  onRefresh 
}: { 
  onRefresh: () => void;
}) {
  return (
    <EmptyState
      icon={<Sparkles size={32} />}
      title="No Future Prediction Yet"
      description="Our AI analyzes your progress, consistency, and goal health to predict where you'll be in the future. Start making progress to unlock this feature."
      action={{
        label: 'Generate Prediction',
        onClick: onRefresh,
      }}
    />
  );
}

export function NoGoalHealthEmptyState({ 
  onRefresh 
}: { 
  onRefresh: () => void;
}) {
  return (
    <EmptyState
      icon={<HeartPulse size={32} />}
      title="No Goal Health Data"
      description="Goal health tracks your progress momentum, completion trends, and deadline status. Make some progress to unlock health insights."
      action={{
        label: 'Refresh Health',
        onClick: onRefresh,
      }}
    />
  );
}

export function NoDeadlineRescueEmptyState() {
  return (
    <EmptyState
      icon={<LifeBuoy size={32} />}
      title="Deadline Rescue Not Needed"
      description="You're on track! Deadline Rescue activates automatically when your goal health drops or you're falling behind schedule."
    />
  );
}

export function NoDataEmptyState({ 
  message = "No data available yet",
  onRefresh,
}: { 
  message?: string;
  onRefresh?: () => void;
}) {
  return (
    <EmptyState
      icon={<AlertCircle size={32} />}
      title="No Data Available"
      description={message}
      action={onRefresh ? {
        label: 'Refresh',
        onClick: onRefresh,
      } : undefined}
    />
  );
}

// ─── Card-sized Empty States ───────────────────────────────────────────────────

export function CardEmptyState({
  icon,
  message,
  action,
}: {
  icon: React.ReactNode;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-text-secondary/30">
        {icon}
      </div>
      <p className="text-sm text-text-secondary/60">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
