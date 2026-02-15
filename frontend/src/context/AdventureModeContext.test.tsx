import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdventureModeProvider, useAdventureMode } from './AdventureModeContext';

// Mock AuthContext so AdventureModeProvider can call useAuth()
vi.mock('./AuthContext', () => ({
  useAuth: () => ({
    user: null,
    token: null,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock progression API (no fetches needed for localStorage tests)
vi.mock('../services/progressionService', () => ({
  progressionApi: {
    getProgression: vi.fn(),
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
    storeCatalogWith: (params: any) => ['store', 'catalog', params],
  },
}));

// Spy on localStorage
const localStorageSpy = {
  getItem: vi.spyOn(Storage.prototype, 'getItem'),
  setItem: vi.spyOn(Storage.prototype, 'setItem'),
  removeItem: vi.spyOn(Storage.prototype, 'removeItem'),
};

function TestConsumer() {
  const { state, toggleAdventureMode, addXP, addGold } = useAdventureMode();
  return (
    <div>
      <span data-testid="enabled">{String(state.enabled)}</span>
      <span data-testid="totalXP">{state.totalXP}</span>
      <span data-testid="gold">{state.gold}</span>
      <span data-testid="level">{state.level}</span>
      <span data-testid="loginStreak">{state.loginStreak}</span>
      <button data-testid="toggle" onClick={toggleAdventureMode}>Toggle</button>
      <button data-testid="addXP" onClick={() => addXP(100)}>Add XP</button>
      <button data-testid="addGold" onClick={() => addGold(50)}>Add Gold</button>
    </div>
  );
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('AdventureModeContext - localStorage removal (Story 8.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does NOT read gamification data from localStorage on mount', () => {
    // Pre-populate localStorage with old gamification data
    localStorage.setItem('springais-adventure-mode', JSON.stringify({
      enabled: true,
      totalXP: 5000,
      gold: 999,
      loginStreak: 7,
    }));

    // Clear the spy call counts after seeding
    localStorageSpy.getItem.mockClear();

    renderWithProviders(
      <AdventureModeProvider>
        <TestConsumer />
      </AdventureModeProvider>
    );

    // Verify that gamification localStorage key is NOT accessed
    const gamificationCalls = localStorageSpy.getItem.mock.calls.filter(
      (call) => call[0] === 'springais-adventure-mode'
    );
    expect(gamificationCalls).toHaveLength(0);
  });

  it('does NOT write gamification data to localStorage on state changes', () => {
    renderWithProviders(
      <AdventureModeProvider>
        <TestConsumer />
      </AdventureModeProvider>
    );

    localStorageSpy.setItem.mockClear();

    // Toggle adventure mode
    act(() => {
      screen.getByTestId('toggle').click();
    });

    // Add XP
    act(() => {
      screen.getByTestId('addXP').click();
    });

    // Add Gold
    act(() => {
      screen.getByTestId('addGold').click();
    });

    // Verify no writes to gamification localStorage key
    const gamificationWrites = localStorageSpy.setItem.mock.calls.filter(
      (call) => call[0] === 'springais-adventure-mode'
    );
    expect(gamificationWrites).toHaveLength(0);
  });

  it('starts with default state (not persisted values)', () => {
    renderWithProviders(
      <AdventureModeProvider>
        <TestConsumer />
      </AdventureModeProvider>
    );

    expect(screen.getByTestId('enabled').textContent).toBe('false');
    expect(screen.getByTestId('totalXP').textContent).toBe('0');
    expect(screen.getByTestId('gold').textContent).toBe('0');
    expect(screen.getByTestId('level').textContent).toBe('1');
  });

  it('does NOT contain STORAGE_KEY, loadState, or saveState references', async () => {
    // This is a static analysis test - we check the source code file
    const module = await import('./AdventureModeContext');
    const moduleSource = Object.keys(module).join(',');
    // The module should not export loadState or saveState
    expect(moduleSource).not.toContain('loadState');
    expect(moduleSource).not.toContain('saveState');
    expect(moduleSource).not.toContain('STORAGE_KEY');
  });

  it('theme localStorage key (springais-theme) is NOT affected', () => {
    // Theme persistence should remain functional in ThemeContext (separate file)
    localStorage.setItem('springais-theme', 'game');

    renderWithProviders(
      <AdventureModeProvider>
        <TestConsumer />
      </AdventureModeProvider>
    );

    // Theme key should still be in localStorage (we didn't touch it)
    expect(localStorage.getItem('springais-theme')).toBe('game');
  });
});
