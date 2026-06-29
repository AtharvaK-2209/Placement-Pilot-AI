/**
 * @file SkeletonLoader.tsx
 * Phase 6A — Skeleton loaders for different page layouts
 * Provides consistent loading states that match final component layouts
 */

import React from 'react';

// ─── Base Skeleton Component ───────────────────────────────────────────────────

export function Skeleton({ className = '', variant = 'default' }: { 
  className?: string; 
  variant?: 'default' | 'circle' | 'text' | 'button';
}) {
  const baseClasses = 'animate-pulse bg-white/10';
  const variantClasses = {
    default: 'rounded-xl',
    circle: 'rounded-full',
    text: 'rounded h-4',
    button: 'rounded-xl h-10',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
}

// ─── Card Skeleton ─────────────────────────────────────────────────────────────

export function CardSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-bg-card p-6">
      {children}
    </div>
  );
}

// ─── Goal Analysis Skeleton ────────────────────────────────────────────────────

export function GoalAnalysisSkeleton() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-bg-primary/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Skeleton className="h-5 w-20" variant="text" />
          <Skeleton className="h-5 w-32" variant="text" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Hero */}
        <div className="mb-10 space-y-3">
          <Skeleton className="h-4 w-40" variant="text" />
          <Skeleton className="h-10 w-full max-w-2xl" />
          <Skeleton className="h-5 w-full max-w-xl" />
        </div>

        {/* Summary card */}
        <CardSkeleton>
          <Skeleton className="mb-3 h-4 w-24" variant="text" />
          <Skeleton className="h-4 w-full" variant="text" />
          <Skeleton className="h-4 w-5/6" variant="text" />
        </CardSkeleton>

        {/* Metrics grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i}>
              <Skeleton className="mb-4 h-9 w-9" variant="circle" />
              <Skeleton className="mb-2 h-3 w-20" variant="text" />
              <Skeleton className="h-8 w-24" />
            </CardSkeleton>
          ))}
        </div>

        {/* Strengths & Gaps */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <CardSkeleton key={i}>
              <Skeleton className="mb-4 h-4 w-28" variant="text" />
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-4 w-full" variant="text" />
                ))}
              </div>
            </CardSkeleton>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 flex justify-center">
          <Skeleton className="h-12 w-64" variant="button" />
        </div>
      </main>
    </div>
  );
}

// ─── Roadmap Skeleton ──────────────────────────────────────────────────────────

export function RoadmapSkeleton() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-bg-primary/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Skeleton className="h-5 w-32" variant="text" />
          <Skeleton className="h-5 w-32" variant="text" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Hero */}
        <div className="mb-10 space-y-3">
          <Skeleton className="h-4 w-48" variant="text" />
          <Skeleton className="h-10 w-full max-w-2xl" />
          <Skeleton className="h-5 w-full max-w-xl" />
        </div>

        {/* Stats grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i}>
              <Skeleton className="mb-2 h-8 w-8" variant="circle" />
              <Skeleton className="mb-2 h-3 w-20" variant="text" />
              <Skeleton className="h-7 w-16" />
            </CardSkeleton>
          ))}
        </div>

        {/* Week cards */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <Skeleton className="h-9 w-9 shrink-0" variant="circle" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-3/4" variant="text" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20" variant="button" />
                      <Skeleton className="h-6 w-16" variant="button" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-4 w-4" variant="circle" />
              </div>
            </CardSkeleton>
          ))}
        </div>
      </main>
    </div>
  );
}

// ─── Daily Mission Skeleton ────────────────────────────────────────────────────

export function DailyMissionSkeleton() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-bg-primary/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Skeleton className="h-5 w-32" variant="text" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-16" variant="button" />
            <Skeleton className="h-5 w-32" variant="text" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Hero */}
        <div className="mb-10 space-y-3">
          <Skeleton className="h-4 w-32" variant="text" />
          <Skeleton className="h-10 w-full max-w-xl" />
        </div>

        {/* Progress cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i}>
              <Skeleton className="mb-2 h-3 w-20" variant="text" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="mt-3 h-1.5 w-full" />
            </CardSkeleton>
          ))}
        </div>

        {/* Day selector */}
        <CardSkeleton>
          <Skeleton className="mb-4 h-4 w-48" variant="text" />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-9 w-9" variant="circle" />
            ))}
          </div>
        </CardSkeleton>

        {/* Task sections */}
        <div className="mt-6 space-y-6">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i}>
              <Skeleton className="mb-4 h-4 w-28" variant="text" />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-12 w-full" />
                ))}
              </div>
            </CardSkeleton>
          ))}
        </div>
      </main>
    </div>
  );
}

