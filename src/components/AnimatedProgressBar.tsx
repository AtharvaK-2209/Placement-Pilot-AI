/**
 * @file AnimatedProgressBar.tsx
 * Phase 6B — Animated progress bar component
 */

import { motion } from 'framer-motion';
import { progressBar } from '../utils/animations';

interface AnimatedProgressBarProps {
  percent: number;
  color?: string;
  height?: string;
  delay?: number;
}

export function AnimatedProgressBar({
  percent,
  color = 'bg-accent',
  height = 'h-1.5',
  delay = 0,
}: AnimatedProgressBarProps) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-white/10 ${height}`}>
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial="initial"
        animate="animate"
        custom={Math.min(100, percent)}
        variants={progressBar}
        transition={{
          duration: 0.8,
          ease: [0.25, 0.1, 0.25, 1],
          delay,
        }}
      />
    </div>
  );
}

interface CircularProgressProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  showValue?: boolean;
}

export function CircularProgress({
  percent,
  size = 80,
  strokeWidth = 6,
  color = '#6366f1',
  trackColor = 'rgba(255, 255, 255, 0.1)',
  showValue = true,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, percent) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90 transform">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{
            duration: 1,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0.2,
          }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {showValue && (
        <motion.div
          className="absolute text-sm font-bold text-text-primary"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {Math.round(percent)}%
        </motion.div>
      )}
    </div>
  );
}
