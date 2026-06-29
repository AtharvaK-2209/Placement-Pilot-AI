/**
 * @file AnimatedCard.tsx
 * Phase 6B — Animated card wrapper with hover effects
 */

import { motion } from 'framer-motion';
import { cardHover, cardItem } from '../utils/animations';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  delay?: number;
  hover?: boolean;
}

export function AnimatedCard({
  children,
  className = '',
  onClick,
  delay = 0,
  hover = true,
}: AnimatedCardProps) {
  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      className={`rounded-2xl border border-white/5 bg-bg-card ${onClick ? 'cursor-pointer text-left' : ''} ${className}`}
      variants={hover ? cardHover : cardItem}
      initial={hover ? 'rest' : 'initial'}
      animate={hover ? 'rest' : 'animate'}
      whileHover={hover ? 'hover' : undefined}
      whileTap={hover && onClick ? 'tap' : undefined}
      onClick={onClick}
      transition={{
        delay,
      }}
    >
      {children}
    </Component>
  );
}
