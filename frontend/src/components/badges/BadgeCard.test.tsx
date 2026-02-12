import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BadgeCard from './BadgeCard';

// Mock ThemeContext
vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', isDark: true, isGame: false }),
  themeColors: {
    dark: {
      textPrimary: '#fff',
      textSecondary: '#aaa',
      textMuted: '#666',
      accent: '#f59e0b',
      cardBorder: '#333',
    },
  },
}));

// Mock badgeService
const mockRecordInteraction = vi.fn().mockResolvedValue(undefined);
vi.mock('../../services/badgeService', () => ({
  recordInteraction: (...args: unknown[]) => mockRecordInteraction(...args),
}));

// Mock window.open
const mockOpen = vi.fn();
Object.defineProperty(window, 'open', { value: mockOpen, writable: true });

const baseBadge = {
  name: 'Azure Solutions Architect Expert',
  provider: 'Microsoft',
  url: 'https://learn.microsoft.com/cert/azure-architect',
  difficulty_level: 'expert',
  estimated_cost_usd: 165,
  estimated_hours: 120,
  badge_id: 'badge-uuid-123',
};

describe('BadgeCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders compact mode with badge name and provider', () => {
    render(<BadgeCard badge={baseBadge} source="roadmap" compact />);
    expect(screen.getByText('Azure Solutions Architect Expert')).toBeTruthy();
    expect(screen.getByText(/Microsoft/)).toBeTruthy();
  });

  it('renders compact mode with difficulty level', () => {
    render(<BadgeCard badge={baseBadge} source="roadmap" compact />);
    expect(screen.getByText('expert')).toBeTruthy();
  });

  it('renders compact mode with cost', () => {
    render(<BadgeCard badge={baseBadge} source="roadmap" compact />);
    expect(screen.getByText(/\$165/)).toBeTruthy();
  });

  it('renders full mode by default', () => {
    render(<BadgeCard badge={baseBadge} source="roadmap" />);
    expect(screen.getByTestId('badge-card-full')).toBeTruthy();
    expect(screen.getByText('View Badge')).toBeTruthy();
  });

  it('opens URL on click in compact mode', () => {
    render(<BadgeCard badge={baseBadge} source="roadmap" compact />);
    fireEvent.click(screen.getByTestId('badge-card-compact'));
    expect(mockOpen).toHaveBeenCalledWith(
      'https://learn.microsoft.com/cert/azure-architect',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('records interaction on click when badge_id is present', () => {
    render(<BadgeCard badge={baseBadge} source="roadmap" compact />);
    fireEvent.click(screen.getByTestId('badge-card-compact'));
    expect(mockRecordInteraction).toHaveBeenCalledWith('badge-uuid-123', 'click', 'roadmap');
  });

  it('does not record interaction when badge_id is absent', () => {
    const noBadgeId = { ...baseBadge, badge_id: undefined };
    render(<BadgeCard badge={noBadgeId} source="roadmap" compact />);
    fireEvent.click(screen.getByTestId('badge-card-compact'));
    expect(mockRecordInteraction).not.toHaveBeenCalled();
    expect(mockOpen).toHaveBeenCalled();
  });

  it('hides difficulty when not provided', () => {
    const noDifficulty = { ...baseBadge, difficulty_level: undefined };
    render(<BadgeCard badge={noDifficulty} source="roadmap" compact />);
    expect(screen.queryByText('expert')).toBeNull();
  });

  it('hides cost when not provided', () => {
    const noCost = { ...baseBadge, estimated_cost_usd: undefined };
    render(<BadgeCard badge={noCost} source="roadmap" compact />);
    expect(screen.queryByText(/\$165/)).toBeNull();
  });

  it('shows hours in full mode when provided', () => {
    render(<BadgeCard badge={baseBadge} source="roadmap" />);
    expect(screen.getByText(/~120h/)).toBeTruthy();
  });
});
