import { describe, it, expect } from 'vitest';
import { WALKTHROUGH_STEPS, TOTAL_STEPS } from './walkthroughSteps';
import type { WalkthroughStepData } from './walkthroughSteps';
import { WALKTHROUGH_MESSAGES } from './cedricMessages';

describe('walkthroughSteps (Story 2.2)', () => {
  it('defines exactly 7 steps', () => {
    expect(WALKTHROUGH_STEPS).toHaveLength(7);
    expect(TOTAL_STEPS).toBe(7);
  });

  it('all steps have valid target selectors', () => {
    for (const step of WALKTHROUGH_STEPS) {
      expect(typeof step.target).toBe('string');
      expect((step.target as string).length).toBeGreaterThan(0);
    }
  });

  it('all steps have content text', () => {
    for (const step of WALKTHROUGH_STEPS) {
      expect(typeof step.content).toBe('string');
      expect((step.content as string).length).toBeGreaterThan(0);
    }
  });

  it('all steps have valid WalkthroughStepData', () => {
    const validDetections = ['navigation', 'action', 'timer', 'element-click'];
    for (const step of WALKTHROUGH_STEPS) {
      const data = step.data as WalkthroughStepData;
      expect(data).toBeDefined();
      expect(data.avatarState).toBeDefined();
      expect(typeof data.rewardXP).toBe('number');
      expect(typeof data.rewardGold).toBe('number');
      expect(validDetections).toContain(data.completionDetection);
    }
  });

  it('timer-based steps have completionTimer set', () => {
    for (const step of WALKTHROUGH_STEPS) {
      const data = step.data as WalkthroughStepData;
      if (data.completionDetection === 'timer') {
        expect(typeof data.completionTimer).toBe('number');
        expect(data.completionTimer).toBeGreaterThan(0);
      }
    }
  });

  it('navigation-based steps have targetRoute set', () => {
    for (const step of WALKTHROUGH_STEPS) {
      const data = step.data as WalkthroughStepData;
      if (data.completionDetection === 'navigation') {
        expect(typeof data.targetRoute).toBe('string');
      }
    }
  });

  it('has matching dialogue for all 7 steps in cedricMessages', () => {
    expect(WALKTHROUGH_MESSAGES.steps).toHaveLength(7);
    for (let i = 0; i < 7; i++) {
      expect(WALKTHROUGH_MESSAGES.steps[i].medieval).toBeTruthy();
      expect(WALKTHROUGH_MESSAGES.steps[i].modern).toBeTruthy();
    }
  });

  it('step 0 targets nav-profile', () => {
    expect(WALKTHROUGH_STEPS[0].target).toBe('[data-tour="nav-profile"]');
  });

  it('step 1 targets nav-matches', () => {
    expect(WALKTHROUGH_STEPS[1].target).toBe('[data-tour="nav-matches"]');
  });

  it('step 4 targets nav-store', () => {
    expect(WALKTHROUGH_STEPS[4].target).toBe('[data-tour="nav-store"]');
  });

  it('step 6 targets body for closing step', () => {
    expect(WALKTHROUGH_STEPS[6].target).toBe('body');
  });

  it('all steps have disableBeacon set to true', () => {
    for (const step of WALKTHROUGH_STEPS) {
      expect(step.disableBeacon).toBe(true);
    }
  });
});
