import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AvatarCompanion from './AvatarCompanion';
import { AnimationState } from '../../context/CedricContext';

// Mock state holders (mutable)
let mockCedricState = {
  visibility: 'full' as const,
  position: { anchor: 'bottom-right' as const },
  animationState: AnimationState.Idle,
  animationQueue: [],
  currentMessage: null,
  speechQueue: [],
  walkthroughActive: false,
  walkthroughStep: 0,
  walkthroughComplete: false,
  isNewUser: false,
  quietMode: false,
  sessionMessageCount: 0,
  lastMessageTimestamp: 0,
  characterSheetOpen: false,
  reducedMotion: false,
};

let mockAdventureState = {
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

vi.mock('../../context/CedricContext', () => ({
  useCedric: () => ({
    state: mockCedricState,
    equippedItems: {},
    restore: vi.fn(),
    minimize: vi.fn(),
    toggleQuietMode: vi.fn(),
    openCharacterSheet: vi.fn(),
    closeCharacterSheet: vi.fn(),
    dismissCurrentMessage: vi.fn(),
    suppressMessageType: vi.fn(),
  }),
  AnimationState: {
    Idle: 'idle',
    Thinking: 'thinking',
    Pointing: 'pointing',
  },
}));

vi.mock('../../context/AdventureModeContext', () => ({
  useAdventureMode: () => ({
    state: mockAdventureState,
  }),
}));

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'game',
    isGame: true,
    isDark: false,
  }),
}));

function renderWithRouter(route = '/matches') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AvatarCompanion />
    </MemoryRouter>
  );
}

describe('AvatarCompanion', () => {
  beforeEach(() => {
    // Reset to defaults
    mockCedricState = {
      visibility: 'full',
      position: { anchor: 'bottom-right' },
      animationState: AnimationState.Idle,
      animationQueue: [],
      currentMessage: null,
      speechQueue: [],
      walkthroughActive: false,
      walkthroughStep: 0,
      walkthroughComplete: false,
      isNewUser: false,
      quietMode: false,
      sessionMessageCount: 0,
      lastMessageTimestamp: 0,
      characterSheetOpen: false,
      reducedMotion: false,
    };
    mockAdventureState = {
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
  });

  it('renders full avatar when adventure mode is enabled', () => {
    renderWithRouter();
    expect(screen.getByTestId('cedric-companion')).toBeInTheDocument();
  });

  it('renders nothing when adventure mode is off and user is not new', () => {
    mockAdventureState.enabled = false;
    mockCedricState.isNewUser = false;
    const { container } = renderWithRouter();
    expect(container.innerHTML).toBe('');
  });

  it('renders for new users even when adventure mode is off', () => {
    mockAdventureState.enabled = false;
    mockCedricState.isNewUser = true;
    renderWithRouter();
    // Should render either full or minimized view
    expect(
      screen.queryByTestId('cedric-companion') || screen.queryByTestId('cedric-minimized')
    ).toBeTruthy();
  });

  it('renders minimized state as a small button', () => {
    mockCedricState.visibility = 'minimized';
    renderWithRouter();
    expect(screen.getByTestId('cedric-minimized')).toBeInTheDocument();
  });

  it('renders nothing when visibility is hidden', () => {
    mockCedricState.visibility = 'hidden';
    const { container } = renderWithRouter();
    expect(container.innerHTML).toBe('');
  });

  it('applies fixed positioning with z-index 35', () => {
    renderWithRouter();
    const companion = screen.getByTestId('cedric-companion');
    expect(companion.style.position).toBe('fixed');
    expect(companion.style.zIndex).toBe('35');
    expect(companion.style.bottom).toBe('24px');
    expect(companion.style.right).toBe('24px');
  });
});
