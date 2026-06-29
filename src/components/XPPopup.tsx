/**
 * @file XPPopup.tsx
 * Phase 6B — XP popup animation component
 */

import { motion, AnimatePresence } from 'framer-motion';
import { xpPopup } from '../utils/animations';
import { Zap } from 'lucide-react';

interface XPPopupProps {
  amount: number;
  show: boolean;
  onComplete?: () => void;
}

export function XPPopup({ amount, show, onComplete }: XPPopupProps) {
  return (
    <AnimatePresence mode="wait" onExitComplete={onComplete}>
      {show && (
        <motion.div
          className="pointer-events-none absolute -top-12 right-0 z-50 flex items-center gap-1.5 rounded-full border border-success/30 bg-success/20 px-3 py-1.5 text-sm font-bold text-success shadow-lg"
          variants={xpPopup}
          initial="initial"
          animate="animate"
          exit="initial"
        >
          <Zap size={14} className="fill-success" />
          +{amount} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}
