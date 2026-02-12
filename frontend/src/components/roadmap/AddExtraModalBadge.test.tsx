import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AddExtraModal from './AddExtraModal';

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

// Mock useRoadmap
vi.mock('../../hooks/useRoadmap', () => ({
  useRoadmap: () => ({
    addExtra: vi.fn().mockResolvedValue(undefined),
  }),
}));

// Mock BadgeSearch
let capturedOnSelect: ((badge: unknown) => void) | null = null;
vi.mock('../badges/BadgeSearch', () => ({
  default: ({ onSelect, placeholder }: { onSelect: (badge: unknown) => void; placeholder?: string }) => {
    capturedOnSelect = onSelect;
    return (
      <div data-testid="mock-badge-search" data-placeholder={placeholder}>
        Badge Search Mock
      </div>
    );
  },
}));

// Mock badgeService
vi.mock('../../services/badgeService', () => ({
  searchCatalog: vi.fn().mockResolvedValue({ results: [], count: 0 }),
}));

describe('AddExtraModal - Badge Search Integration', () => {
  it('does not show badge search when category is not certification', () => {
    render(<AddExtraModal phaseId="phase-1" onClose={vi.fn()} />);
    // Default category is 'achievement', not 'certification'
    expect(screen.queryByTestId('mock-badge-search')).toBeNull();
  });

  it('shows badge search when certification category is selected', () => {
    render(<AddExtraModal phaseId="phase-1" onClose={vi.fn()} />);

    // Click the Certification category button
    fireEvent.click(screen.getByText('Certification'));

    expect(screen.getByTestId('mock-badge-search')).toBeTruthy();
  });

  it('populates title when a badge is selected from search', () => {
    render(<AddExtraModal phaseId="phase-1" onClose={vi.fn()} />);

    // Switch to certification category
    fireEvent.click(screen.getByText('Certification'));

    // Simulate badge selection via the captured callback
    expect(capturedOnSelect).not.toBeNull();
    act(() => {
      capturedOnSelect!({
        id: 'badge-1',
        name: 'Azure Solutions Architect Expert',
        issuer: 'Microsoft',
        platform: 'microsoft',
        url: 'https://learn.microsoft.com/cert/azure-architect',
        skills: ['azure'],
        difficulty_level: 'expert',
        estimated_cost_usd: 165,
        relevance_score: 1.0,
        mapping_source: 'curated',
      });
    });

    // Title input should be populated
    const titleInput = screen.getByDisplayValue('Azure Solutions Architect Expert');
    expect(titleInput).toBeTruthy();
  });

  it('populates description with badge details on selection', () => {
    render(<AddExtraModal phaseId="phase-1" onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('Certification'));

    act(() => {
      capturedOnSelect!({
        id: 'badge-1',
        name: 'Test Badge',
        issuer: 'Test Issuer',
        platform: 'other',
        url: 'https://example.com',
        skills: [],
        difficulty_level: 'intermediate',
        estimated_cost_usd: 100,
        relevance_score: 1.0,
        mapping_source: 'curated',
      });
    });

    // Description should contain issuer and URL
    const descInput = document.querySelector('textarea') as HTMLTextAreaElement;
    expect(descInput.value).toContain('Test Issuer');
    expect(descInput.value).toContain('https://example.com');
    expect(descInput.value).toContain('intermediate');
    expect(descInput.value).toContain('$100');
  });

  it('hides badge search when switching away from certification', () => {
    render(<AddExtraModal phaseId="phase-1" onClose={vi.fn()} />);

    // Show badge search
    fireEvent.click(screen.getByText('Certification'));
    expect(screen.getByTestId('mock-badge-search')).toBeTruthy();

    // Switch to a different category
    fireEvent.click(screen.getByText('Skill'));
    expect(screen.queryByTestId('mock-badge-search')).toBeNull();
  });
});
