/**
 * @file MilestonesTimeline.tsx
 * 
 * Premium milestone timeline with achievement tracking.
 * Shows all milestones with unlock states and dates.
 */

import { Flag, Lock, CheckCircle2, Sparkles } from 'lucide-react';
import type { Milestone } from '../../types/domain';

interface MilestonesTimelineProps {
  milestones: Milestone[];
}

function MilestoneItem({ milestone, index }: { milestone: Milestone; index: number }) {
  return (
    <div
      className={`relative flex items-start gap-4 animate-[fade-up_${0.5 + index * 0.1}s_ease_both]`}
    >
      {/* Timeline dot */}
      <div
        className={`relative z-10 mt-1 h-10 w-10 shrink-0 rounded-full border-2 transition-all ${
          milestone.unlocked
            ? 'border-accent bg-gradient-to-br from-accent to-success shadow-lg shadow-accent/30'
            : 'border-white/20 bg-bg-secondary'
        } flex items-center justify-center text-xl`}
      >
        {milestone.unlocked ? (
          milestone.icon
        ) : (
          <Lock size={16} className="text-text-secondary/40" />
        )}
      </div>

      {/* Milestone content */}
      <div
        className={`flex-1 rounded-xl border p-4 transition-all hover:-translate-y-0.5 ${
          milestone.unlocked
            ? 'border-accent/30 bg-gradient-to-br from-accent/10 to-success/5 shadow-sm hover:shadow-md'
            : 'border-white/5 bg-bg-secondary opacity-60'
        }`}
      >
        <div className="mb-2 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3
                className={`text-base font-bold ${
                  milestone.unlocked ? 'text-text-primary' : 'text-text-secondary/60'
                }`}
              >
                {milestone.title}
              </h3>
              {milestone.unlocked && (
                <CheckCircle2 size={16} className="text-success" />
              )}
            </div>
            <p
              className={`text-sm ${
                milestone.unlocked ? 'text-text-secondary' : 'text-text-secondary/50'
              }`}
            >
              {milestone.description}
            </p>
          </div>
        </div>

        {milestone.unlocked && milestone.unlockedAt && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2">
            <Sparkles size={12} className="text-success" />
            <p className="text-xs font-medium text-success">
              Unlocked {new Date(milestone.unlockedAt).toLocaleDateString()}
            </p>
          </div>
        )}

        {!milestone.unlocked && (
          <p className="mt-3 text-xs italic text-text-secondary/40">
            Complete the requirement to unlock this milestone
          </p>
        )}
      </div>
    </div>
  );
}

export default function MilestonesTimeline({ milestones }: MilestonesTimelineProps) {
  const unlockedMilestones = milestones.filter((m) => m.unlocked);
  const totalMilestones = milestones.length;

  // Sort milestones: unlocked first (by date), then locked
  const sortedMilestones = [...milestones].sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    if (a.unlocked && b.unlocked && a.unlockedAt && b.unlockedAt) {
      return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
    }
    return 0;
  });

  return (
    <div className="rounded-2xl border border-white/5 bg-bg-card p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Flag size={15} className="text-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
            Milestones
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-success" />
          <span className="text-sm font-bold text-text-primary">
            {unlockedMilestones.length}/{totalMilestones}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 rounded-lg border border-white/5 bg-bg-secondary p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-text-secondary/60">
          <span>Journey Progress</span>
          <span className="font-bold text-accent">
            {totalMilestones > 0
              ? Math.round((unlockedMilestones.length / totalMilestones) * 100)
              : 0}
            %
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-success transition-all duration-700"
            style={{
              width: `${
                totalMilestones > 0 ? (unlockedMilestones.length / totalMilestones) * 100 : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* Timeline */}
      {sortedMilestones.length > 0 ? (
        <div className="relative space-y-6">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-white/10" />

          {sortedMilestones.map((milestone, index) => (
            <MilestoneItem key={milestone.id} milestone={milestone} index={index} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Flag size={32} className="text-text-secondary/30" />
          <p className="text-sm text-text-secondary/60">
            No milestones available yet. Start your journey to unlock them!
          </p>
        </div>
      )}

      {/* Motivational Footer */}
      {unlockedMilestones.length > 0 && unlockedMilestones.length < totalMilestones && (
        <div className="mt-8 rounded-lg border border-accent/20 bg-accent/10 p-4 text-center">
          <p className="text-xs text-accent">
            {unlockedMilestones.length === 1
              ? '🎉 First milestone unlocked! Keep going!'
              : unlockedMilestones.length >= totalMilestones / 2
              ? '🚀 More than halfway there! Amazing progress!'
              : '💪 Great start! Keep unlocking milestones!'}
          </p>
        </div>
      )}

      {unlockedMilestones.length === totalMilestones && totalMilestones > 0 && (
        <div className="mt-8 rounded-lg border border-success/30 bg-gradient-to-br from-success/20 to-accent/10 p-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Sparkles size={20} className="text-success" />
            <p className="text-lg font-bold text-success">All Milestones Complete!</p>
            <Sparkles size={20} className="text-success" />
          </div>
          <p className="text-sm text-text-secondary">
            You've achieved every milestone on your journey. Congratulations! 🎊
          </p>
        </div>
      )}
    </div>
  );
}
