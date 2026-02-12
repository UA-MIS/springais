import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the api module
const mockGet = vi.fn();
const mockPost = vi.fn();
vi.mock('./api', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

import {
  discoverBadges,
  getBadge,
  recordInteraction,
  markBadgeEarned,
  searchCatalog,
} from './badgeService';

describe('badgeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('discoverBadges', () => {
    it('calls GET /badges/discover with correct params', async () => {
      mockGet.mockResolvedValue({
        data: { badges: [], total_count: 0, page: 1, per_page: 20, skills_queried: ['azure'] },
      });

      const result = await discoverBadges(['azure', 'python'], 1, 10);

      expect(mockGet).toHaveBeenCalledWith('/badges/discover', {
        params: { skills: 'azure,python', page: 1, per_page: 10 },
      });
      expect(result.skills_queried).toEqual(['azure']);
    });

    it('uses default page and perPage', async () => {
      mockGet.mockResolvedValue({ data: { badges: [], total_count: 0, page: 1, per_page: 20, skills_queried: [] } });

      await discoverBadges(['azure']);

      expect(mockGet).toHaveBeenCalledWith('/badges/discover', {
        params: { skills: 'azure', page: 1, per_page: 20 },
      });
    });
  });

  describe('getBadge', () => {
    it('calls GET /badges/{badgeId}', async () => {
      const mockBadge = { id: 'badge-1', name: 'Test' };
      mockGet.mockResolvedValue({ data: mockBadge });

      const result = await getBadge('badge-1');

      expect(mockGet).toHaveBeenCalledWith('/badges/badge-1');
      expect(result).toEqual(mockBadge);
    });
  });

  describe('recordInteraction', () => {
    it('calls POST /badges/interactions with correct body', async () => {
      mockPost.mockResolvedValue({ data: { recorded: true } });

      await recordInteraction('badge-1', 'click', 'roadmap');

      expect(mockPost).toHaveBeenCalledWith('/badges/interactions', {
        badge_id: 'badge-1',
        interaction_type: 'click',
        source: 'roadmap',
      });
    });

    it('supports thumbs_up interaction type', async () => {
      mockPost.mockResolvedValue({ data: { recorded: true } });

      await recordInteraction('badge-1', 'thumbs_up', 'skill_module');

      expect(mockPost).toHaveBeenCalledWith('/badges/interactions', {
        badge_id: 'badge-1',
        interaction_type: 'thumbs_up',
        source: 'skill_module',
      });
    });
  });

  describe('markBadgeEarned', () => {
    it('calls POST /badges/earned', async () => {
      mockPost.mockResolvedValue({
        data: { id: 'ub-1', badge_id: 'badge-1', earned_date: '2026-01-15T00:00:00Z' },
      });

      const result = await markBadgeEarned('badge-1', '2026-01-15T00:00:00Z');

      expect(mockPost).toHaveBeenCalledWith('/badges/earned', {
        badge_id: 'badge-1',
        earned_date: '2026-01-15T00:00:00Z',
      });
      expect(result.badge_id).toBe('badge-1');
    });

    it('sends undefined earned_date when not provided', async () => {
      mockPost.mockResolvedValue({
        data: { id: 'ub-1', badge_id: 'badge-1', earned_date: '2026-02-11T00:00:00Z' },
      });

      await markBadgeEarned('badge-1');

      expect(mockPost).toHaveBeenCalledWith('/badges/earned', {
        badge_id: 'badge-1',
        earned_date: undefined,
      });
    });
  });

  describe('searchCatalog', () => {
    it('calls GET /badges/catalog/search with correct params', async () => {
      mockGet.mockResolvedValue({
        data: { results: [{ id: 'badge-1', name: 'Azure' }], count: 1 },
      });

      const result = await searchCatalog('Azure', 5);

      expect(mockGet).toHaveBeenCalledWith('/badges/catalog/search', {
        params: { q: 'Azure', limit: 5 },
      });
      expect(result.count).toBe(1);
    });

    it('uses default limit of 10', async () => {
      mockGet.mockResolvedValue({ data: { results: [], count: 0 } });

      await searchCatalog('test');

      expect(mockGet).toHaveBeenCalledWith('/badges/catalog/search', {
        params: { q: 'test', limit: 10 },
      });
    });
  });
});
