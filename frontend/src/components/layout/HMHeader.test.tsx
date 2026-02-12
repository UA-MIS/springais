import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HMHeader from './HMHeader';

// Mock ThemeContext
vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', isDark: true, isGame: false }),
  themeColors: {
    dark: {
      headerBg: '#1a1a2e',
      border: '#333',
      accent: '#f59e0b',
      textSecondary: '#aaa',
    },
  },
}));

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'HM User', role: 'HM' } }),
}));

// Mock game components
vi.mock('../game', () => ({
  ThemeSwitcher: () => <div data-testid="theme-switcher" />,
}));

// Mock LogoutButton
vi.mock('../auth/LogoutButton', () => ({
  default: () => <button data-testid="logout-button">Logout</button>,
}));

// Variable to control adventure mode state in tests
let mockAdventureEnabled = false;

vi.mock('../../context/AdventureModeContext', () => ({
  useAdventureMode: () => ({
    state: { enabled: mockAdventureEnabled },
  }),
}));

describe('HMHeader', () => {
  it('shows SkillBridge in standard mode', () => {
    mockAdventureEnabled = false;
    render(
      <MemoryRouter>
        <HMHeader />
      </MemoryRouter>
    );
    expect(screen.getByText('SkillBridge')).toBeTruthy();
    expect(screen.queryByText(/SkillQuest/)).toBeNull();
  });

  it('shows SkillQuest with sword emoji in adventure mode', () => {
    mockAdventureEnabled = true;
    render(
      <MemoryRouter>
        <HMHeader />
      </MemoryRouter>
    );
    expect(screen.getByText(/SkillQuest/)).toBeTruthy();
  });

  it('shows "By SkillBridge" subtitle in adventure mode', () => {
    mockAdventureEnabled = true;
    render(
      <MemoryRouter>
        <HMHeader />
      </MemoryRouter>
    );
    expect(screen.getByText('By SkillBridge')).toBeTruthy();
  });

  it('does not show "By SkillBridge" subtitle in standard mode', () => {
    mockAdventureEnabled = false;
    render(
      <MemoryRouter>
        <HMHeader />
      </MemoryRouter>
    );
    expect(screen.queryByText('By SkillBridge')).toBeNull();
  });

  it('shows Hiring Manager badge', () => {
    mockAdventureEnabled = false;
    render(
      <MemoryRouter>
        <HMHeader />
      </MemoryRouter>
    );
    expect(screen.getByText('Hiring Manager')).toBeTruthy();
  });
});
