/**
 * Tests for fix: addXP/addGold should trigger a deferred server refetch
 * so the HUD shows persisted progression values (not just optimistic ones).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdventureModeProvider, useAdventureMode } from './AdventureModeContext';

// Mock AuthContext with a logged-in user
vi.mock('./AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@test.com' },
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
const mockGetProgression = vi.fn().mockResolvedValue({
  xp_total: 100,
  level: 1,
  title: 'Apprentice',
  coin_balance: 50,
  login_streak: 0,
  last_login_date: null,
  adventure_mode_enabled: true,
  current_level_xp: 100,
  xp_to_next_level: 200,
  feature_unlocks: { side_quests: false, guild_rank: false, advanced_arena: false, special_title: false },
  equipped_items: {},
  unlocked_achievements_count: 0,
  active_quests_count: 0,
  walkthrough_step: 0,
  walkthrough_completed: false,
  onboarding_complete: true,
});

vi.mock('../services/progressionService', () => ({
  progressionApi: {
    getProgression: (...args: unknown[]) => mockGetProgression(...args),
    toggleAdventureMode: vi.fn(),
    recordLogin: vi.fn(),
    recordVisit: vi.fn(),
    getHistory: vi.fn(),
    completeWalkthroughStep: vi.fn(),
    completeOnboarding: vi.fn(),
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

function TestConsumer() {
  const { state, addXP, addGold } = useAdventureMode();
  return (
    <div>
      <span data-testid="totalXP">{state.totalXP}</span>
      <span data-testid="gold">{state.gold}</span>
      <span data-testid="recentXP">{state.recentXPGain ?? 'null'}</span>
      <span data-testid="recentGold">{state.recentGoldGain ?? 'null'}</span>
      <button data-testid="addXP" onClick={() => addXP(75, 'test')}>Add XP</button>
      <button data-testid="addGold" onClick={() => addGold(30, 'test')}>Add Gold</button>
    </div>
  );
}

describe('AdventureModeContext -- addXP/addGold deferred refetch fix (Task #2)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderComponent() {
    return render(
      <QueryClientProvider client={queryClient}>
        <AdventureModeProvider>
          <TestConsumer />
        </AdventureModeProvider>
      </QueryClientProvider>
    );
  }

  it('addXP sets optimistic XP immediately', async () => {
    renderComponent();

    // Wait for initial query to resolve
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    // XP should be 100 from server
    expect(screen.getByTestId('totalXP').textContent).toBe('100');

    // Add 75 XP
    act(() => {
      screen.getByTestId('addXP').click();
    });

    // Should be optimistically updated to 175
    expect(screen.getByTestId('totalXP').textContent).toBe('175');
    expect(screen.getByTestId('recentXP').textContent).toBe('75');
  });

  it('addXP triggers deferred refetch after 1.5s', async () => {
    renderComponent();

    // Wait for initial query
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    // Spy on invalidateQueries
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    act(() => {
      screen.getByTestId('addXP').click();
    });

    // Immediately after, no invalidation yet
    expect(invalidateSpy).not.toHaveBeenCalled();

    // Advance past the 1.5s deferred refetch
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['progression'] })
    );
  });

  it('addGold sets optimistic gold immediately', async () => {
    renderComponent();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(screen.getByTestId('gold').textContent).toBe('50');

    act(() => {
      screen.getByTestId('addGold').click();
    });

    expect(screen.getByTestId('gold').textContent).toBe('80');
    expect(screen.getByTestId('recentGold').textContent).toBe('30');
  });

  it('addGold triggers deferred refetch after 1.5s', async () => {
    renderComponent();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    act(() => {
      screen.getByTestId('addGold').click();
    });

    expect(invalidateSpy).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['progression'] })
    );
  });

  it('recent XP notification clears after 3s', async () => {
    renderComponent();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    act(() => {
      screen.getByTestId('addXP').click();
    });

    expect(screen.getByTestId('recentXP').textContent).toBe('75');

    // Advance 3s for the notification clear
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(screen.getByTestId('recentXP').textContent).toBe('null');
  });
});
