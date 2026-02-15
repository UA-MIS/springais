import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdventureHUD from './AdventureHUD';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { whileHover, whileTap, initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock AchievementsPanel
vi.mock('./AchievementsPanel', () => ({
  default: () => <div data-testid="achievements-panel" />,
}));

// Mock ThemeContext
vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'game',
    isDark: true,
    isGame: true,
  }),
  themeColors: {
    game: {
      sidebarBg: '#1a1a2e',
      border: '#333',
      accent: '#ffd700',
      textSecondary: '#ccc',
      textPrimary: '#fff',
      textMuted: '#999',
    },
  },
}));

// Mock AdventureModeContext
let mockAdventureState: any = {};

vi.mock('../../context/AdventureModeContext', () => ({
  useAdventureMode: () => ({
    state: mockAdventureState,
    toggleAdventureMode: vi.fn(),
    enableAdventureMode: vi.fn(),
    disableAdventureMode: vi.fn(),
    addXP: vi.fn(),
    addGold: vi.fn(),
    spendGold: vi.fn(),
    unlockAchievement: vi.fn(),
    getAchievements: vi.fn().mockReturnValue([]),
    isAchievementUnlocked: vi.fn().mockReturnValue(false),
    incrementSkillsCompleted: vi.fn(),
    trackPageVisit: vi.fn(),
    recordLogin: vi.fn(),
    recordVisit: vi.fn(),
    clearRecentXP: vi.fn(),
    clearRecentGold: vi.fn(),
    clearRecentAchievement: vi.fn(),
    clearLevelUp: vi.fn(),
  }),
  getFantasyText: (text: string, adventureMode: boolean) => {
    if (!adventureMode) return text;
    const map: Record<string, string> = {
      Store: "Merchant's Armory",
      Quests: "Adventurer's Guild",
    };
    return map[text] || text;
  },
}));

function renderHUD() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdventureHUD />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('AdventureHUD - Dual-Track Display (Story 8.4)', () => {
  beforeEach(() => {
    mockAdventureState = {
      enabled: true,
      level: 5,
      totalXP: 1500,
      gold: 750,
      currentXP: 200,
      xpToNextLevel: 500,
      title: 'Journeyman',
      loginStreak: 3,
      lastLoginDate: '2026-02-10',
      loading: false,
      unlockedAchievements: ['first_login', 'first_match'],
      completedSkillsCount: 2,
      visitedPages: [],
      recentXPGain: null,
      recentGoldGain: null,
      recentAchievement: null,
      levelUpPending: false,
      newLevel: null,
    };
  });

  it('returns null when adventure mode is disabled', () => {
    mockAdventureState = { ...mockAdventureState, enabled: false };
    const { container } = renderHUD();
    expect(container.innerHTML).toBe('');
  });

  it('displays level number and title', () => {
    renderHUD();
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('Journeyman')).toBeDefined();
  });

  it('displays XP progress bar with current/max values', () => {
    renderHUD();
    expect(screen.getByText('200 / 500')).toBeDefined();
  });

  it('displays coin/gold balance', () => {
    renderHUD();
    expect(screen.getByText('750')).toBeDefined();
  });

  it('displays login streak when > 1', () => {
    renderHUD();
    expect(screen.getByText('3')).toBeDefined();
  });

  it('shows Store quick-access link', () => {
    renderHUD();
    const storeLink = screen.getByRole('link', { name: /store|merchant/i });
    expect(storeLink).toBeDefined();
    expect(storeLink.getAttribute('href')).toBe('/store');
  });

  it('shows Quests quick-access link when level >= 3', () => {
    renderHUD();
    const questsLink = screen.getByRole('link', { name: /quest|guild/i });
    expect(questsLink).toBeDefined();
    expect(questsLink.getAttribute('href')).toBe('/quests');
  });

  it('does NOT show Quests link when level < 3', () => {
    mockAdventureState = { ...mockAdventureState, level: 2 };
    renderHUD();
    const questsLink = screen.queryByRole('link', { name: /quest|guild/i });
    expect(questsLink).toBeNull();
  });

  it('Store link is always shown when adventure mode is enabled', () => {
    mockAdventureState = { ...mockAdventureState, level: 1 };
    renderHUD();
    const storeLink = screen.getByRole('link', { name: /store|merchant/i });
    expect(storeLink).toBeDefined();
  });
});
