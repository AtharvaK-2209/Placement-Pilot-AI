/**
 * @file GamificationSummary.tsx
 * Phase 6B — Compact gamification summary with animations
 */

import { motion } from 'framer-motion';
import { Trophy, Zap, Flame, Award, Target, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatedCounter } from '../AnimatedCounter';
import { AnimatedProgressBar } from '../AnimatedProgressBar';
import { cardStagger, cardItem } from '../../utils/animations';
import type { LevelState, ExtendedStreakState, Badge, WeeklyGoal } from '../../types/domain';

interface GamificationSummaryProps {
  level: LevelState;
  totalXP: number;
  streak: ExtendedStreakState;
  latestBadge?: Badge;
  weeklyGoal: WeeklyGoal;
  currentWeekProgress: {
    overallProgress: number;
  };
}

export default function GamificationSummary({
  level,
  totalXP,
  streak,
  latestBadge,
  weeklyGoal,
  currentWeekProgress,
}: GamificationSummaryProps) {
  const navigate = useNavigate();

  return (
    <motion.div 
      className="rounded-2xl border border-white/5 bg-bg-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Trophy size={15} className="text-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
            Your Progress
          </h2>
        </div>
        <motion.button
          onClick={() => navigate('/gamification')}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-bg-secondary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors"
          whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.2)', color: 'rgb(var(--text-primary))' }}
          whileTap={{ scale: 0.95 }}
        >
          View All
          <ArrowRight size={12} />
        </motion.button>
      </div>

      {/* Stats Grid */}
      <motion.div 
        className="grid grid-cols-2 gap-3 mb-6"
        variants={cardStagger}
        initial="initial"
        animate="animate"
      >
        {/* Level */}
        <motion.div 
          className="rounded-lg border border-white/5 bg-bg-secondary px-4 py-3"
          variants={cardItem}
          whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={14} className="text-accent" />
            <p className="text-xs font-medium text-text-secondary/60">Level</p>
          </div>
          <div className="flex items-baseline gap-1.5">
            <AnimatedCounter 
              value={level.level}
              className="text-2xl font-bold text-text-primary"
            />
            {level.title && (
              <p className="text-xs text-accent">{level.title}</p>
            )}
          </div>
          <div className="mt-2">
            <AnimatedProgressBar 
              percent={level.progress} 
              height="h-1.5"
              delay={0.3}
            />
          </div>
        </motion.div>

        {/* Total XP */}
        <motion.div 
          className="rounded-lg border border-white/5 bg-bg-secondary px-4 py-3"
          variants={cardItem}
          whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-warning" />
            <p className="text-xs font-medium text-text-secondary/60">Total XP</p>
          </div>
          <AnimatedCounter 
            value={totalXP}
            className="text-2xl font-bold text-text-primary"
          />
          <p className="text-xs text-text-secondary/60 mt-1">
            <AnimatedCounter 
              value={level.nextLevelXP - level.currentXP}
              suffix=" to next level"
            />
          </p>
        </motion.div>

        {/* Current Streak */}
        <motion.div 
          className="rounded-lg border border-warning/20 bg-warning/10 px-4 py-3"
          variants={cardItem}
          whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
        >
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Flame size={14} className="text-warning" />
            </motion.div>
            <p className="text-xs font-medium text-warning/80">Streak</p>
          </div>
          <div className="flex items-baseline gap-1.5">
            <AnimatedCounter 
              value={streak.currentStreak}
              className="text-2xl font-bold text-text-primary"
            />
            <p className="text-xs text-text-secondary">days</p>
          </div>
          {streak.longestStreak > streak.currentStreak && (
            <p className="text-xs text-text-secondary/60 mt-1">
              Best: {streak.longestStreak} days
            </p>
          )}
        </motion.div>

        {/* Latest Badge */}
        <motion.div 
          className="rounded-lg border border-white/5 bg-bg-secondary px-4 py-3"
          variants={cardItem}
          whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Award size={14} className="text-accent" />
            <p className="text-xs font-medium text-text-secondary/60">Latest Badge</p>
          </div>
          {latestBadge ? (
            <div className="flex items-center gap-2">
              <motion.span 
                className="text-2xl"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                {latestBadge.icon}
              </motion.span>
              <p className="text-xs font-bold text-text-primary">{latestBadge.title}</p>
            </div>
          ) : (
            <p className="text-xs text-text-secondary/60">No badges yet</p>
          )}
        </motion.div>
      </motion.div>

      {/* Weekly Goal Progress */}
      <motion.div 
        className="rounded-lg border border-white/5 bg-bg-secondary p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-accent" />
            <span className="text-xs font-medium text-text-secondary">Weekly Goal</span>
          </div>
          <span className="text-sm font-bold text-accent">
            {currentWeekProgress.overallProgress.toFixed(0)}%
          </span>
        </div>
        <AnimatedProgressBar 
          percent={currentWeekProgress.overallProgress} 
          height="h-2"
          delay={0.6}
        />
        <div className="mt-2 flex items-center justify-between text-xs text-text-secondary/60">
          <span>
            <AnimatedCounter value={weeklyGoal.completedMissions} />
            /{weeklyGoal.targetMissions} missions
          </span>
          <span>
            <AnimatedCounter value={weeklyGoal.earnedXP} />
            /{weeklyGoal.targetXP} XP
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
