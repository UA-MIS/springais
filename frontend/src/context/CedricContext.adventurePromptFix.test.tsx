/**
 * Tests for fix: adventure mode prompt should not show "Enable Adventure Mode!"
 * when adventure mode is already enabled. Instead, it should offer a walkthrough
 * tour directly.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CedricProvider, useCedric } from './CedricContext';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/matches' }),
}));

// Mock AuthContext
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
}));

// Adventure mode mock state -- adventure mode ENABLED
const mockEnableAdventureMode = vi.fn();
const mockAdventureState = {
  enabled: true, // Already enabled!
  totalXP: 50,
  gold: 25,
  level: 1,
  currentXP: 50,
  xpToNextLevel: 50,
  title: 'Apprentice',
  loginStreak: 0,
  lastLoginDate: null,
  loading: false,
  unlockedAchievementsCount: 0,
  unlockedAchievements: [] as string[],
  completedSkillsCount: 0,
  visitedPages: [] as string[],
  recentXPGain: null,
  recentGoldGain: null,
  recentAchievement: null,
  levelUpPending: false,
  newLevel: null,
  newTitle: null,
  levelUpCoinBonus: null,
  unlockedFeatures: [] as string[],
  recentQuestComplete: null,
};

vi.mock('./AdventureModeContext', () => ({
  useAdventureMode: () => ({
    state: mockAdventureState,
    toggleAdventureMode: vi.fn(),
    enableAdventureMode: mockEnableAdventureMode,
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

// Progression API mock -- new user with adventure mode already enabled
const mockCompleteOnboarding = vi.fn().mockResolvedValue({
  onboarding_complete: true,
  walkthrough_completed: true,
});

vi.mock('../services/progressionService', () => ({
  progressionApi: {
    getProgression: vi.fn().mockResolvedValue({
      xp_total: 50,
      level: 1,
      title: 'Apprentice',
      coin_balance: 25,
      login_streak: 0,
      last_login_date: null,
      adventure_mode_enabled: true,
      current_level_xp: 50,
      xp_to_next_level: 50,
      feature_unlocks: { side_quests: false, guild_rank: false, advanced_arena: false, special_title: false },
      equipped_items: {},
      unlocked_achievements_count: 0,
      active_quests_count: 0,
      walkthrough_step: 0,
      walkthrough_completed: false,
      onboarding_complete: false, // New user -- onboarding not done
    }),
    toggleAdventureMode: vi.fn(),
    recordLogin: vi.fn(),
    recordVisit: vi.fn(),
    getHistory: vi.fn(),
    completeWalkthroughStep: vi.fn().mockResolvedValue({}),
    completeOnboarding: (...args: unknown[]) => mockCompleteOnboarding(...args),
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

// Helper component that exposes context
let capturedContext: ReturnType<typeof useCedric> | null = null;

function TestConsumer() {
  const ctx = useCedric();
  capturedContext = ctx;
  return (
    <div>
      <span data-testid="isNewUser">{String(ctx.state.isNewUser)}</span>
      <span data-testid="walkthroughActive">{String(ctx.state.walkthroughActive)}</span>
      <span data-testid="visibility">{ctx.state.visibility}</span>
      <span data-testid="currentMessage">{ctx.state.currentMessage?.text ?? 'none'}</span>
      <span data-testid="currentMessageId">{ctx.state.currentMessage?.id ?? 'none'}</span>
      <span data-testid="actionCount">
        {ctx.state.currentMessage?.actions?.length ?? 0}
      </span>
    </div>
  );
}

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CedricProvider>
        <TestConsumer />
      </CedricProvider>
    </QueryClientProvider>
  );
}

async function waitForIntroPrompt() {
  // Let React Query resolve + INIT_FROM_PROGRESSION fire
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });
  // Advance past the 1.5s intro delay
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1500);
  });
  // Allow the SHOW_NEXT_MESSAGE gap timer (500ms) to fire if needed
  await act(async () => {
    await vi.advanceTimersByTimeAsync(600);
  });
}

describe('CedricContext -- Adventure mode prompt fix (Task #3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    capturedContext = null;
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('detects new user even when adventure mode is already enabled', async () => {
    renderWithProviders();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(screen.getByTestId('isNewUser').textContent).toBe('true');
  });

  it('does NOT show "Enable Adventure Mode!" button when adventure mode is already on', async () => {
    renderWithProviders();
    await waitForIntroPrompt();

    // Should show the tour intro, not the "Enable Adventure Mode!" prompt
    const msgId = screen.getByTestId('currentMessageId').textContent;
    expect(msgId).toBe('onboarding-intro-tour');

    // Verify NO "Enable Adventure Mode!" button
    const actions = capturedContext!.state.currentMessage?.actions;
    expect(actions).toBeDefined();
    const enableAction = actions?.find((a) => a.id === 'enable-adventure');
    expect(enableAction).toBeUndefined();
  });

  it('shows "Show me around!" and "I\'ll explore on my own" when adventure mode is already on', async () => {
    renderWithProviders();
    await waitForIntroPrompt();

    const actions = capturedContext!.state.currentMessage?.actions;
    expect(actions).toBeDefined();
    expect(actions).toHaveLength(2);
    expect(actions![0].label).toBe('Show me around!');
    expect(actions![0].variant).toBe('primary');
    expect(actions![1].label).toBe("I'll explore on my own");
    expect(actions![1].variant).toBe('ghost');
  });

  it('"Show me around!" starts the walkthrough without calling enableAdventureMode', async () => {
    renderWithProviders();
    await waitForIntroPrompt();

    const startTour = capturedContext!.state.currentMessage?.actions?.find(
      (a) => a.id === 'start-tour'
    );
    expect(startTour).toBeDefined();

    act(() => {
      startTour!.onClick();
    });

    // Should NOT call enableAdventureMode (already enabled)
    expect(mockEnableAdventureMode).not.toHaveBeenCalled();
    // Walkthrough should be active
    expect(screen.getByTestId('walkthroughActive').textContent).toBe('true');
  });

  it('"I\'ll explore on my own" minimizes Cedric and completes onboarding', async () => {
    renderWithProviders();
    await waitForIntroPrompt();

    const exploreOwn = capturedContext!.state.currentMessage?.actions?.find(
      (a) => a.id === 'explore-own'
    );
    expect(exploreOwn).toBeDefined();

    act(() => {
      exploreOwn!.onClick();
    });

    expect(screen.getByTestId('visibility').textContent).toBe('minimized');
    expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('walkthroughActive').textContent).toBe('false');
  });

  it('uses medieval text variant when adventure mode is enabled', async () => {
    renderWithProviders();
    await waitForIntroPrompt();

    // The intro text should use medieval variant since adventure mode is on
    const message = capturedContext!.state.currentMessage;
    expect(message?.text).toContain('Hail');
  });
});
