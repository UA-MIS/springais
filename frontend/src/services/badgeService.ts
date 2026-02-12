import api from './api';

export interface Badge {
  id: string;
  name: string;
  issuer: string;
  platform: string;
  url: string;
  image_url?: string;
  skills: string[];
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimated_cost_usd?: number;
  estimated_hours?: number;
  renewal_months?: number;
  relevance_score: number;
  mapping_source: 'curated' | 'api' | 'ai';
}

export interface BadgeDiscoverResponse {
  badges: Badge[];
  total_count: number;
  page: number;
  per_page: number;
  skills_queried: string[];
}

export async function discoverBadges(
  skills: string[],
  page: number = 1,
  perPage: number = 20
): Promise<BadgeDiscoverResponse> {
  const response = await api.get('/badges/discover', {
    params: { skills: skills.join(','), page, per_page: perPage }
  });
  return response.data;
}

export async function getBadge(badgeId: string): Promise<Badge> {
  const response = await api.get(`/badges/${badgeId}`);
  return response.data;
}

export async function recordInteraction(
  badgeId: string,
  interactionType: 'click' | 'thumbs_up' | 'thumbs_down',
  source: 'skill_module' | 'roadmap' | 'search'
): Promise<void> {
  await api.post('/badges/interactions', {
    badge_id: badgeId,
    interaction_type: interactionType,
    source,
  });
}

export async function markBadgeEarned(
  badgeId: string,
  earnedDate?: string
): Promise<{ id: string; badge_id: string; earned_date: string }> {
  const response = await api.post('/badges/earned', {
    badge_id: badgeId,
    earned_date: earnedDate,
  });
  return response.data;
}

export async function searchCatalog(
  query: string,
  limit: number = 10
): Promise<{ results: Badge[]; count: number }> {
  const response = await api.get('/badges/catalog/search', {
    params: { q: query, limit }
  });
  return response.data;
}
