/**
 * @file PageTransition.tsx
 * Phase 6B — Page transition wrapper component
 */

import { motion } from 'framer-motion';
import { pageTransition } from '../utils/animations';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}
