/**
 * @file LevelCard.tsx
 * Phase 6B — Premium level display with animated XP ring and level details
 */

import { motion } from 'framer-motion';
import { Trophy, Zap, TrendingUp } from 'lucide-react';
import { AnimatedCounter } from '../AnimatedCounter';
import { AnimatedProgressBar } from '../AnimatedProgressBar';
import type { LevelState } from '../../types/domain';

interface LevelCardProps {
  level: LevelState;
  totalXP: number;
}

export default function LevelCard({ level, totalXP }: LevelCardProps) {
  // Calculate circle properties for the progress ring
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (level.progress / 100) * circumference;

  return (
    <motion.div 
      className="rounded-2xl border border-white/5 bg-bg-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      {/* Header */}
      <div className="mb-6 flex items-center gap-2.5">
        <Trophy size={15} className="text-accent" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
          Level Progress
        </h2>
      </div>

      <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
        {/* Progress Ring */}
        <div className="relative flex items-center justify-center">
          {/* Background circle */}
          <svg className="h-40 w-40 -rotate-90 transform">
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <motion.circle
              cx="80"
              cy="80"
              r={radius}
              stroke="url(#levelGradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
            />
            <defs>
              <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#22C55E" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center content */}
          <motion.div 
            className="absolute flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <p className="text-xs font-medium text-text-secondary/60">LEVEL</p>
            <AnimatedCounter 
              value={level.level}
              className="text-4xl font-extrabold text-text-primary"
            />
            {level.title && (
              <motion.p 
                className="text-xs font-medium text-accent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {level.title}
              </motion.p>
            )}
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div 
          className="flex flex-1 flex-col gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Total XP */}
          <motion.div 
            className="rounded-lg border border-white/5 bg-bg-secondary px-4 py-3"
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-warning" />
                <span className="text-sm font-medium text-text-secondary">Total XP</span>
              </div>
              <AnimatedCounter 
                value={totalXP}
                className="text-2xl font-bold text-text-primary"
              />
            </div>
          </motion.div>

          {/* Current Level XP */}
          <motion.div 
            className="rounded-lg border border-white/5 bg-bg-secondary px-4 py-3"
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-secondary/60">Current Level XP</span>
              <span className="text-sm font-bold text-accent">{level.progress.toFixed(0)}%</span>
            </div>
            <AnimatedProgressBar percent={level.progress} delay={0.5} />
            <div className="mt-2 flex items-center justify-between text-xs text-text-secondary/60">
              <AnimatedCounter value={level.currentXP} suffix=" XP" />
              <span>{level.nextLevelXP} XP</span>
            </div>
          </motion.div>

          {/* XP Needed */}
          <motion.div 
            className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/10 px-4 py-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.7 }}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          >
            <TrendingUp size={14} className="text-accent" />
            <span className="text-xs text-text-secondary">
              <AnimatedCounter 
                value={level.nextLevelXP - level.currentXP}
                className="font-bold text-accent"
                suffix=" XP"
              />
              {' '}needed for Level {level.level + 1}
            </span>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
