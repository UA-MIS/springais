import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdventureModeProvider, useAdventureMode } from './AdventureModeContext';
import { ProgressionState } from '../services/progressionService';

// Mock AuthContext
const mockUser = { id: 'test-user-id', email: 'test@test.com', name: 'Test User' };
vi.mock('./AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    token: 'test-token',
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock progression API
const baseProgression: ProgressionState = {
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
  equipped_items: {},
  unlocked_achievements_count: 3,
  active_quests_count: 1,
};

const mockGetProgression = vi.fn();
const mockRecordLogin = vi.fn();
const mockRecordVisit = vi.fn();

vi.mock('../services/progressionService', () => ({
  progressionApi: {
    getProgression: (...args: any[]) => mockGetProgression(...args),
    toggleAdventureMode: vi.fn().mockResolvedValue({ adventure_mode_enabled: false }),
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
  const { state, recordLogin, recordVisit } = useAdventureMode();
  return (
    <div>
      <span data-testid="totalXP">{state.totalXP}</span>
      <span data-testid="gold">{state.gold}</span>
      <span data-testid="loginStreak">{state.loginStreak}</span>
      <button data-testid="login" onClick={() => recordLogin()}>
        Login
      </button>
      <button data-testid="visit" onClick={() => recordVisit('/matches')}>
        Visit
      </button>
    </div>
  );
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

describe('AdventureModeContext - Mutation hooks (Story 8.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProgression.mockResolvedValue({ ...baseProgression });
  });

  it('recordLogin calls the API and invalidates progression query', async () => {
    mockRecordLogin.mockResolvedValue({
      login_streak: 6,
      coins_awarded: 10,
      streak_bonus: 0,
      total_coins_awarded: 10,
      achievements_unlocked: [],
      is_new_day: true,
    });

    // After login, the progression query should refetch with updated data
    const updatedProgression = {
      ...baseProgression,
      login_streak: 6,
      coin_balance: 260,
    };

    const qc = createQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <AdventureModeProvider>
          <TestConsumer />
        </AdventureModeProvider>
      </QueryClientProvider>
    );

    // Wait for initial data
    await waitFor(() => {
      expect(screen.getByTestId('loginStreak').textContent).toBe('5');
    });

    // Update mock for refetch after mutation
    mockGetProgression.mockResolvedValue(updatedProgression);

    // Trigger login
    await act(async () => {
      screen.getByTestId('login').click();
    });

    expect(mockRecordLogin).toHaveBeenCalledTimes(1);

    // After mutation + invalidation + refetch, data should update
    await waitFor(() => {
      expect(screen.getByTestId('loginStreak').textContent).toBe('6');
    });
  });

  it('recordVisit calls the API and invalidates progression query', async () => {
    mockRecordVisit.mockResolvedValue({
      page: '/matches',
      visit_count: 2,
      achievements_unlocked: [],
    });

    const qc = createQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <AdventureModeProvider>
          <TestConsumer />
        </AdventureModeProvider>
      </QueryClientProvider>
    );

    // Wait for initial data
    await waitFor(() => {
      expect(screen.getByTestId('totalXP').textContent).toBe('500');
    });

    // Trigger visit
    await act(async () => {
      screen.getByTestId('visit').click();
    });

    expect(mockRecordVisit).toHaveBeenCalled();
    expect(mockRecordVisit.mock.calls[0][0]).toBe('/matches');
  });

  it('server response reconciles over optimistic updates (server is authoritative)', async () => {
    // Server returns a different coin balance than what we'd optimistically calculate
    const serverResponse = {
      ...baseProgression,
      coin_balance: 999, // Server has different balance
    };

    const qc = createQueryClient();

    mockRecordLogin.mockResolvedValue({
      login_streak: 6,
      coins_awarded: 10,
      streak_bonus: 0,
      total_coins_awarded: 10,
      achievements_unlocked: [],
      is_new_day: true,
    });

    render(
      <QueryClientProvider client={qc}>
        <AdventureModeProvider>
          <TestConsumer />
        </AdventureModeProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('gold').textContent).toBe('250');
    });

    // Server returns authoritative value on refetch
    mockGetProgression.mockResolvedValue(serverResponse);

    await act(async () => {
      screen.getByTestId('login').click();
    });

    // After refetch, server's authoritative value should win
    await waitFor(() => {
      expect(screen.getByTestId('gold').textContent).toBe('999');
    });
  });
});
