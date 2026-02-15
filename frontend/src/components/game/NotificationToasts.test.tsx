import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import NotificationToasts from './NotificationToasts';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { whileHover, whileTap, initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    span: ({ children, ...props }: any) => {
      const { whileHover, whileTap, initial, animate, exit, transition, ...rest } = props;
      return <span {...rest}>{children}</span>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
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
      textMuted: '#999',
      textPrimary: '#fff',
    },
  },
}));

// Mock AdventureModeContext
let mockAdventureState: any = {};
const mockClearLevelUp = vi.fn();
const mockClearRecentXP = vi.fn();
const mockClearRecentGold = vi.fn();
const mockClearRecentAchievement = vi.fn();
const mockClearQuestComplete = vi.fn();

vi.mock('../../context/AdventureModeContext', () => ({
  useAdventureMode: () => ({
    state: mockAdventureState,
    clearRecentXP: mockClearRecentXP,
    clearRecentGold: mockClearRecentGold,
    clearRecentAchievement: mockClearRecentAchievement,
    clearLevelUp: mockClearLevelUp,
    clearQuestComplete: mockClearQuestComplete,
  }),
}));

describe('NotificationToasts - Level-Up Celebration (Story 8.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
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
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when adventure mode is disabled', () => {
    mockAdventureState = { ...mockAdventureState, enabled: false };
    const { container } = render(<NotificationToasts />);
    expect(container.innerHTML).toBe('');
  });

  it('does NOT show level-up toast when levelUpPending is false', () => {
    render(<NotificationToasts />);
    expect(screen.queryByText('Level Up!')).toBeNull();
  });

  it('shows level-up toast with "Level Up!" header when levelUpPending is true', () => {
    mockAdventureState = {
      ...mockAdventureState,
      levelUpPending: true,
      newLevel: 6,
      newTitle: 'Adept',
      levelUpCoinBonus: 150,
    };
    render(<NotificationToasts />);
    expect(screen.getByText('Level Up!')).toBeDefined();
  });

  it('shows the new level number in level-up toast', () => {
    mockAdventureState = {
      ...mockAdventureState,
      levelUpPending: true,
      newLevel: 6,
      newTitle: 'Adept',
      levelUpCoinBonus: 150,
    };
    render(<NotificationToasts />);
    expect(screen.getByText('Level 6')).toBeDefined();
  });

  it('shows the new title in level-up toast', () => {
    mockAdventureState = {
      ...mockAdventureState,
      levelUpPending: true,
      newLevel: 6,
      newTitle: 'Adept',
      levelUpCoinBonus: 150,
    };
    render(<NotificationToasts />);
    expect(screen.getByText('Adept')).toBeDefined();
  });

  it('shows coin bonus amount in level-up toast', () => {
    mockAdventureState = {
      ...mockAdventureState,
      levelUpPending: true,
      newLevel: 6,
      newTitle: 'Adept',
      levelUpCoinBonus: 150,
    };
    render(<NotificationToasts />);
    expect(screen.getByText('+150 bonus gold!')).toBeDefined();
  });

  it('shows unlocked features in level-up toast when present', () => {
    mockAdventureState = {
      ...mockAdventureState,
      levelUpPending: true,
      newLevel: 3,
      newTitle: 'Scout',
      levelUpCoinBonus: 75,
      unlockedFeatures: ['Side Quests'],
    };
    render(<NotificationToasts />);
    expect(screen.getByText('Side Quests')).toBeDefined();
  });

  it('calls clearLevelUp when level-up toast is clicked', () => {
    mockAdventureState = {
      ...mockAdventureState,
      levelUpPending: true,
      newLevel: 6,
      newTitle: 'Adept',
      levelUpCoinBonus: 150,
    };
    render(<NotificationToasts />);
    const toast = screen.getByText('Level Up!').closest('[class*="cursor-pointer"]');
    expect(toast).toBeDefined();
    act(() => {
      toast!.click();
    });
    expect(mockClearLevelUp).toHaveBeenCalledTimes(1);
  });

  it('shows XP gain toast when recentXPGain is present', () => {
    mockAdventureState = {
      ...mockAdventureState,
      recentXPGain: 200,
    };
    render(<NotificationToasts />);
    expect(screen.getByText('+200 XP')).toBeDefined();
  });

  it('shows gold gain toast when recentGoldGain is present', () => {
    mockAdventureState = {
      ...mockAdventureState,
      recentGoldGain: 100,
    };
    render(<NotificationToasts />);
    expect(screen.getByText('+100 Gold')).toBeDefined();
  });
});

describe('NotificationToasts - Quest Completion & Stacking (Story 8.6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  it('shows quest completion toast with quest name', () => {
    mockAdventureState = {
      ...mockAdventureState,
      recentQuestComplete: {
        questName: 'The First Steps',
        xpReward: 200,
        goldReward: 100,
      },
    };
    render(<NotificationToasts />);
    expect(screen.getByText('The First Steps')).toBeDefined();
  });

  it('shows quest completion toast with reward amounts', () => {
    mockAdventureState = {
      ...mockAdventureState,
      recentQuestComplete: {
        questName: 'The First Steps',
        xpReward: 200,
        goldReward: 100,
      },
    };
    render(<NotificationToasts />);
    expect(screen.getByText('+200 XP')).toBeDefined();
    expect(screen.getByText('+100 Gold')).toBeDefined();
  });

  it('shows cosmetic reward in quest completion toast when present', () => {
    mockAdventureState = {
      ...mockAdventureState,
      recentQuestComplete: {
        questName: 'The Dragon Slayer',
        xpReward: 500,
        goldReward: 250,
        cosmeticReward: 'Golden Cape',
      },
    };
    render(<NotificationToasts />);
    expect(screen.getByText('Golden Cape')).toBeDefined();
  });

  it('calls clearQuestComplete when quest toast is clicked', () => {
    mockAdventureState = {
      ...mockAdventureState,
      recentQuestComplete: {
        questName: 'The First Steps',
        xpReward: 200,
        goldReward: 100,
      },
    };
    render(<NotificationToasts />);
    const toast = screen.getByText('Quest Complete!').closest('[class*="cursor-pointer"]');
    expect(toast).toBeDefined();
    act(() => {
      toast!.click();
    });
    expect(mockClearQuestComplete).toHaveBeenCalledTimes(1);
  });

  it('multiple toasts stack when multiple notification types are active', () => {
    mockAdventureState = {
      ...mockAdventureState,
      recentXPGain: 200,
      recentGoldGain: 100,
      recentQuestComplete: {
        questName: 'The First Steps',
        xpReward: 200,
        goldReward: 100,
      },
    };
    render(<NotificationToasts />);
    // All three should be visible at once
    expect(screen.getByText('Experience Gained!')).toBeDefined();
    expect(screen.getByText('Gold Earned!')).toBeDefined();
    expect(screen.getByText('Quest Complete!')).toBeDefined();
  });

  it('shows "Quest Complete!" header on quest toast', () => {
    mockAdventureState = {
      ...mockAdventureState,
      recentQuestComplete: {
        questName: 'The First Steps',
        xpReward: 200,
        goldReward: 100,
      },
    };
    render(<NotificationToasts />);
    expect(screen.getByText('Quest Complete!')).toBeDefined();
  });
});
