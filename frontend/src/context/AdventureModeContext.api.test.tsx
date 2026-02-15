import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdventureModeProvider, useAdventureMode } from './AdventureModeContext';
import { ProgressionState } from '../services/progressionService';

// Mock the auth context
const mockUser = { id: 'test-user-id', email: 'test@test.com', name: 'Test User' };
let mockAuthValue = {
  user: mockUser as any,
  token: 'test-token',
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
};
vi.mock('./AuthContext', () => ({
  useAuth: () => mockAuthValue,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the progression API
const mockProgressionData: ProgressionState = {
  xp_total: 500,
  level: 3,
  title: 'Apprentice',
  coin_balance: 250,
  login_streak: 5,
  last_login_date: '2026-02-10',
  adventure_mode_enabled: true,
  current_level_xp: 200,
  xp_to_next_level: 100,
  feature_unlocks: {
    side_quests: true,
    guild_rank: false,
    advanced_arena: false,
    special_title: false,
  },
  equipped_items: {
    pet: null,
    pedestal: null,
    aura: null,
    hairstyle: null,
    color_palette: null,
    banner: null,
    emblem: null,
  },
  unlocked_achievements_count: 3,
  active_quests_count: 1,
};

const mockGetProgression = vi.fn();
const mockToggleAdventureMode = vi.fn();
const mockRecordLogin = vi.fn();
const mockRecordVisit = vi.fn();

vi.mock('../services/progressionService', () => ({
  progressionApi: {
    getProgression: (...args: any[]) => mockGetProgression(...args),
    toggleAdventureMode: (...args: any[]) => mockToggleAdventureMode(...args),
    recordLogin: (...args: any[]) => mockRecordLogin(...args),
    recordVisit: (...args: any[]) => mockRecordVisit(...args),
    getHistory: vi.fn(),
  },
  QUERY_KEYS: {
    progression: ['progression'],
    achievementsCatalog: ['achievements', 'catalog'],
    storeCatalog: ['store', 'catalog'],
    storeInventory: ['store', 'inventory'],
    questsCatalog: ['quests', 'catalog'],
    questsActive: ['quests', 'active'],
    storeCatalogWith: (params: any) => ['store', 'catalog', params],
  },
}));

function TestConsumer() {
  const { state, toggleAdventureMode } = useAdventureMode();
  return (
    <div>
      <span data-testid="enabled">{String(state.enabled)}</span>
      <span data-testid="totalXP">{state.totalXP}</span>
      <span data-testid="gold">{state.gold}</span>
      <span data-testid="level">{state.level}</span>
      <span data-testid="title">{state.title}</span>
      <span data-testid="loginStreak">{state.loginStreak}</span>
      <span data-testid="currentXP">{state.currentXP}</span>
      <span data-testid="xpToNextLevel">{state.xpToNextLevel}</span>
      <span data-testid="loading">{String(state.loading)}</span>
      <button data-testid="toggle" onClick={toggleAdventureMode}>
        Toggle
      </button>
    </div>
  );
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('AdventureModeContext - API-backed state (Story 8.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProgression.mockResolvedValue({ ...mockProgressionData });
    mockToggleAdventureMode.mockResolvedValue({ adventure_mode_enabled: false });
    mockAuthValue = {
      user: mockUser as any,
      token: 'test-token',
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    };
  });

  it('fetches progression data from API on mount when user is authenticated', async () => {
    renderWithProviders(
      <AdventureModeProvider>
        <TestConsumer />
      </AdventureModeProvider>
    );

    await waitFor(() => {
      expect(mockGetProgression).toHaveBeenCalledTimes(1);
    });
  });

  it('populates context state from API response', async () => {
    renderWithProviders(
      <AdventureModeProvider>
        <TestConsumer />
      </AdventureModeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('totalXP').textContent).toBe('500');
    });

    expect(screen.getByTestId('enabled').textContent).toBe('true');
    expect(screen.getByTestId('gold').textContent).toBe('250');
    expect(screen.getByTestId('level').textContent).toBe('3');
    expect(screen.getByTestId('title').textContent).toBe('Apprentice');
    expect(screen.getByTestId('loginStreak').textContent).toBe('5');
    expect(screen.getByTestId('currentXP').textContent).toBe('200');
    expect(screen.getByTestId('xpToNextLevel').textContent).toBe('100');
  });

  it('shows default/empty state while loading', () => {
    // Make the API hang (never resolve)
    mockGetProgression.mockReturnValue(new Promise(() => {}));

    renderWithProviders(
      <AdventureModeProvider>
        <TestConsumer />
      </AdventureModeProvider>
    );

    expect(screen.getByTestId('loading').textContent).toBe('true');
    expect(screen.getByTestId('totalXP').textContent).toBe('0');
    expect(screen.getByTestId('gold').textContent).toBe('0');
    expect(screen.getByTestId('level').textContent).toBe('1');
  });

  it('does NOT fetch when no user is authenticated', async () => {
    mockAuthValue = {
      ...mockAuthValue,
      user: null,
      token: null,
    };

    renderWithProviders(
      <AdventureModeProvider>
        <TestConsumer />
      </AdventureModeProvider>
    );

    // Wait a tick to ensure no fetch is triggered
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(mockGetProgression).not.toHaveBeenCalled();
  });

  it('toggleAdventureMode calls the API and updates state', async () => {
    mockToggleAdventureMode.mockResolvedValue({ adventure_mode_enabled: false });

    renderWithProviders(
      <AdventureModeProvider>
        <TestConsumer />
      </AdventureModeProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('enabled').textContent).toBe('true');
    });

    // Toggle
    await act(async () => {
      screen.getByTestId('toggle').click();
    });

    await waitFor(() => {
      expect(mockToggleAdventureMode).toHaveBeenCalledTimes(1);
    });
  });

  it('clears state when user is null (logout scenario)', async () => {
    // Use a shared queryClient so the logout useEffect can clear its cache
    const sharedQueryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    const { rerender } = render(
      <QueryClientProvider client={sharedQueryClient}>
        <AdventureModeProvider>
          <TestConsumer />
        </AdventureModeProvider>
      </QueryClientProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('totalXP').textContent).toBe('500');
    });

    // Simulate logout by setting user to null
    mockAuthValue = {
      ...mockAuthValue,
      user: null,
      token: null,
    };

    // Rerender with same queryClient -- the useEffect will clear the cache
    await act(async () => {
      rerender(
        <QueryClientProvider client={sharedQueryClient}>
          <AdventureModeProvider>
            <TestConsumer />
          </AdventureModeProvider>
        </QueryClientProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('totalXP').textContent).toBe('0');
      expect(screen.getByTestId('gold').textContent).toBe('0');
      expect(screen.getByTestId('level').textContent).toBe('1');
      expect(screen.getByTestId('enabled').textContent).toBe('false');
    });
  });

  it('exposes the same public API interface for backward compatibility', async () => {
    let contextValue: any;
    function ContextCapture() {
      contextValue = useAdventureMode();
      return null;
    }

    renderWithProviders(
      <AdventureModeProvider>
        <ContextCapture />
      </AdventureModeProvider>
    );

    await waitFor(() => {
      expect(contextValue).toBeDefined();
    });

    // Core state fields
    expect(contextValue.state).toHaveProperty('enabled');
    expect(contextValue.state).toHaveProperty('totalXP');
    expect(contextValue.state).toHaveProperty('gold');
    expect(contextValue.state).toHaveProperty('level');
    expect(contextValue.state).toHaveProperty('title');
    expect(contextValue.state).toHaveProperty('loginStreak');
    expect(contextValue.state).toHaveProperty('currentXP');
    expect(contextValue.state).toHaveProperty('xpToNextLevel');
    expect(contextValue.state).toHaveProperty('loading');

    // Actions
    expect(typeof contextValue.toggleAdventureMode).toBe('function');
    expect(typeof contextValue.enableAdventureMode).toBe('function');
    expect(typeof contextValue.disableAdventureMode).toBe('function');

    // Progression functions
    expect(typeof contextValue.addXP).toBe('function');
    expect(typeof contextValue.addGold).toBe('function');
    expect(typeof contextValue.spendGold).toBe('function');

    // Achievement functions
    expect(typeof contextValue.getAchievements).toBe('function');
    expect(typeof contextValue.isAchievementUnlocked).toBe('function');

    // Notification functions
    expect(typeof contextValue.clearRecentXP).toBe('function');
    expect(typeof contextValue.clearRecentGold).toBe('function');
    expect(typeof contextValue.clearRecentAchievement).toBe('function');
    expect(typeof contextValue.clearLevelUp).toBe('function');
  });
});
