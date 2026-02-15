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

// Adventure mode mock state -- controllable per test
const mockEnableAdventureMode = vi.fn();
const mockAdventureState = {
  enabled: false,
  totalXP: 0,
  gold: 0,
  level: 1,
  currentXP: 0,
  xpToNextLevel: 200,
  title: 'Apprentice',
  loginStreak: 0,
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

// Progression API mock -- new user defaults
const mockCompleteOnboarding = vi.fn().mockResolvedValue({
  onboarding_complete: true,
  walkthrough_completed: true,
});

vi.mock('../services/progressionService', () => ({
  progressionApi: {
    getProgression: vi.fn().mockResolvedValue({
      xp_total: 0,
      level: 1,
      title: 'Apprentice',
      coin_balance: 0,
      login_streak: 0,
      last_login_date: null,
      adventure_mode_enabled: false,
      current_level_xp: 0,
      xp_to_next_level: 200,
      feature_unlocks: { side_quests: false, guild_rank: false, advanced_arena: false, special_title: false },
      equipped_items: {},
      unlocked_achievements_count: 0,
      active_quests_count: 0,
      walkthrough_step: 0,
      walkthrough_completed: false,
      onboarding_complete: false,
    }),
    toggleAdventureMode: vi.fn(),
    recordLogin: vi.fn(),
    recordVisit: vi.fn(),
    getHistory: vi.fn(),
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

/**
 * Helper: wait for progression to load and new user detection to complete,
 * then advance past the 1.5s intro timer.
 */
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

describe('CedricContext -- Story 2.3: New User Detection & Adventure Mode Prompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    capturedContext = null;
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('detects new user from progression data (isNewUser = true)', async () => {
    renderWithProviders();

    // Wait for React Query to resolve and INIT_FROM_PROGRESSION to fire
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(screen.getByTestId('isNewUser').textContent).toBe('true');
  });

  it('shows intro prompt after 1.5s delay for new users', async () => {
    renderWithProviders();
    await waitForIntroPrompt();

    // Intro message should now be showing (it clears any page messages first)
    expect(screen.getByTestId('currentMessageId').textContent).toBe('onboarding-intro');
    expect(screen.getByTestId('currentMessage').textContent).toContain('Welcome');
  });

  it('intro prompt has two action buttons', async () => {
    renderWithProviders();
    await waitForIntroPrompt();

    const actions = capturedContext!.state.currentMessage?.actions;
    expect(actions).toBeDefined();
    expect(actions).toHaveLength(2);
    expect(actions![0].label).toBe('Enable Adventure Mode!');
    expect(actions![0].variant).toBe('primary');
    expect(actions![1].label).toBe('Maybe Later');
    expect(actions![1].variant).toBe('ghost');
  });

  it('intro prompt is not dismissible and has no auto-dismiss', async () => {
    renderWithProviders();
    await waitForIntroPrompt();

    const message = capturedContext!.state.currentMessage;
    expect(message?.dismissible).toBe(false);
    expect(message?.duration).toBe(0);
  });

  it('"Enable Adventure Mode!" calls enableAdventureMode and starts walkthrough', async () => {
    renderWithProviders();
    await waitForIntroPrompt();

    const enableAction = capturedContext!.state.currentMessage?.actions?.find(
      (a) => a.id === 'enable-adventure'
    );
    expect(enableAction).toBeDefined();

    act(() => {
      enableAction!.onClick();
    });

    expect(mockEnableAdventureMode).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('walkthroughActive').textContent).toBe('true');
  });

  it('"Maybe Later" shows follow-up message with tour options', async () => {
    renderWithProviders();
    await waitForIntroPrompt();

    const maybeLater = capturedContext!.state.currentMessage?.actions?.find(
      (a) => a.id === 'maybe-later'
    );
    expect(maybeLater).toBeDefined();

    // Click "Maybe Later"
    act(() => {
      maybeLater!.onClick();
    });

    // Current message should be dismissed
    expect(screen.getByTestId('currentMessageId').textContent).toBe('none');

    // Advance past the 600ms gap for the follow-up
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    // Follow-up message should appear
    expect(screen.getByTestId('currentMessageId').textContent).toBe('onboarding-maybe-later');

    const followUpActions = capturedContext!.state.currentMessage?.actions;
    expect(followUpActions).toHaveLength(2);
    expect(followUpActions![0].label).toBe('Sure, show me around!');
    expect(followUpActions![1].label).toBe("I'll explore on my own");
  });

  it('"Sure, show me around!" starts walkthrough without adventure mode', async () => {
    renderWithProviders();
    await waitForIntroPrompt();

    // Click "Maybe Later"
    const maybeLater = capturedContext!.state.currentMessage?.actions?.find(
      (a) => a.id === 'maybe-later'
    );
    act(() => {
      maybeLater!.onClick();
    });

    // Advance to follow-up
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    // Click "Sure, show me around!"
    const tourAction = capturedContext!.state.currentMessage?.actions?.find(
      (a) => a.id === 'tour-modern'
    );
    expect(tourAction).toBeDefined();

    act(() => {
      tourAction!.onClick();
    });

    expect(mockEnableAdventureMode).not.toHaveBeenCalled();
    expect(screen.getByTestId('walkthroughActive').textContent).toBe('true');
  });

  it('"I\'ll explore on my own" minimizes Cedric and calls completeOnboarding', async () => {
    renderWithProviders();
    await waitForIntroPrompt();

    // Click "Maybe Later"
    const maybeLater = capturedContext!.state.currentMessage?.actions?.find(
      (a) => a.id === 'maybe-later'
    );
    act(() => {
      maybeLater!.onClick();
    });

    // Advance to follow-up
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    // Click "I'll explore on my own"
    const exploreAction = capturedContext!.state.currentMessage?.actions?.find(
      (a) => a.id === 'explore-own'
    );
    expect(exploreAction).toBeDefined();

    act(() => {
      exploreAction!.onClick();
    });

    expect(screen.getByTestId('visibility').textContent).toBe('minimized');
    expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('walkthroughActive').textContent).toBe('false');
  });

  it('does not show intro prompt for returning users', async () => {
    // Override the mock to return a completed user
    const { progressionApi } = await import('../services/progressionService');
    vi.mocked(progressionApi.getProgression).mockResolvedValueOnce({
      xp_total: 1000,
      level: 5,
      title: 'Knight',
      coin_balance: 500,
      login_streak: 3,
      last_login_date: '2026-02-12',
      adventure_mode_enabled: true,
      current_level_xp: 200,
      xp_to_next_level: 400,
      feature_unlocks: { side_quests: true, guild_rank: false, advanced_arena: false, special_title: false },
      equipped_items: {},
      unlocked_achievements_count: 3,
      active_quests_count: 1,
      walkthrough_step: 7,
      walkthrough_completed: true,
      onboarding_complete: true,
    });

    renderWithProviders();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(screen.getByTestId('isNewUser').textContent).toBe('false');
    // No intro message should appear
    const currentId = screen.getByTestId('currentMessageId').textContent;
    expect(currentId).not.toBe('onboarding-intro');
  });

  it('only shows intro prompt once (no duplicate on re-render)', async () => {
    renderWithProviders();
    await waitForIntroPrompt();

    // Intro should be showing
    expect(screen.getByTestId('currentMessageId').textContent).toBe('onboarding-intro');

    // Dismiss it via Enable Adventure Mode action (which also starts walkthrough)
    const enableAction = capturedContext!.state.currentMessage?.actions?.find(
      (a) => a.id === 'enable-adventure'
    );
    act(() => {
      enableAction!.onClick();
    });

    // Walkthrough is active now, intro is gone
    expect(screen.getByTestId('walkthroughActive').textContent).toBe('true');

    // Advance time -- no duplicate intro should appear
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    const currentId = screen.getByTestId('currentMessageId').textContent;
    expect(currentId).not.toBe('onboarding-intro');
  });

  it('intro message uses WaveHello animation state', async () => {
    renderWithProviders();
    await waitForIntroPrompt();

    expect(capturedContext!.state.currentMessage?.avatarState).toBe('waveHello');
  });

  it('intro message has walkthrough priority', async () => {
    renderWithProviders();
    await waitForIntroPrompt();

    expect(capturedContext!.state.currentMessage?.priority).toBe('walkthrough');
  });

  it('clears any page messages before showing intro', async () => {
    renderWithProviders();
    await waitForIntroPrompt();

    // The intro should be the current message, not any first-visit page message
    expect(screen.getByTestId('currentMessageId').textContent).toBe('onboarding-intro');
  });
});

describe('CedricContext -- Adventure Mode Already Enabled: No duplicate prompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    capturedContext = null;
    localStorage.clear();
    // Simulate user who already has adventure mode enabled
    mockAdventureState.enabled = true;
  });

  afterEach(() => {
    vi.useRealTimers();
    // Reset to default for other test suites
    mockAdventureState.enabled = false;
  });

  it('shows tour offer instead of "Enable Adventure Mode!" when adventure mode is already on', async () => {
    renderWithProviders();
    await waitForIntroPrompt();

    // Should show the tour offer, not the "Enable Adventure Mode!" prompt
    expect(screen.getByTestId('currentMessageId').textContent).toBe('onboarding-intro-tour');
  });

  it('tour offer has "Show me around!" and "I\'ll explore on my own" buttons (no "Enable Adventure Mode!")', async () => {
    renderWithProviders();
    await waitForIntroPrompt();

    const actions = capturedContext!.state.currentMessage?.actions;
    expect(actions).toBeDefined();
    expect(actions).toHaveLength(2);
    expect(actions![0].label).toBe('Show me around!');
    expect(actions![0].variant).toBe('primary');
    expect(actions![1].label).toBe("I'll explore on my own");
    expect(actions![1].variant).toBe('ghost');
    // No "Enable Adventure Mode!" button should exist
    const enableAction = actions!.find((a) => a.id === 'enable-adventure');
    expect(enableAction).toBeUndefined();
  });

  it('"Show me around!" starts walkthrough without calling enableAdventureMode again', async () => {
    renderWithProviders();
    await waitForIntroPrompt();

    const startTour = capturedContext!.state.currentMessage?.actions?.find(
      (a) => a.id === 'start-tour'
    );
    expect(startTour).toBeDefined();

    act(() => {
      startTour!.onClick();
    });

    expect(mockEnableAdventureMode).not.toHaveBeenCalled();
    expect(screen.getByTestId('walkthroughActive').textContent).toBe('true');
  });

  it('"I\'ll explore on my own" minimizes and completes onboarding', async () => {
    renderWithProviders();
    await waitForIntroPrompt();

    const exploreAction = capturedContext!.state.currentMessage?.actions?.find(
      (a) => a.id === 'explore-own'
    );
    expect(exploreAction).toBeDefined();

    act(() => {
      exploreAction!.onClick();
    });

    expect(screen.getByTestId('visibility').textContent).toBe('minimized');
    expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
  });
});
