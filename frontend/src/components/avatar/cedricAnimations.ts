/**
 * Framer Motion animation variants for Cedric reactions.
 * D-CA-003: CSS sprite sheets for frame-based, Framer Motion for positional/scale.
 */

import type { Variants } from 'framer-motion';

// ---------------------------------------------------------------------------
// Reaction durations (ms) -- used by animation queue
// ---------------------------------------------------------------------------

export const REACTION_DURATIONS: Record<string, number> = {
  jumpXP: 500,
  celebrateLevelUp: 1500,
  catchCoin: 600,
  holdTrophy: 1200,
  victoryPose: 1500,
  spinNewItem: 800,
  waveHello: 1000,
};

// ---------------------------------------------------------------------------
// Framer Motion variants for container-level transforms
// ---------------------------------------------------------------------------

export const jumpXPVariants: Variants = {
  initial: { y: 0 },
  animate: {
    y: [0, -6, 0],
    transition: { duration: 0.5, type: 'spring', stiffness: 300 },
  },
};

export const celebrateLevelUpVariants: Variants = {
  initial: { y: 0, scale: 1 },
  animate: {
    y: [0, -16, 0],
    scale: [1, 1.1, 1],
    transition: { duration: 1.5, type: 'spring' },
  },
};

export const catchCoinVariants: Variants = {
  initial: { y: 0 },
  animate: {
    y: [0, -3, 0],
    transition: { duration: 0.6, ease: 'easeIn' },
  },
};

export const holdTrophyVariants: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: { duration: 1.2, ease: 'easeOut' },
  },
};

export const victoryPoseVariants: Variants = {
  initial: { y: 0, scale: 1 },
  animate: {
    y: [0, -8, 0],
    scale: [1, 1.08, 1],
    transition: { duration: 1, ease: 'easeOut' },
  },
};

export const spinNewItemVariants: Variants = {
  initial: { rotateY: 0 },
  animate: {
    rotateY: [0, 360],
    transition: { duration: 0.8, ease: 'easeInOut' },
  },
};

export const waveHelloVariants: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: [0, -10, 10, -10, 0],
    transition: { duration: 1, ease: 'easeInOut' },
  },
};

// Map from animation state to Framer Motion variants
export const REACTION_VARIANTS: Record<string, Variants> = {
  jumpXP: jumpXPVariants,
  celebrateLevelUp: celebrateLevelUpVariants,
  catchCoin: catchCoinVariants,
  holdTrophy: holdTrophyVariants,
  victoryPose: victoryPoseVariants,
  spinNewItem: spinNewItemVariants,
  waveHello: waveHelloVariants,
};

// Idle state: no container animation (handled by CSS)
export const idleVariants: Variants = {
  initial: {},
  animate: {},
};

// Coin drop animation (for CatchCoin effect)
export const coinDropVariants: Variants = {
  initial: { y: -40, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeIn' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// Floating text animation ("+50 XP" drifts upward and fades)
export const floatingTextVariants: Variants = {
  initial: { y: 0, opacity: 1 },
  animate: {
    y: -40,
    opacity: 0,
    transition: { duration: 1.5, ease: 'easeOut' },
  },
};

// Confetti particle animation
export const confettiParticleVariants: Variants = {
  initial: { y: 0, x: 0, opacity: 1, scale: 1 },
  animate: (custom: { x: number; y: number }) => ({
    y: custom.y,
    x: custom.x,
    opacity: 0,
    scale: 0.5,
    transition: { duration: 1.2, ease: 'easeOut' },
  }),
};
