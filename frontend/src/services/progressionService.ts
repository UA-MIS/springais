import api from './api';

export interface FeatureUnlocks {
  side_quests: boolean;
  guild_rank: boolean;
  advanced_arena: boolean;
  special_title: boolean;
}

export interface CosmeticBrief {
  id: string;
  name: string;
  category: string;
  rarity: string;
}

export interface ProgressionState {
  xp_total: number;
  level: number;
  title: string;
  coin_balance: number;
  login_streak: number;
  last_login_date: string | null;
  adventure_mode_enabled: boolean;
  current_level_xp: number;
  xp_to_next_level: number;
  feature_unlocks: FeatureUnlocks;
  equipped_items: Record<string, CosmeticBrief | null>;
  unlocked_achievements_count: number;
  active_quests_count: number;
  walkthrough_step: number;
  walkthrough_completed: boolean;
  onboarding_complete: boolean;
}

export interface WalkthroughStepResult {
  step: number;
  already_completed: boolean;
  reward: {
    xp_awarded: number;
    coins_awarded: number;
  };
}

export interface CompleteOnboardingResult {
  onboarding_complete: boolean;
  walkthrough_completed: boolean;
}

export interface LoginResult {
  login_streak: number;
  coins_awarded: number;
  streak_bonus: number;
  total_coins_awarded: number;
  achievements_unlocked: Array<{
    id: string;
    name: string;
    description: string;
    xp_reward: number;
    coin_reward: number;
  }>;
  is_new_day: boolean;
}

export interface VisitResult {
  page: string;
  visit_count: number;
  achievements_unlocked: Array<{
    id: string;
    name: string;
    description: string;
    xp_reward: number;
    coin_reward: number;
  }>;
}

// Standardized React Query keys (Story 8.3)
export const QUERY_KEYS = {
  progression: ['progression'] as const,
  achievementsCatalog: ['achievements', 'catalog'] as const,
  storeCatalog: ['store', 'catalog'] as const,
  storeInventory: ['store', 'inventory'] as const,
  questsCatalog: ['quests', 'catalog'] as const,
  questsActive: ['quests', 'active'] as const,
  storeCatalogWith: (params: { category?: string; rarity?: string }) =>
    ['store', 'catalog', params] as const,
};

export const progressionApi = {
  getProgression: () =>
    api.get<ProgressionState>('/progression').then((r) => r.data),

  toggleAdventureMode: () =>
    api
      .post<{ adventure_mode_enabled: boolean }>('/progression/toggle-adventure-mode')
      .then((r) => r.data),

  recordLogin: () =>
    api.post<LoginResult>('/progression/login').then((r) => r.data),

  recordVisit: (page: string) =>
    api.post<VisitResult>('/progression/visit', { page }).then((r) => r.data),

  getHistory: (type: 'event' | 'transaction', limit = 50, offset = 0) =>
    api
      .get('/progression/history', { params: { type, limit, offset } })
      .then((r) => r.data),

  completeWalkthroughStep: (step: number) =>
    api
      .post<WalkthroughStepResult>('/progression/walkthrough-step', { step })
      .then((r) => r.data),

  completeOnboarding: () =>
    api
      .post<CompleteOnboardingResult>('/progression/complete-onboarding')
      .then((r) => r.data),
};
