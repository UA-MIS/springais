import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CedricProvider, useCedric, AnimationState } from '../../context/CedricContext';
import { AvatarCompanion } from './index';

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@test.com' },
    token: 'test-token',
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
  }),
}));

// Control adventure mode state for tests
let adventureModeEnabled = true;

vi.mock('../../context/AdventureModeContext', () => ({
  useAdventureMode: () => ({
    state: {
      enabled: adventureModeEnabled,
      totalXP: 100,
      gold: 50,
      level: 1,
      currentXP: 50,
      xpToNextLevel: 200,
      title: 'Apprentice',
      loginStreak: 1,
      lastLoginDate: null,
      loading: false,
      unlockedAchievementsCount: 0,
      unlockedAchievements: [],
      completedSkillsCount: 0,
      visitedPages: [],
      recentXPGain: null,
      recentGoldGain: null,
      recentAchievement: null,
      levelUpPending: false,
      newLevel: null,
      newTitle: null,
      levelUpCoinBonus: null,
      unlockedFeatures: [],
      recentQuestComplete: null,
    },
    toggleAdventureMode: vi.fn(),
    enableAdventureMode: vi.fn(),
    disableAdventureMode: vi.fn(),
    addXP: vi.fn(),
    addGold: vi.fn(),
    spendGold: vi.fn(),
    unlockAchievement: vi.fn(),
    getAchievements: vi.fn(),
    isAchievementUnlocked: vi.fn(),
    incrementSkillsCompleted: vi.fn(),
    trackPageVisit: vi.fn(),
    recordLogin: vi.fn(),
    recordVisit: vi.fn(),
    clearRecentXP: vi.fn(),
    clearRecentGold: vi.fn(),
    clearRecentAchievement: vi.fn(),
    clearLevelUp: vi.fn(),
    clearQuestComplete: vi.fn(),
  }),
  AdventureModeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock progression API
vi.mock('../../services/progressionService', () => ({
  progressionApi: {
    getProgression: vi.fn().mockResolvedValue({
      xp_total: 100,
      level: 1,
      title: 'Apprentice',
      coin_balance: 50,
      login_streak: 1,
      last_login_date: null,
      adventure_mode_enabled: true,
      current_level_xp: 50,
      xp_to_next_level: 200,
      feature_unlocks: { side_quests: false, guild_rank: false, advanced_arena: false, special_title: false },
      equipped_items: {},
      unlocked_achievements_count: 0,
      active_quests_count: 0,
    }),
    toggleAdventureMode: vi.fn(),
    recordLogin: vi.fn(),
    recordVisit: vi.fn(),
    getHistory: vi.fn(),
  },
  QUERY_KEYS: {
    progression: ['progression'],
    achievementsCatalog: ['achievements', 'catalog'],
    storeCatalog: ['store', 'catalog'],
    storeInventory: ['store', 'inventory'],
    questsCatalog: ['quests', 'catalog'],
    questsActive: ['quests', 'active'],
    storeCatalogWith: (params: unknown) => ['store', 'catalog', params],
  },
}));

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'game',
    isGame: true,
    isDark: false,
  }),
}));

function renderIntegration(route = '/matches') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <CedricProvider>
          <AvatarCompanion />
        </CedricProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('AvatarCompanion Integration', () => {
  beforeEach(() => {
    adventureModeEnabled = true;
    vi.clearAllMocks();
  });

  it('renders avatar within CedricProvider when adventure mode is enabled', () => {
    renderIntegration();
    expect(screen.getByTestId('cedric-companion')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-sprite')).toBeInTheDocument();
    expect(screen.getByTestId('pedestal')).toBeInTheDocument();
    expect(screen.getByTestId('nameplate')).toBeInTheDocument();
  });

  it('renders nothing when adventure mode is off and user is not new', () => {
    adventureModeEnabled = false;
    const { container } = renderIntegration();
    expect(container.innerHTML).toBe('');
  });

  it('renders without console errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderIntegration();
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('useCedric hook is accessible within the provider tree', () => {
    let hookResult: ReturnType<typeof useCedric> | null = null;
    function HookConsumer() {
      hookResult = useCedric();
      return null;
    }

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CedricProvider>
            <HookConsumer />
          </CedricProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(hookResult).not.toBeNull();
    expect(hookResult!.state.visibility).toBe('full');
    expect(hookResult!.state.animationState).toBe(AnimationState.Idle);
  });
});
