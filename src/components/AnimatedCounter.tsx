/**
 * @file AnimatedCounter.tsx
 * Phase 6B — Animated counter component for XP, stats, etc.
 */

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface AnimatedCounterProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({
  value,
  className = '',
  prefix = '',
  suffix = '',
}: AnimatedCounterProps) {
  const spring = useSpring(0, {
    damping: 30,
    stiffness: 100,
  });

  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
}
