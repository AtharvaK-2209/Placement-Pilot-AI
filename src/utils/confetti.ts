/**
 * @file confetti.ts
 * Phase 6B — Confetti celebration utilities
 */

import confetti from 'canvas-confetti';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFETTI CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Basic confetti burst
 */
export function triggerConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'],
  });
}

/**
 * Side cannons confetti
 */
export function triggerSideConfetti() {
  const end = Date.now() + 1000;

  const colors = ['#6366f1', '#8b5cf6', '#ec4899'];

  (function frame() {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

/**
 * Fireworks confetti
 */
export function triggerFireworks() {
  const duration = 1500;
  const animationEnd = Date.now() + duration;
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 0,
    colors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'],
  };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
}

/**
 * Achievement unlock confetti
 */
export function triggerAchievementConfetti() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.5 },
    colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
    ticks: 200,
  });
}

/**
 * Level up confetti
 */
export function triggerLevelUpConfetti() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: ['#fbbf24', '#f59e0b', '#fb923c', '#f97316'],
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

/**
 * Week unlock confetti
 */
export function triggerWeekUnlockConfetti() {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.55 },
    colors: ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'],
    ticks: 150,
  });
}

/**
 * Roadmap complete confetti
 */
export function triggerRoadmapCompleteConfetti() {
  triggerFireworks();
  setTimeout(() => {
    triggerSideConfetti();
  }, 500);
}

/**
 * Goal achieved confetti
 */
export function triggerGoalAchievedConfetti() {
  triggerLevelUpConfetti();
  setTimeout(() => {
    triggerAchievementConfetti();
  }, 300);
}
