/**
 * @file XPHistoryTimeline.tsx
 * 
 * Premium XP history display with timeline visualization.
 * Shows recent XP gains with dates, reasons, and amounts.
 */

import { useState } from 'react';
import { Zap, Clock, TrendingUp, Filter } from 'lucide-react';
import type { XPEntry, XPSource } from '../../types/domain';

interface XPHistoryTimelineProps {
  xpLog: XPEntry[];
  limit?: number;
}

function getXPSourceIcon(source: XPSource) {
  switch (source) {
    case 'task_complete':
      return '✅';
    case 'day_complete':
      return '🎯';
    case 'week_complete':
      return '📅';
    case 'streak_bonus':
      return '🔥';
    case 'milestone':
      return '🏆';
    case 'achievement':
      return '⭐';
    default:
      return '✨';
  }
}

function getXPSourceColor(source: XPSource) {
  switch (source) {
    case 'task_complete':
      return 'text-success';
    case 'day_complete':
      return 'text-accent';
    case 'week_complete':
      return 'text-accent';
    case 'streak_bonus':
      return 'text-warning';
    case 'milestone':
      return 'text-warning';
    case 'achievement':
      return 'text-accent';
    default:
      return 'text-text-secondary';
  }
}

function getXPSourceLabel(source: XPSource) {
  switch (source) {
    case 'task_complete':
      return 'Task Complete';
    case 'day_complete':
      return 'Mission Complete';
    case 'week_complete':
      return 'Week Complete';
    case 'streak_bonus':
      return 'Streak Bonus';
    case 'milestone':
      return 'Milestone';
    case 'achievement':
      return 'Achievement';
    default:
      return source;
  }
}

export default function XPHistoryTimeline({ xpLog, limit = 20 }: XPHistoryTimelineProps) {
  const [filterSource, setFilterSource] = useState<XPSource | 'all'>('all');

  // Filter and sort entries
  const filteredLog =
    filterSource === 'all'
      ? xpLog
      : xpLog.filter((entry) => entry.source === filterSource);

  const displayLog = filteredLog
    .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
    .slice(0, limit);

  // Calculate stats
  const totalXP = xpLog.reduce((sum, entry) => sum + entry.amount, 0);
  const recentXP = displayLog.reduce((sum, entry) => sum + entry.amount, 0);

  // Get unique sources for filter
  const sources = Array.from(new Set(xpLog.map((entry) => entry.source)));

  return (
    <div className="rounded-2xl border border-white/5 bg-bg-card p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Clock size={15} className="text-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
            XP History
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-success" />
          <span className="text-sm font-bold text-text-primary">
            {totalXP} Total XP
          </span>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
        <Filter size={14} className="text-text-secondary" />
        <button
          onClick={() => setFilterSource('all')}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            filterSource === 'all'
              ? 'border border-accent bg-accent/20 text-accent'
              : 'border border-white/10 bg-bg-secondary text-text-secondary hover:border-white/20'
          }`}
        >
          All
        </button>
        {sources.map((source) => (
          <button
            key={source}
            onClick={() => setFilterSource(source)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filterSource === source
                ? 'border border-accent bg-accent/20 text-accent'
                : 'border border-white/10 bg-bg-secondary text-text-secondary hover:border-white/20'
            }`}
          >
            {getXPSourceIcon(source)} {getXPSourceLabel(source)}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {displayLog.length > 0 ? (
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-white/10" />

          {displayLog.map((entry, index) => (
            <div key={entry.id} className="relative flex items-start gap-4">
              {/* Timeline dot */}
              <div
                className={`relative z-10 mt-1 h-6 w-6 shrink-0 rounded-full border-2 border-bg-card ${getXPSourceColor(
                  entry.source
                )} bg-bg-card flex items-center justify-center text-xs`}
              >
                {getXPSourceIcon(entry.source)}
              </div>

              {/* Entry content */}
              <div
                className={`flex-1 rounded-lg border border-white/5 bg-bg-secondary p-4 transition-all hover:border-white/10 ${
                  index === 0 ? 'animate-[fade-up_0.5s_ease_both]' : ''
                }`}
              >
                <div className="mb-2 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="mb-1 text-sm font-bold text-text-primary">
                      {entry.description}
                    </h3>
                    <p className="text-xs text-text-secondary/60">
                      {getXPSourceLabel(entry.source)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/10 px-3 py-1.5">
                    <Zap size={12} className="text-success" />
                    <span className="text-sm font-bold text-success">+{entry.amount}</span>
                  </div>
                </div>
                <p className="text-xs text-text-secondary/40">
                  {new Date(entry.earnedAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Zap size={32} className="text-text-secondary/30" />
          <p className="text-sm text-text-secondary/60">
            {filterSource === 'all'
              ? 'No XP earned yet. Complete tasks to start earning!'
              : `No XP from ${getXPSourceLabel(filterSource)} yet`}
          </p>
        </div>
      )}

      {/* Summary */}
      {displayLog.length > 0 && displayLog.length < xpLog.length && (
        <div className="mt-6 rounded-lg border border-white/5 bg-bg-secondary p-4 text-center">
          <p className="text-xs text-text-secondary/60">
            Showing {displayLog.length} of {filteredLog.length} entries
            {filterSource === 'all' && (
              <span className="ml-1">({recentXP} XP)</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
