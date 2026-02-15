import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CedricProvider, useCedric, AnimationState } from './CedricContext';
import type { SpeechMessage } from './CedricContext';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/test-page' }),
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

// Mock AdventureModeContext
const mockAdventureState = {
  enabled: true,
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
};

vi.mock('./AdventureModeContext', () => ({
  useAdventureMode: () => ({
    state: mockAdventureState,
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

// Mock progressionApi
vi.mock('../services/progressionService', () => ({
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
      walkthrough_step: 0,
      walkthrough_completed: false,
      onboarding_complete: false,
    }),
    toggleAdventureMode: vi.fn(),
    recordLogin: vi.fn(),
    recordVisit: vi.fn(),
    getHistory: vi.fn(),
    completeWalkthroughStep: vi.fn().mockResolvedValue({}),
    completeOnboarding: vi.fn().mockResolvedValue({}),
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
      <span data-testid="visibility">{ctx.state.visibility}</span>
      <span data-testid="animationState">{ctx.state.animationState}</span>
      <span data-testid="walkthroughActive">{String(ctx.state.walkthroughActive)}</span>
      <span data-testid="walkthroughStep">{ctx.state.walkthroughStep}</span>
      <span data-testid="walkthroughComplete">{String(ctx.state.walkthroughComplete)}</span>
      <span data-testid="isNewUser">{String(ctx.state.isNewUser)}</span>
      <span data-testid="quietMode">{String(ctx.state.quietMode)}</span>
      <span data-testid="characterSheetOpen">{String(ctx.state.characterSheetOpen)}</span>
      <span data-testid="currentMessage">{ctx.state.currentMessage?.text ?? 'none'}</span>
      <span data-testid="queueLength">{ctx.state.speechQueue.length}</span>
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

function makeMessage(overrides: Partial<SpeechMessage> = {}): SpeechMessage {
  return {
    id: `msg-${Math.random()}`,
    text: 'Test message',
    priority: 'reaction',
    duration: 8000,
    typing: false,
    dismissible: true,
    suppressible: false,
    ...overrides,
  };
}

describe('CedricContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedContext = null;
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('initializes with default state', () => {
      renderWithProviders();
      expect(screen.getByTestId('visibility').textContent).toBe('full');
      expect(screen.getByTestId('animationState').textContent).toBe('idle');
      expect(screen.getByTestId('walkthroughActive').textContent).toBe('false');
      expect(screen.getByTestId('walkthroughStep').textContent).toBe('0');
      expect(screen.getByTestId('characterSheetOpen').textContent).toBe('false');
    });

    it('initializes quietMode from localStorage', () => {
      localStorage.setItem('cedric-quiet-mode', 'true');
      renderWithProviders();
      expect(screen.getByTestId('quietMode').textContent).toBe('true');
    });
  });

  describe('useCedric hook', () => {
    it('throws when used outside CedricProvider', () => {
      function BadComponent() {
        useCedric();
        return null;
      }
      expect(() => render(<BadComponent />)).toThrow(
        'useCedric must be used within a CedricProvider'
      );
    });
  });

  describe('Speech Queue', () => {
    it('shows first message immediately when queue is empty', () => {
      renderWithProviders();
      act(() => {
        capturedContext!.enqueueMessage(
          makeMessage({ id: 'msg-1', text: 'Hello' })
        );
      });
      expect(screen.getByTestId('currentMessage').textContent).toBe('Hello');
    });

    it('queues additional messages when one is already showing', () => {
      renderWithProviders();
      act(() => {
        capturedContext!.enqueueMessage(
          makeMessage({ id: 'msg-1', text: 'First', duration: 0 })
        );
      });
      act(() => {
        capturedContext!.enqueueMessage(
          makeMessage({ id: 'msg-2', text: 'Second', duration: 0 })
        );
      });
      expect(screen.getByTestId('currentMessage').textContent).toBe('First');
      expect(screen.getByTestId('queueLength').textContent).toBe('1');
    });

    it('sorts queue by priority (walkthrough > reward > reaction > proactive)', () => {
      renderWithProviders();
      // Show a blocking message first
      act(() => {
        capturedContext!.enqueueMessage(
          makeMessage({ id: 'blocking', text: 'Blocking', duration: 0 })
        );
      });
      // Now enqueue in wrong order
      act(() => {
        capturedContext!.enqueueMessage(
          makeMessage({ id: 'proactive', text: 'Proactive', priority: 'proactive' })
        );
      });
      act(() => {
        capturedContext!.enqueueMessage(
          makeMessage({ id: 'walkthrough', text: 'Walkthrough', priority: 'walkthrough' })
        );
      });

      // The queue should be sorted: walkthrough first, then proactive
      expect(capturedContext!.state.speechQueue[0].priority).toBe('walkthrough');
    });

    it('drops proactive and reaction messages when queue exceeds 3', () => {
      renderWithProviders();
      // Show a blocking message
      act(() => {
        capturedContext!.enqueueMessage(
          makeMessage({ id: 'current', text: 'Current', duration: 0 })
        );
      });
      // Fill queue past 3
      act(() => {
        capturedContext!.enqueueMessage(makeMessage({ id: 'r1', priority: 'reaction' }));
        capturedContext!.enqueueMessage(makeMessage({ id: 'w1', priority: 'walkthrough' }));
        capturedContext!.enqueueMessage(makeMessage({ id: 'rw1', priority: 'reward' }));
        capturedContext!.enqueueMessage(makeMessage({ id: 'p1', priority: 'proactive' }));
      });

      // Only walkthrough and reward should remain in queue (reaction/proactive dropped)
      const queue = capturedContext!.state.speechQueue;
      for (const msg of queue) {
        expect(['walkthrough', 'reward']).toContain(msg.priority);
      }
    });

    it('dismisses current message and clears it', () => {
      renderWithProviders();
      act(() => {
        capturedContext!.enqueueMessage(
          makeMessage({ id: 'msg-1', text: 'First', duration: 0 })
        );
      });
      expect(screen.getByTestId('currentMessage').textContent).toBe('First');

      // Dismiss first message
      act(() => {
        capturedContext!.dismissCurrentMessage();
      });

      // Current message should be cleared after dismiss
      expect(screen.getByTestId('currentMessage').textContent).toBe('none');
    });
  });

  describe('Animation State Machine', () => {
    it('starts in Idle state', () => {
      renderWithProviders();
      expect(screen.getByTestId('animationState').textContent).toBe('idle');
    });

    it('allows idle state to be interrupted by contextual states', () => {
      renderWithProviders();
      act(() => {
        capturedContext!.triggerAnimation(AnimationState.Thinking);
      });
      expect(screen.getByTestId('animationState').textContent).toBe('thinking');
    });

    it('allows contextual states to be interrupted by reactions', () => {
      renderWithProviders();
      act(() => {
        capturedContext!.triggerAnimation(AnimationState.Thinking);
      });
      act(() => {
        capturedContext!.triggerAnimation(AnimationState.JumpXP);
      });
      expect(screen.getByTestId('animationState').textContent).toBe('jumpXP');
    });

    it('does not interrupt major reactions (CelebrateLevelUp) with lesser animations', () => {
      renderWithProviders();
      act(() => {
        capturedContext!.triggerAnimation(AnimationState.CelebrateLevelUp);
      });
      act(() => {
        capturedContext!.triggerAnimation(AnimationState.JumpXP);
      });
      // Major reaction should not be interrupted
      expect(screen.getByTestId('animationState').textContent).toBe('celebrateLevelUp');
    });

    it('does not interrupt major reactions (VictoryPose) with lesser animations', () => {
      renderWithProviders();
      act(() => {
        capturedContext!.triggerAnimation(AnimationState.VictoryPose);
      });
      act(() => {
        capturedContext!.triggerAnimation(AnimationState.Thinking);
      });
      expect(screen.getByTestId('animationState').textContent).toBe('victoryPose');
    });
  });

  describe('Walkthrough', () => {
    it('starts walkthrough correctly', () => {
      renderWithProviders();
      act(() => {
        capturedContext!.startWalkthrough();
      });
      expect(screen.getByTestId('walkthroughActive').textContent).toBe('true');
      expect(screen.getByTestId('walkthroughStep').textContent).toBe('0');
      expect(screen.getByTestId('visibility').textContent).toBe('full');
    });

    it('advances walkthrough step', () => {
      renderWithProviders();
      act(() => {
        capturedContext!.startWalkthrough();
      });
      act(() => {
        capturedContext!.advanceWalkthrough();
      });
      expect(screen.getByTestId('walkthroughStep').textContent).toBe('1');
    });

    it('skips walkthrough', () => {
      renderWithProviders();
      act(() => {
        capturedContext!.startWalkthrough();
      });
      act(() => {
        capturedContext!.skipWalkthrough();
      });
      expect(screen.getByTestId('walkthroughActive').textContent).toBe('false');
      expect(screen.getByTestId('walkthroughComplete').textContent).toBe('true');
    });

    it('completes walkthrough', () => {
      renderWithProviders();
      act(() => {
        capturedContext!.startWalkthrough();
      });
      act(() => {
        capturedContext!.completeWalkthrough();
      });
      expect(screen.getByTestId('walkthroughActive').textContent).toBe('false');
      expect(screen.getByTestId('walkthroughComplete').textContent).toBe('true');
      expect(screen.getByTestId('walkthroughStep').textContent).toBe('7');
    });
  });

  describe('Visibility', () => {
    it('minimizes avatar', () => {
      renderWithProviders();
      act(() => {
        capturedContext!.minimize();
      });
      expect(screen.getByTestId('visibility').textContent).toBe('minimized');
    });

    it('restores avatar from minimized', () => {
      renderWithProviders();
      act(() => {
        capturedContext!.minimize();
      });
      act(() => {
        capturedContext!.restore();
      });
      expect(screen.getByTestId('visibility').textContent).toBe('full');
    });
  });

  describe('Character Sheet', () => {
    it('opens and closes character sheet', () => {
      renderWithProviders();
      act(() => {
        capturedContext!.openCharacterSheet();
      });
      expect(screen.getByTestId('characterSheetOpen').textContent).toBe('true');
      act(() => {
        capturedContext!.closeCharacterSheet();
      });
      expect(screen.getByTestId('characterSheetOpen').textContent).toBe('false');
    });
  });

  describe('Quiet Mode', () => {
    it('toggles quiet mode and persists to localStorage', () => {
      renderWithProviders();
      act(() => {
        capturedContext!.toggleQuietMode();
      });
      expect(screen.getByTestId('quietMode').textContent).toBe('true');
      expect(localStorage.getItem('cedric-quiet-mode')).toBe('true');
    });
  });
});
