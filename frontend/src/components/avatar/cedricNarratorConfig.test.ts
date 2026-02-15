import { describe, it, expect } from 'vitest';
import {
  ORACLE_PHASES,
  GENERIC_LOADING_PHASES,
  MATCH_LOADING_PHASES,
  RESUME_LOADING_PHASES,
} from './cedricNarratorConfig';
import type { NarratorPhase } from './useCedricNarrator';

function validatePhaseArray(name: string, phases: NarratorPhase[]) {
  describe(name, () => {
    it('has at least one phase', () => {
      expect(phases.length).toBeGreaterThan(0);
    });

    it('all phases have valid time ranges (minTime < maxTime)', () => {
      for (const phase of phases) {
        expect(phase.minTime).toBeLessThan(phase.maxTime);
      }
    });

    it('phases are sorted by minTime', () => {
      for (let i = 1; i < phases.length; i++) {
        expect(phases[i].minTime).toBeGreaterThanOrEqual(phases[i - 1].minTime);
      }
    });

    it('no gaps between consecutive phases', () => {
      for (let i = 1; i < phases.length; i++) {
        expect(phases[i].minTime).toBe(phases[i - 1].maxTime);
      }
    });

    it('all phases have both medieval and modern dialogue variants', () => {
      for (const phase of phases) {
        expect(phase.dialogue.medieval).toBeTruthy();
        expect(phase.dialogue.modern).toBeTruthy();
      }
    });

    it('all phases have a valid avatarState', () => {
      for (const phase of phases) {
        expect(typeof phase.avatarState).toBe('string');
        expect(phase.avatarState.length).toBeGreaterThan(0);
      }
    });

    it('tip variants (if present) have both medieval and modern', () => {
      for (const phase of phases) {
        if (phase.tip) {
          expect(phase.tip.medieval).toBeTruthy();
          expect(phase.tip.modern).toBeTruthy();
        }
      }
    });
  });
}

describe('Narrator Phase Configurations (Story 5.2)', () => {
  validatePhaseArray('ORACLE_PHASES', ORACLE_PHASES);

  describe('ORACLE_PHASES specifics', () => {
    it('has exactly 5 phases', () => {
      expect(ORACLE_PHASES).toHaveLength(5);
    });

    it('starts at time 0', () => {
      expect(ORACLE_PHASES[0].minTime).toBe(0);
    });

    it('last phase extends to Infinity', () => {
      expect(ORACLE_PHASES[ORACLE_PHASES.length - 1].maxTime).toBe(Infinity);
    });

    it('first two phases have tips', () => {
      expect(ORACLE_PHASES[0].tip).toBeDefined();
      expect(ORACLE_PHASES[1].tip).toBeDefined();
    });

    it('uses Reading for phase 1', () => {
      expect(ORACLE_PHASES[0].avatarState).toBe('reading');
    });

    it('uses Thinking for phase 2', () => {
      expect(ORACLE_PHASES[1].avatarState).toBe('thinking');
    });

    it('uses TracingLines for phase 3', () => {
      expect(ORACLE_PHASES[2].avatarState).toBe('tracingLines');
    });

    it('uses LookingUp for phase 4', () => {
      expect(ORACLE_PHASES[3].avatarState).toBe('lookingUp');
    });

    it('uses Excited for phase 5', () => {
      expect(ORACLE_PHASES[4].avatarState).toBe('excited');
    });
  });

  validatePhaseArray('GENERIC_LOADING_PHASES', GENERIC_LOADING_PHASES);

  describe('GENERIC_LOADING_PHASES specifics', () => {
    it('has exactly 1 phase', () => {
      expect(GENERIC_LOADING_PHASES).toHaveLength(1);
    });

    it('uses Thinking avatar state', () => {
      expect(GENERIC_LOADING_PHASES[0].avatarState).toBe('thinking');
    });
  });

  validatePhaseArray('MATCH_LOADING_PHASES', MATCH_LOADING_PHASES);

  describe('MATCH_LOADING_PHASES specifics', () => {
    it('uses LookingFar avatar state', () => {
      expect(MATCH_LOADING_PHASES[0].avatarState).toBe('lookingFar');
    });
  });

  validatePhaseArray('RESUME_LOADING_PHASES', RESUME_LOADING_PHASES);

  describe('RESUME_LOADING_PHASES specifics', () => {
    it('uses Reading avatar state', () => {
      expect(RESUME_LOADING_PHASES[0].avatarState).toBe('reading');
    });
  });
});
