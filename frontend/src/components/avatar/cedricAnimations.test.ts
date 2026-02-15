import { describe, it, expect } from 'vitest';
import {
  REACTION_DURATIONS,
  REACTION_VARIANTS,
  jumpXPVariants,
  celebrateLevelUpVariants,
  catchCoinVariants,
  holdTrophyVariants,
  victoryPoseVariants,
  spinNewItemVariants,
  waveHelloVariants,
  floatingTextVariants,
  confettiParticleVariants,
} from './cedricAnimations';

describe('cedricAnimations (Story 4.3)', () => {
  describe('Reaction variants', () => {
    it('JumpXP has correct motion values', () => {
      const anim = jumpXPVariants.animate as Record<string, unknown>;
      expect(anim.y).toEqual([0, -6, 0]);
      const transition = anim.transition as Record<string, unknown>;
      expect(transition.duration).toBe(0.5);
      expect(transition.type).toBe('spring');
      expect(transition.stiffness).toBe(300);
    });

    it('CelebrateLevelUp has correct motion values', () => {
      const anim = celebrateLevelUpVariants.animate as Record<string, unknown>;
      expect(anim.y).toEqual([0, -16, 0]);
      expect(anim.scale).toEqual([1, 1.1, 1]);
      const transition = anim.transition as Record<string, unknown>;
      expect(transition.duration).toBe(1.5);
    });

    it('CatchCoin has correct motion values', () => {
      const anim = catchCoinVariants.animate as Record<string, unknown>;
      expect(anim.y).toEqual([0, -3, 0]);
      const transition = anim.transition as Record<string, unknown>;
      expect(transition.duration).toBe(0.6);
    });

    it('HoldTrophy has correct motion values', () => {
      const anim = holdTrophyVariants.animate as Record<string, unknown>;
      expect(anim.scale).toEqual([1, 1.05, 1]);
      const transition = anim.transition as Record<string, unknown>;
      expect(transition.duration).toBe(1.2);
    });

    it('VictoryPose has correct motion values', () => {
      const anim = victoryPoseVariants.animate as Record<string, unknown>;
      expect(anim.y).toEqual([0, -8, 0]);
      expect(anim.scale).toEqual([1, 1.08, 1]);
      const transition = anim.transition as Record<string, unknown>;
      expect(transition.duration).toBe(1);
    });

    it('SpinNewItem has correct rotation', () => {
      const anim = spinNewItemVariants.animate as Record<string, unknown>;
      expect(anim.rotateY).toEqual([0, 360]);
      const transition = anim.transition as Record<string, unknown>;
      expect(transition.duration).toBe(0.8);
    });

    it('WaveHello has correct wave motion', () => {
      const anim = waveHelloVariants.animate as Record<string, unknown>;
      expect(anim.rotate).toEqual([0, -10, 10, -10, 0]);
      const transition = anim.transition as Record<string, unknown>;
      expect(transition.duration).toBe(1);
    });
  });

  describe('REACTION_VARIANTS map', () => {
    it('has all 7 reaction types', () => {
      const expected = [
        'jumpXP', 'celebrateLevelUp', 'catchCoin',
        'holdTrophy', 'victoryPose', 'spinNewItem', 'waveHello',
      ];
      for (const key of expected) {
        expect(REACTION_VARIANTS[key]).toBeDefined();
      }
    });
  });

  describe('REACTION_DURATIONS', () => {
    it('has all 7 reaction durations', () => {
      expect(REACTION_DURATIONS.jumpXP).toBe(500);
      expect(REACTION_DURATIONS.celebrateLevelUp).toBe(1500);
      expect(REACTION_DURATIONS.catchCoin).toBe(600);
      expect(REACTION_DURATIONS.holdTrophy).toBe(1200);
      expect(REACTION_DURATIONS.victoryPose).toBe(1500);
      expect(REACTION_DURATIONS.spinNewItem).toBe(800);
      expect(REACTION_DURATIONS.waveHello).toBe(1000);
    });
  });

  describe('Floating text variants', () => {
    it('drifts upward and fades', () => {
      const anim = floatingTextVariants.animate as Record<string, unknown>;
      expect(anim.y).toBe(-40);
      expect(anim.opacity).toBe(0);
    });
  });

  describe('Confetti particle variants', () => {
    it('has initial and animate states', () => {
      expect(confettiParticleVariants.initial).toBeDefined();
      expect(confettiParticleVariants.animate).toBeDefined();
    });
  });
});
