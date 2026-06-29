/**
 * @file BadgeGallery.tsx
 * 
 * Premium badge gallery with locked/unlocked states and hover effects.
 * Displays all badges with categories and unlock information.
 */

import { useState } from 'react';
import { Award, Lock, Sparkles } from 'lucide-react';
import type { Badge } from '../../types/domain';

interface BadgeGalleryProps {
  badges: Badge[];
}

function BadgeItem({ badge }: { badge: Badge }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      <div
        className={`group relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200 ${
          badge.locked
            ? 'border-white/5 bg-bg-secondary opacity-50 hover:opacity-70'
            : 'border-accent/30 bg-gradient-to-br from-accent/10 to-success/5 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/20'
        }`}
      >
        {/* Badge Icon */}
        <div
          className={`relative text-5xl ${
            badge.locked ? 'grayscale' : 'drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]'
          }`}
        >
          {badge.icon}
          {badge.locked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-bg-primary/80 p-1.5">
                <Lock size={16} className="text-text-secondary" />
              </div>
            </div>
          )}
        </div>

        {/* Badge Title */}
        <h3
          className={`text-center text-xs font-bold ${
            badge.locked ? 'text-text-secondary/60' : 'text-text-primary'
          }`}
        >
          {badge.title}
        </h3>

        {/* Unlock Date */}
        {!badge.locked && badge.unlockedAt && (
          <p className="text-xs text-accent">
            {new Date(badge.unlockedAt).toLocaleDateString()}
          </p>
        )}

        {/* Category Badge */}
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
            badge.category === 'milestone'
              ? 'border-accent/30 bg-accent/10 text-accent'
              : badge.category === 'streak'
              ? 'border-warning/30 bg-warning/10 text-warning'
              : badge.category === 'completion'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-text-secondary/30 bg-text-secondary/10 text-text-secondary'
          }`}
        >
          {badge.category}
        </span>

        {/* Hover Details */}
        {showDetails && (
          <div className="absolute bottom-full left-1/2 z-10 mb-2 w-48 -translate-x-1/2 rounded-lg border border-white/10 bg-bg-primary p-3 shadow-xl">
            <p className="text-xs leading-relaxed text-text-secondary">
              {badge.description}
            </p>
            {badge.locked && (
              <p className="mt-2 text-xs italic text-text-secondary/60">
                Complete the requirement to unlock
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BadgeGallery({ badges }: BadgeGalleryProps) {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const unlockedBadges = badges.filter((b) => !b.locked);
  const lockedBadges = badges.filter((b) => b.locked);

  const displayBadges =
    filter === 'all'
      ? badges
      : filter === 'unlocked'
      ? unlockedBadges
      : lockedBadges;

  return (
    <div className="rounded-2xl border border-white/5 bg-bg-card p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Award size={15} className="text-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
            Badge Collection
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-warning" />
          <span className="text-sm font-bold text-text-primary">
            {unlockedBadges.length}/{badges.length}
          </span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="mb-6 rounded-lg border border-white/5 bg-bg-secondary p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-text-secondary/60">
          <span>Collection Progress</span>
          <span className="font-bold text-accent">
            {badges.length > 0 ? Math.round((unlockedBadges.length / badges.length) * 100) : 0}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-success transition-all duration-700"
            style={{
              width: `${badges.length > 0 ? (unlockedBadges.length / badges.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
            filter === 'all'
              ? 'border border-accent bg-accent/20 text-accent'
              : 'border border-white/10 bg-bg-secondary text-text-secondary hover:border-white/20 hover:text-text-primary'
          }`}
        >
          All ({badges.length})
        </button>
        <button
          onClick={() => setFilter('unlocked')}
          className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
            filter === 'unlocked'
              ? 'border border-success bg-success/20 text-success'
              : 'border border-white/10 bg-bg-secondary text-text-secondary hover:border-white/20 hover:text-text-primary'
          }`}
        >
          Unlocked ({unlockedBadges.length})
        </button>
        <button
          onClick={() => setFilter('locked')}
          className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
            filter === 'locked'
              ? 'border border-text-secondary bg-text-secondary/20 text-text-secondary'
              : 'border border-white/10 bg-bg-secondary text-text-secondary hover:border-white/20 hover:text-text-primary'
          }`}
        >
          Locked ({lockedBadges.length})
        </button>
      </div>

      {/* Badge Grid */}
      {displayBadges.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {displayBadges.map((badge) => (
            <BadgeItem key={badge.id} badge={badge} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Award size={32} className="text-text-secondary/30" />
          <p className="text-sm text-text-secondary/60">No badges in this category yet</p>
        </div>
      )}
    </div>
  );
}
