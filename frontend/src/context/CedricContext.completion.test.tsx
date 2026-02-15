import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CedricProvider, useCedric } from './CedricContext';

// Track current mock pathname
let mockPathname = '/matches';
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: mockPathname }),
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

// Adventure mode mock
const mockAddXP = vi.fn();
const mockAddGold = vi.fn();
vi.mock('./AdventureModeContext', () => ({
  useAdventureMode: () => ({
    state: {
      enabled: true,
      totalXP: 500,
      gold: 300,
      level: 2,
      currentXP: 100,
      xpToNextLevel: 300,
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
    },
    toggleAdventureMode: vi.fn(),
    enableAdventureMode: vi.fn(),
    disableAdventureMode: vi.fn(),
    addXP: mockAddXP,
    addGold: mockAddGold,
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

// Progression API mock -- walkthrough in-progress user (step 6, near completion)
const mockCompleteOnboarding = vi.fn().mockResolvedValue({});
const mockCompleteWalkthroughStep = vi.fn().mockResolvedValue({});
vi.mock('../services/progressionService', () => ({
  progressionApi: {
    getProgression: vi.fn().mockResolvedValue({
      xp_total: 500,
      level: 2,
      title: 'Apprentice',
      coin_balance: 300,
      login_streak: 1,
      last_login_date: null,
      adventure_mode_enabled: true,
      current_level_xp: 100,
      xp_to_next_level: 300,
      feature_unlocks: {},
      equipped_items: {},
      unlocked_achievements_count: 0,
      active_quests_count: 0,
      walkthrough_step: 0,
      walkthrough_completed: false,
      onboarding_complete: true, // Not new user, but can start walkthrough
    }),
    toggleAdventureMode: vi.fn(),
    recordLogin: vi.fn(),
    recordVisit: vi.fn(),
    getHistory: vi.fn(),
    completeWalkthroughStep: (...args: unknown[]) => mockCompleteWalkthroughStep(...args),
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
      <span data-testid="walkthroughActive">{String(ctx.state.walkthroughActive)}</span>
      <span data-testid="walkthroughStep">{ctx.state.walkthroughStep}</span>
      <span data-testid="walkthroughComplete">{String(ctx.state.walkthroughComplete)}</span>
      <span data-testid="animationState">{ctx.state.animationState}</span>
      <span data-testid="currentMessageId">{ctx.state.currentMessage?.id ?? 'none'}</span>
      <span data-testid="currentMessage">{ctx.state.currentMessage?.text ?? 'none'}</span>
      <span data-testid="visibility">{ctx.state.visibility}</span>
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

describe('CedricContext -- Story 2.7: Walkthrough Completion Celebration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    capturedContext = null;
    localStorage.clear();
    mockPathname = '/matches';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function startAndAdvanceToStep(targetStep: number) {
    renderWithProviders();
    // Wait for progression to load
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    // Start walkthrough manually
    act(() => {
      capturedContext!.startWalkthrough();
    });
    // Advance to target step
    for (let i = 0; i < targetStep; i++) {
      act(() => {
        capturedContext!.advanceWalkthrough();
      });
    }
  }

  describe('Completion trigger', () => {
    it('triggers completion when walkthroughStep reaches TOTAL_STEPS (7)', async () => {
      await startAndAdvanceToStep(6);
      expect(screen.getByTestId('walkthroughStep').textContent).toBe('6');
      expect(screen.getByTestId('walkthroughActive').textContent).toBe('true');

      // Advance past step 6 (the final step) -> step 7 = TOTAL_STEPS
      act(() => {
        capturedContext!.advanceWalkthrough();
      });

      // Completion effect fires: walkthroughActive becomes false, walkthroughComplete true
      expect(screen.getByTestId('walkthroughActive').textContent).toBe('false');
      expect(screen.getByTestId('walkthroughComplete').textContent).toBe('true');
      expect(screen.getByTestId('walkthroughStep').textContent).toBe('7');
    });

    it('triggers CelebrateLevelUp animation on completion', async () => {
      await startAndAdvanceToStep(6);

      act(() => {
        capturedContext!.advanceWalkthrough();
      });

      expect(screen.getByTestId('animationState').textContent).toBe('celebrateLevelUp');
    });

    it('calls completeOnboarding on completion', async () => {
      await startAndAdvanceToStep(6);

      act(() => {
        capturedContext!.advanceWalkthrough();
      });

      expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
    });

    it('shows final walkthrough message after 2s delay', async () => {
      await startAndAdvanceToStep(6);

      act(() => {
        capturedContext!.advanceWalkthrough();
      });

      // Message not shown yet (2s delay)
      expect(screen.getByTestId('currentMessageId').textContent).not.toBe('walkthrough-complete');

      // Advance past the 2s celebration delay
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(screen.getByTestId('currentMessageId').textContent).toBe('walkthrough-complete');
      expect(screen.getByTestId('currentMessage').textContent).toContain('proud');
    });

    it('final message is dismissible with 12s duration', async () => {
      await startAndAdvanceToStep(6);

      act(() => {
        capturedContext!.advanceWalkthrough();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      const msg = capturedContext!.state.currentMessage;
      expect(msg?.dismissible).toBe(true);
      expect(msg?.duration).toBe(12000);
    });

    it('final message uses VictoryPose avatar state', async () => {
      await startAndAdvanceToStep(6);

      act(() => {
        capturedContext!.advanceWalkthrough();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(capturedContext!.state.currentMessage?.avatarState).toBe('victoryPose');
    });
  });

  describe('Skip flow', () => {
    it('skipping walkthrough sets walkthroughActive false and walkthroughComplete true', async () => {
      await startAndAdvanceToStep(2);
      expect(screen.getByTestId('walkthroughActive').textContent).toBe('true');

      act(() => {
        capturedContext!.skipWalkthrough();
      });

      expect(screen.getByTestId('walkthroughActive').textContent).toBe('false');
      expect(screen.getByTestId('walkthroughComplete').textContent).toBe('true');
    });

    it('skipping calls completeOnboarding', async () => {
      await startAndAdvanceToStep(2);

      act(() => {
        capturedContext!.skipWalkthrough();
      });

      expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
    });

    it('skipping enqueues a brief farewell message', async () => {
      await startAndAdvanceToStep(2);

      act(() => {
        capturedContext!.skipWalkthrough();
      });

      expect(screen.getByTestId('currentMessageId').textContent).toBe('walkthrough-skipped');
    });

    it('skip farewell message has 6s duration and is dismissible', async () => {
      await startAndAdvanceToStep(2);

      act(() => {
        capturedContext!.skipWalkthrough();
      });

      const msg = capturedContext!.state.currentMessage;
      expect(msg?.duration).toBe(6000);
      expect(msg?.dismissible).toBe(true);
    });
  });

  describe('Post-completion state', () => {
    it('enters persistent companion mode (idle) after final message auto-dismisses', async () => {
      await startAndAdvanceToStep(6);

      act(() => {
        capturedContext!.advanceWalkthrough();
      });

      // Show the final message
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      // Wait for the 12s message duration to expire
      await act(async () => {
        await vi.advanceTimersByTimeAsync(12000);
      });

      // Message should be dismissed
      expect(screen.getByTestId('currentMessageId').textContent).toBe('none');
      // Walkthrough state should remain complete
      expect(screen.getByTestId('walkthroughComplete').textContent).toBe('true');
      expect(screen.getByTestId('walkthroughActive').textContent).toBe('false');
    });

    it('completion only triggers once (no duplicate on re-render)', async () => {
      await startAndAdvanceToStep(6);

      act(() => {
        capturedContext!.advanceWalkthrough();
      });

      expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);

      // Advance time -- should not trigger again
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });

      expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
    });
  });
});
