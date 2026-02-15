import { describe, it, expect } from 'vitest';
import { QUERY_KEYS } from './progressionService';

describe('progressionService - Query Keys (Story 8.3)', () => {
  it('exports standardized query keys', () => {
    expect(QUERY_KEYS.progression).toEqual(['progression']);
    expect(QUERY_KEYS.achievementsCatalog).toEqual(['achievements', 'catalog']);
    expect(QUERY_KEYS.storeCatalog).toEqual(['store', 'catalog']);
    expect(QUERY_KEYS.storeInventory).toEqual(['store', 'inventory']);
    expect(QUERY_KEYS.questsCatalog).toEqual(['quests', 'catalog']);
    expect(QUERY_KEYS.questsActive).toEqual(['quests', 'active']);
  });

  it('storeCatalog key factory accepts category and rarity params', () => {
    const key = QUERY_KEYS.storeCatalogWith({ category: 'armor', rarity: 'epic' });
    expect(key).toEqual(['store', 'catalog', { category: 'armor', rarity: 'epic' }]);
  });
});
