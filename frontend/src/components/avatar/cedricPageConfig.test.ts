import { describe, it, expect } from 'vitest';
import {
  PAGE_CONFIGS,
  PageConfig,
  ProactiveSuggestion,
} from './cedricPageConfig';

const ALL_ROUTES = [
  '/matches',
  '/profile',
  '/saved',
  '/roadmap',
  '/store',
  '/quests',
  '/success-patterns',
];

describe('cedricPageConfig (Story 6.1)', () => {
  describe('PAGE_CONFIGS completeness', () => {
    it('has entries for all 7 routes', () => {
      for (const route of ALL_ROUTES) {
        expect(PAGE_CONFIGS[route]).toBeDefined();
      }
    });

    it('has no extra unexpected routes', () => {
      const configKeys = Object.keys(PAGE_CONFIGS);
      expect(configKeys.length).toBe(7);
      for (const key of configKeys) {
        expect(ALL_ROUTES).toContain(key);
      }
    });
  });

  describe('PageConfig structure', () => {
    for (const route of ALL_ROUTES) {
      describe(`${route}`, () => {
        it('has firstVisitMessage with both variants', () => {
          const config = PAGE_CONFIGS[route];
          expect(config.firstVisitMessage).toBeDefined();
          expect(typeof config.firstVisitMessage.medieval).toBe('string');
          expect(typeof config.firstVisitMessage.modern).toBe('string');
          expect(config.firstVisitMessage.medieval.length).toBeGreaterThan(0);
          expect(config.firstVisitMessage.modern.length).toBeGreaterThan(0);
        });

        it('has firstVisitAvatarState', () => {
          const config = PAGE_CONFIGS[route];
          expect(typeof config.firstVisitAvatarState).toBe('string');
        });

        it('has returnMessages with at least one entry, each with both variants', () => {
          const config = PAGE_CONFIGS[route];
          expect(config.returnMessages.length).toBeGreaterThanOrEqual(1);
          for (const msg of config.returnMessages) {
            expect(typeof msg.medieval).toBe('string');
            expect(typeof msg.modern).toBe('string');
            expect(msg.medieval.length).toBeGreaterThan(0);
            expect(msg.modern.length).toBeGreaterThan(0);
          }
        });

        it('has returnAvatarState', () => {
          const config = PAGE_CONFIGS[route];
          expect(typeof config.returnAvatarState).toBe('string');
        });
      });
    }
  });

  describe('/matches specific config', () => {
    it('has first-visit message about Quest Board', () => {
      const config = PAGE_CONFIGS['/matches'];
      expect(config.firstVisitMessage.medieval).toContain('Quest Board');
      expect(config.firstVisitMessage.modern).toContain('matched roles');
    });

    it('has return message about scouting', () => {
      const config = PAGE_CONFIGS['/matches'];
      expect(config.returnMessages[0].medieval).toContain('scout');
    });

    it('has emptyStateMessage about empty Quest Board', () => {
      const config = PAGE_CONFIGS['/matches'];
      expect(config.emptyStateMessage).toBeDefined();
      expect(config.emptyStateMessage!.medieval).toContain('Quest Board');
      expect(config.emptyStateMessage!.medieval).toContain('empty');
      expect(config.emptyStateMessage!.modern).toContain('resume');
    });

    it('has emptyStateAvatarState', () => {
      const config = PAGE_CONFIGS['/matches'];
      expect(config.emptyStateAvatarState).toBeDefined();
    });
  });

  describe('/profile specific config', () => {
    it('has first-visit message about Hero Sheet', () => {
      const config = PAGE_CONFIGS['/profile'];
      expect(config.firstVisitMessage.medieval).toContain('Hero Sheet');
      expect(config.firstVisitMessage.modern).toContain('profile');
    });

    it('has return message about updating', () => {
      const config = PAGE_CONFIGS['/profile'];
      const hasUpdate = config.returnMessages.some(
        (m) => m.medieval.includes('Updating') || m.medieval.includes('scroll')
      );
      expect(hasUpdate).toBe(true);
    });

    it('has emptyStateMessage about incomplete profile', () => {
      const config = PAGE_CONFIGS['/profile'];
      expect(config.emptyStateMessage).toBeDefined();
      expect(config.emptyStateMessage!.medieval).toContain('Hero Sheet');
    });
  });

  describe('/store specific config', () => {
    it('has return message about wares', () => {
      const config = PAGE_CONFIGS['/store'];
      const hasWares = config.returnMessages.some(
        (m) => m.medieval.includes('wares') || m.medieval.includes('Grimshaw')
      );
      expect(hasWares).toBe(true);
    });

    it('has proactive suggestion for affordable items', () => {
      const config = PAGE_CONFIGS['/store'];
      expect(config.proactiveSuggestions).toBeDefined();
      expect(config.proactiveSuggestions!.length).toBeGreaterThanOrEqual(1);
      const affordableSuggestion = config.proactiveSuggestions!.find(
        (s) => s.id === 'store-gold-high'
      );
      expect(affordableSuggestion).toBeDefined();
    });
  });

  describe('ProactiveSuggestion interface', () => {
    it('store suggestion has correct structure', () => {
      const config = PAGE_CONFIGS['/store'];
      const suggestion = config.proactiveSuggestions![0];
      expect(suggestion.id).toBeDefined();
      expect(['idle_time', 'data_condition']).toContain(suggestion.trigger);
      expect(suggestion.message).toBeDefined();
      expect(typeof suggestion.message.medieval).toBe('string');
      expect(typeof suggestion.message.modern).toBe('string');
      expect(typeof suggestion.avatarState).toBe('string');
    });

    it('data_condition suggestions have a condition function', () => {
      const config = PAGE_CONFIGS['/store'];
      const dataSuggestions = config.proactiveSuggestions!.filter(
        (s) => s.trigger === 'data_condition'
      );
      for (const s of dataSuggestions) {
        expect(typeof s.condition).toBe('function');
      }
    });

    it('store gold-high suggestion fires when gold > 500', () => {
      const config = PAGE_CONFIGS['/store'];
      const suggestion = config.proactiveSuggestions!.find(
        (s) => s.id === 'store-gold-high'
      );
      expect(suggestion!.condition!({ gold: 600, level: 1, daysAway: 0 })).toBe(true);
      expect(suggestion!.condition!({ gold: 300, level: 1, daysAway: 0 })).toBe(false);
    });
  });

  describe('Roadmap proactive suggestion', () => {
    it('has proactive suggestion for uncompleted milestones', () => {
      const config = PAGE_CONFIGS['/roadmap'];
      expect(config.proactiveSuggestions).toBeDefined();
      const milestoneSuggestion = config.proactiveSuggestions!.find(
        (s) => s.id === 'roadmap-milestones'
      );
      expect(milestoneSuggestion).toBeDefined();
      expect(milestoneSuggestion!.message.medieval.length).toBeGreaterThan(0);
    });
  });

  describe('Matches proactive suggestion', () => {
    it('has proactive suggestion for days away', () => {
      const config = PAGE_CONFIGS['/matches'];
      expect(config.proactiveSuggestions).toBeDefined();
      const daysSuggestion = config.proactiveSuggestions!.find(
        (s) => s.id === 'matches-days-away'
      );
      expect(daysSuggestion).toBeDefined();
      expect(daysSuggestion!.condition!({ gold: 0, level: 1, daysAway: 4 })).toBe(true);
      expect(daysSuggestion!.condition!({ gold: 0, level: 1, daysAway: 1 })).toBe(false);
    });
  });
});
