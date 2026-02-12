import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';

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
  useAuth: () => ({ user: { name: 'Test User', role: 'IC' } }),
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
  getFantasyText: (text: string, enabled: boolean) => (enabled ? `Fantasy ${text}` : text),
}));

describe('Header', () => {
  it('shows SkillBridge in standard mode', () => {
    mockAdventureEnabled = false;
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(screen.getByText('SkillBridge')).toBeTruthy();
    expect(screen.queryByText(/SkillQuest/)).toBeNull();
  });

  it('shows SkillQuest with sword emoji in adventure mode', () => {
    mockAdventureEnabled = true;
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(screen.getByText(/SkillQuest/)).toBeTruthy();
  });

  it('shows "By SkillBridge" subtitle in adventure mode', () => {
    mockAdventureEnabled = true;
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(screen.getByText('By SkillBridge')).toBeTruthy();
  });

  it('does not show "By SkillBridge" subtitle in standard mode', () => {
    mockAdventureEnabled = false;
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(screen.queryByText('By SkillBridge')).toBeNull();
  });
});
