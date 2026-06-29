/**
 * @file animations.ts
 * Phase 6B — Animation utilities and configurations
 */

import type { Variants } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE TRANSITION VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CARD VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const cardHover: Variants = {
  rest: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  tap: {
    scale: 0.98,
    y: 0,
  },
};

export const cardStagger = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const cardItem: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS BAR ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

export const progressBar: Variants = {
  initial: {
    width: 0,
  },
  animate: (percent: number) => ({
    width: `${percent}%`,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1],
      delay: 0.2,
    },
  }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// COUNTER ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

export const counterAnimation = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
  transition: { duration: 0.15 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// XP POPUP ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

export const xpPopup: Variants = {
  initial: {
    opacity: 0,
    y: 0,
    scale: 0.5,
  },
  animate: {
    opacity: [0, 1, 1, 0],
    y: [0, -20, -40, -60],
    scale: [0.5, 1.2, 1, 0.8],
    transition: {
      duration: 1.5,
      times: [0, 0.2, 0.7, 1],
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CHECKBOX ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

export const checkboxVariants: Variants = {
  unchecked: {
    pathLength: 0,
    opacity: 0,
  },
  checked: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { type: 'tween', duration: 0.2, ease: 'easeOut' },
      opacity: { duration: 0.1 },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// BADGE UNLOCK ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

export const badgeUnlock: Variants = {
  initial: {
    scale: 0,
    rotate: -180,
    opacity: 0,
  },
  animate: {
    scale: [0, 1.2, 1],
    rotate: [0, 10, -10, 0],
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// BUTTON VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const buttonVariants: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  tap: {
    scale: 0.95,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// FADE VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const fadeIn: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCALE VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const scaleIn: Variants = {
  initial: {
    scale: 0.9,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const slideInFromLeft: Variants = {
  initial: {
    x: -20,
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

export const slideInFromRight: Variants = {
  initial: {
    x: 20,
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};
