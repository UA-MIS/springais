import { describe, it, expect } from 'vitest';
import {
  getCedricText,
  MessageVariant,
  WALKTHROUGH_MESSAGES,
  PAGE_MESSAGES,
  ERROR_MESSAGE,
  LOADING_MESSAGES,
} from './cedricMessages';

describe('cedricMessages', () => {
  // -----------------------------------------------------------------------
  // getCedricText helper
  // -----------------------------------------------------------------------

  describe('getCedricText', () => {
    const variant: MessageVariant = {
      medieval: 'Hail, traveler!',
      modern: 'Hello!',
    };

    it('returns medieval text when adventure enabled', () => {
      expect(getCedricText(variant, true)).toBe('Hail, traveler!');
    });

    it('returns modern text when adventure disabled', () => {
      expect(getCedricText(variant, false)).toBe('Hello!');
    });
  });

  // -----------------------------------------------------------------------
  // Walkthrough messages existence & brevity
  // -----------------------------------------------------------------------

  describe('Walkthrough messages', () => {
    it('has intro message', () => {
      expect(WALKTHROUGH_MESSAGES.intro.medieval).toBeTruthy();
      expect(WALKTHROUGH_MESSAGES.intro.modern).toBeTruthy();
    });

    it('has maybe-later messages', () => {
      expect(WALKTHROUGH_MESSAGES.maybeLater.medieval).toBeTruthy();
      expect(WALKTHROUGH_MESSAGES.maybeLaterExplore.medieval).toBeTruthy();
    });

    it('has 7 walkthrough step messages', () => {
      expect(WALKTHROUGH_MESSAGES.steps).toHaveLength(7);
    });

    it('has completion message', () => {
      expect(WALKTHROUGH_MESSAGES.completion.medieval).toBeTruthy();
      expect(WALKTHROUGH_MESSAGES.completion.modern).toBeTruthy();
    });

    it('all walkthrough messages are at most 2 sentences', () => {
      const allMessages = [
        WALKTHROUGH_MESSAGES.intro,
        WALKTHROUGH_MESSAGES.maybeLater,
        WALKTHROUGH_MESSAGES.maybeLaterExplore,
        WALKTHROUGH_MESSAGES.completion,
        ...WALKTHROUGH_MESSAGES.steps,
      ];
      for (const msg of allMessages) {
        // Count sentences by splitting on sentence-ending punctuation followed by space or end
        const medievalSentences = msg.medieval.split(/[.!?]+\s*/g).filter(Boolean);
        const modernSentences = msg.modern.split(/[.!?]+\s*/g).filter(Boolean);
        expect(medievalSentences.length).toBeLessThanOrEqual(2);
        expect(modernSentences.length).toBeLessThanOrEqual(2);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Page-specific messages
  // -----------------------------------------------------------------------

  describe('Page-specific messages', () => {
    const requiredPages = [
      '/matches',
      '/profile',
      '/saved',
      '/roadmap',
      '/store',
      '/quests',
      '/success-patterns',
    ];

    it.each(requiredPages)('has first-visit message for %s', (page) => {
      const config = PAGE_MESSAGES[page as keyof typeof PAGE_MESSAGES];
      expect(config).toBeDefined();
      expect(config.firstVisit.medieval).toBeTruthy();
      expect(config.firstVisit.modern).toBeTruthy();
    });

    it.each(requiredPages)('has return messages for %s', (page) => {
      const config = PAGE_MESSAGES[page as keyof typeof PAGE_MESSAGES];
      expect(config).toBeDefined();
      expect(config.return.length).toBeGreaterThanOrEqual(1);
    });
  });

  // -----------------------------------------------------------------------
  // Error & loading messages
  // -----------------------------------------------------------------------

  describe('Error and loading messages', () => {
    it('has error message with both variants', () => {
      expect(ERROR_MESSAGE.medieval).toContain('awry');
      expect(ERROR_MESSAGE.modern).toContain('wrong');
    });

    it('has generic loading message', () => {
      expect(LOADING_MESSAGES.generic.medieval).toBeTruthy();
      expect(LOADING_MESSAGES.generic.modern).toBeTruthy();
    });

    it('has 5 oracle phases', () => {
      expect(LOADING_MESSAGES.oraclePhases).toHaveLength(5);
    });

    it('all oracle phases have both variants', () => {
      for (const phase of LOADING_MESSAGES.oraclePhases) {
        expect(phase.medieval).toBeTruthy();
        expect(phase.modern).toBeTruthy();
      }
    });
  });
});
