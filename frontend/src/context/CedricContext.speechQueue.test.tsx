import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CedricProvider, useCedric } from './CedricContext';
import type { SpeechMessage } from './CedricContext';

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
vi.mock('./AdventureModeContext', () => ({
  useAdventureMode: () => ({
    state: {
      enabled: true, totalXP: 100, gold: 50, level: 1, currentXP: 50,
      xpToNextLevel: 200, title: 'Apprentice', loginStreak: 1,
      lastLoginDate: null, loading: false, unlockedAchievementsCount: 0,
      unlockedAchievements: [], completedSkillsCount: 0, visitedPages: [],
      recentXPGain: null, recentGoldGain: null, recentAchievement: null,
      levelUpPending: false, newLevel: null, newTitle: null,
      levelUpCoinBonus: null, unlockedFeatures: [], recentQuestComplete: null,
    },
    toggleAdventureMode: vi.fn(),
    enableAdventureMode: vi.fn(),
    disableAdventureMode: vi.fn(),
    addXP: vi.fn(), addGold: vi.fn(), spendGold: vi.fn(),
    unlockAchievement: vi.fn(), getAchievements: vi.fn(),
    isAchievementUnlocked: vi.fn(), incrementSkillsCompleted: vi.fn(),
    trackPageVisit: vi.fn(), recordLogin: vi.fn(), recordVisit: vi.fn(),
    clearRecentXP: vi.fn(), clearRecentGold: vi.fn(),
    clearRecentAchievement: vi.fn(), clearLevelUp: vi.fn(),
    clearQuestComplete: vi.fn(),
  }),
  AdventureModeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock progressionApi
vi.mock('../services/progressionService', () => ({
  progressionApi: {
    getProgression: vi.fn().mockResolvedValue({
      xp_total: 100, level: 1, title: 'Apprentice', coin_balance: 50,
      login_streak: 1, last_login_date: null, adventure_mode_enabled: true,
      current_level_xp: 50, xp_to_next_level: 200,
      feature_unlocks: { side_quests: false, guild_rank: false, advanced_arena: false, special_title: false },
      equipped_items: {}, unlocked_achievements_count: 0, active_quests_count: 0,
      walkthrough_step: 0, walkthrough_completed: false, onboarding_complete: false,
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

// Helper to expose context
let capturedContext: ReturnType<typeof useCedric> | null = null;

function TestConsumer() {
  const ctx = useCedric();
  capturedContext = ctx;
  return (
    <div>
      <span data-testid="currentMessage">{ctx.state.currentMessage?.text ?? 'none'}</span>
      <span data-testid="currentPriority">{ctx.state.currentMessage?.priority ?? 'none'}</span>
      <span data-testid="queueLength">{ctx.state.speechQueue.length}</span>
    </div>
  );
}

function renderWithProviders(initialPath = '/test-page') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <CedricProvider>
          <TestConsumer />
        </CedricProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function makeMessage(overrides: Partial<SpeechMessage> = {}): SpeechMessage {
  return {
    id: `msg-${Math.random().toString(36).slice(2)}`,
    text: 'Test message',
    priority: 'reaction',
    duration: 0,
    typing: false,
    dismissible: true,
    suppressible: false,
    ...overrides,
  };
}

describe('CedricContext - Story 3.4: Priority Speech Queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedContext = null;
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('AC1: enqueueMessage adds messages sorted by priority', () => {
    renderWithProviders();

    // Show a blocking message
    act(() => {
      capturedContext!.enqueueMessage(
        makeMessage({ id: 'current', text: 'Current', duration: 0 })
      );
    });

    // Enqueue mixed priorities
    act(() => {
      capturedContext!.enqueueMessage(makeMessage({ id: 'p1', priority: 'proactive', text: 'Proactive' }));
      capturedContext!.enqueueMessage(makeMessage({ id: 'w1', priority: 'walkthrough', text: 'Walkthrough' }));
      capturedContext!.enqueueMessage(makeMessage({ id: 'r1', priority: 'reward', text: 'Reward' }));
    });

    const queue = capturedContext!.state.speechQueue;
    // Walkthrough should be first (highest priority)
    expect(queue[0].priority).toBe('walkthrough');
    expect(queue[1].priority).toBe('reward');
  });

  it('AC2: message with duration 0 does not auto-dismiss', () => {
    renderWithProviders();

    act(() => {
      capturedContext!.enqueueMessage(
        makeMessage({ id: 'manual', text: 'Manual', duration: 0 })
      );
    });

    // Advance time significantly
    act(() => { vi.advanceTimersByTime(30000); });

    // Message should still be showing
    expect(screen.getByTestId('currentMessage').textContent).toBe('Manual');
  });

  it('AC2: message with duration > 0 auto-dismisses', () => {
    renderWithProviders();

    act(() => {
      capturedContext!.enqueueMessage(
        makeMessage({ id: 'auto', text: 'Auto', duration: 5000 })
      );
    });

    expect(screen.getByTestId('currentMessage').textContent).toBe('Auto');

    // Advance past duration
    act(() => { vi.advanceTimersByTime(5500); });

    // Message should be dismissed
    expect(screen.getByTestId('currentMessage').textContent).toBe('none');
  });

  it('AC3: next message appears after 500ms gap on dismiss', () => {
    renderWithProviders();

    // Enqueue first message
    act(() => {
      capturedContext!.enqueueMessage(
        makeMessage({ id: 'first', text: 'First', duration: 0 })
      );
    });

    // Enqueue second message separately (so first is already current)
    act(() => {
      capturedContext!.enqueueMessage(
        makeMessage({ id: 'second', text: 'Second', duration: 0 })
      );
    });

    expect(screen.getByTestId('currentMessage').textContent).toBe('First');
    expect(screen.getByTestId('queueLength').textContent).toBe('1');

    // Dismiss first
    act(() => { capturedContext!.dismissCurrentMessage(); });

    // Immediately after dismiss, current should be cleared
    expect(screen.getByTestId('currentMessage').textContent).toBe('none');

    // After 500ms gap, next message should appear
    act(() => { vi.advanceTimersByTime(600); });
    expect(screen.getByTestId('currentMessage').textContent).toBe('Second');
  });

  it('AC4: overflow drops proactive and reaction, keeps walkthrough and reward', () => {
    renderWithProviders();

    // Show a blocking message
    act(() => {
      capturedContext!.enqueueMessage(
        makeMessage({ id: 'current', text: 'Current', duration: 0 })
      );
    });

    // Add 4+ messages to trigger overflow
    act(() => {
      capturedContext!.enqueueMessage(makeMessage({ id: 'r1', priority: 'reaction' }));
      capturedContext!.enqueueMessage(makeMessage({ id: 'w1', priority: 'walkthrough' }));
      capturedContext!.enqueueMessage(makeMessage({ id: 'rw1', priority: 'reward' }));
      capturedContext!.enqueueMessage(makeMessage({ id: 'p1', priority: 'proactive' }));
    });

    const queue = capturedContext!.state.speechQueue;
    for (const msg of queue) {
      expect(['walkthrough', 'reward']).toContain(msg.priority);
    }
  });

  it('AC6: dismissCurrentMessage immediately removes current message', () => {
    renderWithProviders();

    act(() => {
      capturedContext!.enqueueMessage(
        makeMessage({ id: 'msg', text: 'Visible', duration: 0 })
      );
    });

    expect(screen.getByTestId('currentMessage').textContent).toBe('Visible');

    act(() => { capturedContext!.dismissCurrentMessage(); });

    expect(screen.getByTestId('currentMessage').textContent).toBe('none');
  });

  it('AC7: suppressMessageType sets localStorage key', () => {
    renderWithProviders();

    act(() => {
      capturedContext!.suppressMessageType('tip-matches');
    });

    expect(localStorage.getItem('cedric-msg-suppress-tip-matches')).toBe('true');
  });
});
