import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BadgeSearch from './BadgeSearch';

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
const mockSearchCatalog = vi.fn();
vi.mock('../../services/badgeService', () => ({
  searchCatalog: (...args: unknown[]) => mockSearchCatalog(...args),
}));

const mockBadges = [
  {
    id: 'badge-1',
    name: 'Azure Solutions Architect Expert',
    issuer: 'Microsoft',
    platform: 'microsoft',
    url: 'https://learn.microsoft.com/cert/azure-architect',
    skills: ['azure'],
    difficulty_level: 'expert' as const,
    relevance_score: 1.0,
    mapping_source: 'curated' as const,
  },
  {
    id: 'badge-2',
    name: 'AWS Solutions Architect',
    issuer: 'Amazon Web Services',
    platform: 'aws',
    url: 'https://aws.amazon.com/cert',
    skills: ['aws'],
    relevance_score: 0.9,
    mapping_source: 'curated' as const,
  },
];

describe('BadgeSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('renders search input with placeholder', () => {
    render(<BadgeSearch onSelect={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search certifications...')).toBeTruthy();
  });

  it('renders custom placeholder', () => {
    render(<BadgeSearch onSelect={vi.fn()} placeholder="Find badges..." />);
    expect(screen.getByPlaceholderText('Find badges...')).toBeTruthy();
  });

  it('does not search for queries shorter than 2 characters', () => {
    render(<BadgeSearch onSelect={vi.fn()} />);
    fireEvent.change(screen.getByTestId('badge-search-input'), { target: { value: 'a' } });
    vi.advanceTimersByTime(400);
    expect(mockSearchCatalog).not.toHaveBeenCalled();
  });

  it('debounces search calls by 300ms', async () => {
    mockSearchCatalog.mockResolvedValue({ results: mockBadges, count: 2 });
    vi.useRealTimers();

    render(<BadgeSearch onSelect={vi.fn()} />);
    fireEvent.change(screen.getByTestId('badge-search-input'), { target: { value: 'Az' } });

    // Should not call immediately
    expect(mockSearchCatalog).not.toHaveBeenCalled();

    // Wait for debounce
    await waitFor(() => {
      expect(mockSearchCatalog).toHaveBeenCalledWith('Az', 10);
    }, { timeout: 500 });
  });

  it('shows dropdown with results', async () => {
    mockSearchCatalog.mockResolvedValue({ results: mockBadges, count: 2 });
    vi.useRealTimers();

    render(<BadgeSearch onSelect={vi.fn()} />);
    fireEvent.change(screen.getByTestId('badge-search-input'), { target: { value: 'Azure' } });

    await waitFor(() => {
      expect(screen.getByText('Azure Solutions Architect Expert')).toBeTruthy();
      expect(screen.getByText('AWS Solutions Architect')).toBeTruthy();
    }, { timeout: 500 });
  });

  it('calls onSelect with badge data when result is clicked', async () => {
    mockSearchCatalog.mockResolvedValue({ results: mockBadges, count: 2 });
    vi.useRealTimers();

    const onSelect = vi.fn();
    render(<BadgeSearch onSelect={onSelect} />);
    fireEvent.change(screen.getByTestId('badge-search-input'), { target: { value: 'Azure' } });

    await waitFor(() => {
      expect(screen.getByText('Azure Solutions Architect Expert')).toBeTruthy();
    }, { timeout: 500 });

    fireEvent.click(screen.getByText('Azure Solutions Architect Expert'));
    expect(onSelect).toHaveBeenCalledWith(mockBadges[0]);
  });

  it('clears input after selection', async () => {
    mockSearchCatalog.mockResolvedValue({ results: mockBadges, count: 2 });
    vi.useRealTimers();

    render(<BadgeSearch onSelect={vi.fn()} />);
    const input = screen.getByTestId('badge-search-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Azure' } });

    await waitFor(() => {
      expect(screen.getByText('Azure Solutions Architect Expert')).toBeTruthy();
    }, { timeout: 500 });

    fireEvent.click(screen.getByText('Azure Solutions Architect Expert'));
    expect(input.value).toBe('');
  });

  it('does not show dropdown for empty results', async () => {
    mockSearchCatalog.mockResolvedValue({ results: [], count: 0 });
    vi.useRealTimers();

    render(<BadgeSearch onSelect={vi.fn()} />);
    fireEvent.change(screen.getByTestId('badge-search-input'), { target: { value: 'xyznonexistent' } });

    await waitFor(() => {
      expect(mockSearchCatalog).toHaveBeenCalled();
    }, { timeout: 500 });

    expect(screen.queryByTestId('badge-search-dropdown')).toBeNull();
  });
});
