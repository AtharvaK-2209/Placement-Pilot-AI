/**
 * @file LoadingSpinner.tsx
 * Phase 6A — Loading spinner components with consistent styling
 */

import { Loader2 } from 'lucide-react';

// ─── Loading Spinner Sizes ─────────────────────────────────────────────────────

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
  message?: string;
}

// ─── Base Loading Spinner ──────────────────────────────────────────────────────

export function LoadingSpinner({ 
  size = 'md', 
  className = '',
  message,
}: LoadingSpinnerProps) {
  const sizeClasses: Record<SpinnerSize, number> = {
    xs: 12,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <Loader2 size={sizeClasses[size]} className="animate-spin text-accent" />
      {message && (
        <p className="text-sm text-text-secondary">{message}</p>
      )}
    </div>
  );
}

// ─── Full Page Loading ─────────────────────────────────────────────────────────

export function FullPageLoading({ message }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <LoadingSpinner size="lg" message={message} />
    </div>
  );
}

// ─── Card Loading ──────────────────────────────────────────────────────────────

export function CardLoading({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-white/5 bg-bg-card p-8">
      <LoadingSpinner size="md" message={message} />
    </div>
  );
}

// ─── Inline Loading ────────────────────────────────────────────────────────────

export function InlineLoading({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Loader2 size={14} className="animate-spin text-accent" />
      {message && <span className="text-sm text-text-secondary">{message}</span>}
    </div>
  );
}

// ─── Loading Overlay ───────────────────────────────────────────────────────────

export function LoadingOverlay({ 
  message,
  visible,
}: { 
  message?: string;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm">
      <div className="rounded-2xl border border-white/10 bg-bg-card p-8 shadow-2xl">
        <LoadingSpinner size="lg" message={message} />
      </div>
    </div>
  );
}

// ─── Loading States with Messages ──────────────────────────────────────────────

export const LoadingMessages = {
  analyzing: 'Analyzing Your Goal...',
  generating: 'Generating Personalized Roadmap...',
  mission: 'Generating Daily Mission...',
  health: 'Computing Goal Health...',
  future: 'Predicting Future Progress...',
  rescue: 'Preparing Rescue Plan...',
  saving: 'Saving Changes...',
  loading: 'Loading...',
  processing: 'Processing...',
  updating: 'Updating Progress...',
};

// ─── Specific Loading Components ───────────────────────────────────────────────

export function AnalyzingLoader() {
  return <LoadingSpinner size="md" message={LoadingMessages.analyzing} />;
}

export function GeneratingRoadmapLoader() {
  return <LoadingSpinner size="md" message={LoadingMessages.generating} />;
}

export function GeneratingMissionLoader() {
  return <LoadingSpinner size="md" message={LoadingMessages.mission} />;
}

export function ComputingHealthLoader() {
  return <LoadingSpinner size="md" message={LoadingMessages.health} />;
}

export function PredictingFutureLoader() {
  return <LoadingSpinner size="md" message={LoadingMessages.future} />;
}

export function PreparingRescueLoader() {
  return <LoadingSpinner size="md" message={LoadingMessages.rescue} />;
}

// ─── Skeleton-style Pulse Loader ───────────────────────────────────────────────

export function PulseLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
      <div className="h-2 w-2 animate-pulse rounded-full bg-accent" style={{ animationDelay: '150ms' }} />
      <div className="h-2 w-2 animate-pulse rounded-full bg-accent" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

// ─── Progress Loader (for multi-step operations) ───────────────────────────────

export function ProgressLoader({ 
  steps,
  currentStep,
}: { 
  steps: string[];
  currentStep: number;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <LoadingSpinner size="lg" />
      <div className="max-w-md text-center">
        <p className="mb-2 text-sm font-semibold text-text-primary">
          {steps[currentStep]}
        </p>
        <p className="text-xs text-text-secondary/60">
          Step {currentStep + 1} of {steps.length}
        </p>
        <div className="mt-3 flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={[
                'h-1 flex-1 rounded-full transition-all duration-300',
                i <= currentStep ? 'bg-accent' : 'bg-white/10',
              ].join(' ')}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
