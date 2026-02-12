import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import BadgeSection from './BadgeSection';
import { ThemeProvider } from '../../context/ThemeContext';

const mockBadges = [
  {
    id: 'badge-1',
    name: 'Azure Solutions Architect Expert',
    issuer: 'Microsoft',
    platform: 'microsoft',
    url: 'https://learn.microsoft.com/certifications/azure-solutions-architect',
    skills: ['azure'],
    difficulty_level: 'advanced' as const,
    estimated_cost_usd: 165,
    estimated_hours: 120,
    relevance_score: 0.95,
    mapping_source: 'curated' as const,
  },
  {
    id: 'badge-2',
    name: 'Azure Developer Associate',
    issuer: 'Microsoft',
    platform: 'microsoft',
    url: 'https://learn.microsoft.com/certifications/azure-developer',
    skills: ['azure'],
    difficulty_level: 'intermediate' as const,
    relevance_score: 0.85,
    mapping_source: 'api' as const,
  },
];

vi.mock('../../services/badgeService', () => ({
  discoverBadges: vi.fn(),
  recordInteraction: vi.fn().mockResolvedValue(undefined),
}));

import { discoverBadges } from '../../services/badgeService';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('BadgeSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton initially', () => {
    vi.mocked(discoverBadges).mockReturnValue(new Promise(() => {})); // never resolves
    renderWithTheme(<BadgeSection skillName="Azure" />);
    expect(screen.getByText('Badges & Certifications')).toBeInTheDocument();
    // Check for skeleton elements
    const pulseElements = document.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBe(3);
  });

  it('renders badges after successful fetch', async () => {
    vi.mocked(discoverBadges).mockResolvedValue({
      badges: mockBadges,
      total_count: 2,
      page: 1,
      per_page: 20,
      skills_queried: ['azure'],
    });

    renderWithTheme(<BadgeSection skillName="Azure" />);

    await waitFor(() => {
      expect(screen.getByText('Badges & Certifications (2)')).toBeInTheDocument();
    });
    expect(screen.getByText('Azure Solutions Architect Expert')).toBeInTheDocument();
    expect(screen.getByText('Azure Developer Associate')).toBeInTheDocument();
  });

  it('calls discoverBadges with the skill name', async () => {
    vi.mocked(discoverBadges).mockResolvedValue({
      badges: [],
      total_count: 0,
      page: 1,
      per_page: 20,
      skills_queried: ['python'],
    });

    renderWithTheme(<BadgeSection skillName="Python" />);

    await waitFor(() => {
      expect(discoverBadges).toHaveBeenCalledWith(['Python']);
    });
  });

  it('shows error state with Credly fallback link on failure', async () => {
    vi.mocked(discoverBadges).mockRejectedValue(new Error('Network error'));

    renderWithTheme(<BadgeSection skillName="Azure" />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load badge suggestions.')).toBeInTheDocument();
    });
    const credlyLink = screen.getByText(/Search EY badges for Azure on Credly/);
    expect(credlyLink).toBeInTheDocument();
    expect(credlyLink.closest('a')).toHaveAttribute(
      'href',
      'https://www.credly.com/organizations/ey/badges?search=Azure'
    );
  });

  it('shows empty state with Credly fallback when no badges found', async () => {
    vi.mocked(discoverBadges).mockResolvedValue({
      badges: [],
      total_count: 0,
      page: 1,
      per_page: 20,
      skills_queried: ['obscure-skill'],
    });

    renderWithTheme(<BadgeSection skillName="obscure-skill" />);

    await waitFor(() => {
      expect(screen.getByText('No badges found for this skill.')).toBeInTheDocument();
    });
    expect(screen.getByText(/Search EY badges for obscure-skill on Credly/)).toBeInTheDocument();
  });

  it('shows degraded message when total_count exceeds returned badges', async () => {
    vi.mocked(discoverBadges).mockResolvedValue({
      badges: [mockBadges[0]],
      total_count: 5,
      page: 1,
      per_page: 20,
      skills_queried: ['azure'],
    });

    renderWithTheme(<BadgeSection skillName="Azure" />);

    await waitFor(() => {
      expect(
        screen.getByText('Some results may be limited due to external service availability.')
      ).toBeInTheDocument();
    });
  });

  it('does not show degraded message when all results are returned', async () => {
    vi.mocked(discoverBadges).mockResolvedValue({
      badges: mockBadges,
      total_count: 2,
      page: 1,
      per_page: 20,
      skills_queried: ['azure'],
    });

    renderWithTheme(<BadgeSection skillName="Azure" />);

    await waitFor(() => {
      expect(screen.getByText('Badges & Certifications (2)')).toBeInTheDocument();
    });
    expect(
      screen.queryByText('Some results may be limited due to external service availability.')
    ).toBeNull();
  });

  it('maps Badge issuer to BadgeCardBadge provider correctly', async () => {
    vi.mocked(discoverBadges).mockResolvedValue({
      badges: mockBadges,
      total_count: 2,
      page: 1,
      per_page: 20,
      skills_queried: ['azure'],
    });

    renderWithTheme(<BadgeSection skillName="Azure" />);

    await waitFor(() => {
      // The provider (mapped from issuer) should appear in the rendered cards
      const microsoftTexts = screen.getAllByText(/Microsoft/);
      expect(microsoftTexts.length).toBeGreaterThan(0);
    });
  });
});
