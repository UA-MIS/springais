import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './Sidebar';

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
    },
  },
}));

// Mock AdventureModeContext
let mockAdventureState = {
  enabled: false,
  level: 1,
};

vi.mock('../../context/AdventureModeContext', () => ({
  useAdventureMode: () => ({
    state: {
      enabled: mockAdventureState.enabled,
      level: mockAdventureState.level,
      totalXP: 0,
      gold: 0,
      currentXP: 0,
      xpToNextLevel: 100,
      title: 'Apprentice',
      loginStreak: 0,
      lastLoginDate: null,
      loading: false,
      unlockedAchievements: [],
      completedSkillsCount: 0,
      visitedPages: [],
      recentXPGain: null,
      recentGoldGain: null,
      recentAchievement: null,
      levelUpPending: false,
      newLevel: null,
    },
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
      'Match Results': 'Quest Board',
      'Saved Roles': 'Quest Log',
      'Career Roadmap': 'Adventure Path',
      'My Profile': 'Hero Sheet',
      'Success Patterns': 'Victory Scrolls',
    };
    return map[text] || text;
  },
}));

function renderSidebar() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Sidebar - Navigation and Fantasy Text (Story 8.7)', () => {
  beforeEach(() => {
    mockAdventureState = { enabled: false, level: 1 };
  });

  it('shows standard navigation links', () => {
    renderSidebar();
    expect(screen.getByText('Match Results')).toBeDefined();
    expect(screen.getByText('Saved Roles')).toBeDefined();
    expect(screen.getByText('Career Roadmap')).toBeDefined();
    expect(screen.getByText('My Profile')).toBeDefined();
  });

  it('does NOT show Store or Quests when adventure mode is disabled', () => {
    mockAdventureState = { enabled: false, level: 5 };
    renderSidebar();
    expect(screen.queryByText('Store')).toBeNull();
    expect(screen.queryByText("Merchant's Armory")).toBeNull();
    expect(screen.queryByText('Quests')).toBeNull();
    expect(screen.queryByText("Adventurer's Guild")).toBeNull();
  });

  it('shows Store link when adventure mode is enabled', () => {
    mockAdventureState = { enabled: true, level: 1 };
    renderSidebar();
    expect(screen.getByText("Merchant's Armory")).toBeDefined();
  });

  it('does NOT show Quests when adventure mode is enabled but level < 3', () => {
    mockAdventureState = { enabled: true, level: 2 };
    renderSidebar();
    expect(screen.queryByText("Adventurer's Guild")).toBeNull();
    expect(screen.queryByText('Quests')).toBeNull();
  });

  it('shows Quests link when adventure mode is enabled AND level >= 3', () => {
    mockAdventureState = { enabled: true, level: 3 };
    renderSidebar();
    expect(screen.getByText("Adventurer's Guild")).toBeDefined();
  });

  it('uses fantasy text for nav labels when adventure mode is enabled', () => {
    mockAdventureState = { enabled: true, level: 5 };
    renderSidebar();
    // Standard labels should be replaced with fantasy text
    expect(screen.getByText('Quest Board')).toBeDefined();
    expect(screen.getByText('Quest Log')).toBeDefined();
    expect(screen.getByText('Adventure Path')).toBeDefined();
    expect(screen.getByText('Hero Sheet')).toBeDefined();
  });

  it('Store link navigates to /store', () => {
    mockAdventureState = { enabled: true, level: 1 };
    renderSidebar();
    const storeLink = screen.getByText("Merchant's Armory").closest('a');
    expect(storeLink?.getAttribute('href')).toBe('/store');
  });

  it('Quests link navigates to /quests', () => {
    mockAdventureState = { enabled: true, level: 3 };
    renderSidebar();
    const questsLink = screen.getByText("Adventurer's Guild").closest('a');
    expect(questsLink?.getAttribute('href')).toBe('/quests');
  });
});