// ─── Dashboard Skeleton ────────────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Hero */}
        <div className="mb-12 space-y-3">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-6 w-64" variant="text" />
          <Skeleton className="h-4 w-48" variant="text" />
        </div>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Column 1 */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <CardSkeleton>
              <Skeleton className="mb-4 h-4 w-32" variant="text" />
              <Skeleton className="mb-4 h-8 w-3/4" />
              <div className="mb-4 grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg border border-white/5 bg-bg-secondary px-3 py-2">
                    <Skeleton className="mb-1 h-3 w-12" variant="text" />
                    <Skeleton className="h-6 w-8" />
                  </div>
                ))}
              </div>
              <Skeleton className="mb-4 h-2 w-full" />
              <Skeleton className="h-12 w-full" variant="button" />
            </CardSkeleton>

            <CardSkeleton>
              <Skeleton className="mb-4 h-4 w-32" variant="text" />
              <Skeleton className="mb-4 h-7 w-3/4" />
              <div className="grid grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="rounded-lg border border-white/5 bg-bg-secondary px-3 py-2">
                    <Skeleton className="mb-1 h-3 w-24" variant="text" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            </CardSkeleton>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col gap-6">
            {[1, 2, 3].map((i) => (
              <CardSkeleton key={i}>
                <Skeleton className="mb-4 h-4 w-28" variant="text" />
                <Skeleton className="mb-2 h-8 w-20" />
                <Skeleton className="h-1.5 w-full" />
                <Skeleton className="mt-3 h-3 w-32" variant="text" />
              </CardSkeleton>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-12">
          <Skeleton className="mb-6 h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CardSkeleton key={i}>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12" variant="circle" />
                  <div className="flex-1">
                    <Skeleton className="mb-1 h-4 w-24" variant="text" />
                    <Skeleton className="h-3 w-32" variant="text" />
                  </div>
                </div>
              </CardSkeleton>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Future You Skeleton ───────────────────────────────────────────────────────

export function FutureYouSkeleton() {
  return (
    <div className="min-h-screen bg-bg-primary pb-24">
      <header className="sticky top-0 z-10 border-b border-white/5 bg-bg-primary/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Skeleton className="h-5 w-20" variant="text" />
          <Skeleton className="h-8 w-24" variant="button" />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 pt-12">
        {/* Hero */}
        <div className="mb-12 space-y-4 text-center">
          <Skeleton className="mx-auto h-12 w-12" variant="circle" />
          <Skeleton className="mx-auto h-10 w-64" />
          <Skeleton className="mx-auto h-5 w-96" variant="text" />
        </div>

        {/* Cards */}
        <div className="space-y-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i}>
              <Skeleton className="mb-4 h-4 w-40" variant="text" />
              <Skeleton className="mb-2 h-6 w-3/4" variant="text" />
              <Skeleton className="h-4 w-full" variant="text" />
              <Skeleton className="h-4 w-5/6" variant="text" />
            </CardSkeleton>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Goal Health Skeleton ──────────────────────────────────────────────────────

export function GoalHealthSkeleton() {
  return (
    <CardSkeleton>
      <div className="flex items-center justify-between mb-5">
        <Skeleton className="h-4 w-32" variant="text" />
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="mb-4 h-4 w-full" variant="text" />
      <Skeleton className="mb-4 h-4 w-5/6" variant="text" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-full" variant="text" />
        <Skeleton className="h-3 w-full" variant="text" />
      </div>
      <Skeleton className="mt-4 h-10 w-full" variant="button" />
    </CardSkeleton>
  );
}

// ─── Deadline Rescue Skeleton ──────────────────────────────────────────────────

export function DeadlineRescueSkeleton() {
  return (
    <CardSkeleton>
      <Skeleton className="mb-4 h-4 w-40" variant="text" />
      <Skeleton className="mb-4 h-6 w-full" variant="text" />
      <Skeleton className="mb-2 h-4 w-5/6" variant="text" />
      <Skeleton className="mb-4 h-4 w-3/4" variant="text" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
      <Skeleton className="mt-4 h-10 w-full" variant="button" />
    </CardSkeleton>
  );
}

// ─── Generic Content Skeleton ──────────────────────────────────────────────────

export function ContentSkeleton({ 
  lines = 3, 
  includeTitle = true 
}: { 
  lines?: number; 
  includeTitle?: boolean; 
}) {
  return (
    <div className="space-y-3">
      {includeTitle && <Skeleton className="h-6 w-2/3" />}
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${i === lines - 1 ? 'w-4/5' : 'w-full'}`} 
          variant="text" 
        />
      ))}
    </div>
  );
}
