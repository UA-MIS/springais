import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MilestoneCard from './MilestoneCard';

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

// Mock useRoadmap hook
vi.mock('../../hooks/useRoadmap', () => ({
  useRoadmap: () => ({
    toggleMilestone: vi.fn(),
    isMilestoneCompleted: () => false,
    getMilestoneProgress: () => null,
    expandedMilestones: new Set(['cert-milestone-1']),
    toggleMilestoneExpanded: vi.fn(),
    updateMilestoneNotes: vi.fn(),
    isManualEditing: false,
  }),
}));

// Mock BadgeCard to verify it receives correct props
vi.mock('../badges/BadgeCard', () => ({
  default: ({ badge, source, compact }: { badge: { name: string }; source: string; compact: boolean }) => (
    <div data-testid="mock-badge-card" data-source={source} data-compact={String(compact)}>
      {badge.name}
    </div>
  ),
}));

// Mock badgeService (needed by BadgeCard)
vi.mock('../../services/badgeService', () => ({
  recordInteraction: vi.fn().mockResolvedValue(undefined),
}));

const baseMilestone = {
  id: 'cert-milestone-1',
  title: 'Get Azure Certified',
  description: 'Earn Azure certification',
  category: 'certification' as const,
  priority: 'high' as const,
  estimated_duration_months: 3,
  prerequisites: [],
  skills_to_develop: ['azure'],
  resources: ['Study Azure documentation'],
  success_indicators: ['Pass the exam'],
};

describe('MilestoneCard - Certifications rendering', () => {
  it('renders certifications section when certifications are present', () => {
    const milestone = {
      ...baseMilestone,
      certifications: [
        {
          name: 'Azure Solutions Architect Expert',
          provider: 'Microsoft',
          url: 'https://learn.microsoft.com/cert/azure-architect',
          difficulty_level: 'expert',
          estimated_cost_usd: 165,
        },
      ],
    };

    render(<MilestoneCard milestone={milestone} phaseId="phase-1" />);

    // The milestone is expanded (see mock), so certifications should render
    expect(screen.getByText('Recommended Certifications')).toBeTruthy();
    expect(screen.getByText('Azure Solutions Architect Expert')).toBeTruthy();
  });

  it('renders multiple certification badges', () => {
    const milestone = {
      ...baseMilestone,
      certifications: [
        {
          name: 'Azure Solutions Architect Expert',
          provider: 'Microsoft',
          url: 'https://learn.microsoft.com/cert/azure-architect',
        },
        {
          name: 'AWS Solutions Architect',
          provider: 'AWS',
          url: 'https://aws.amazon.com/cert',
        },
      ],
    };

    render(<MilestoneCard milestone={milestone} phaseId="phase-1" />);

    const badges = screen.getAllByTestId('mock-badge-card');
    expect(badges.length).toBe(2);
    expect(badges[0].textContent).toContain('Azure Solutions Architect Expert');
    expect(badges[1].textContent).toContain('AWS Solutions Architect');
  });

  it('passes compact and roadmap source to BadgeCard', () => {
    const milestone = {
      ...baseMilestone,
      certifications: [
        {
          name: 'PMP',
          provider: 'PMI',
          url: 'https://pmi.org/pmp',
        },
      ],
    };

    render(<MilestoneCard milestone={milestone} phaseId="phase-1" />);

    const badge = screen.getByTestId('mock-badge-card');
    expect(badge.getAttribute('data-source')).toBe('roadmap');
    expect(badge.getAttribute('data-compact')).toBe('true');
  });

  it('does not render certifications section when array is empty', () => {
    const milestone = {
      ...baseMilestone,
      certifications: [],
    };

    render(<MilestoneCard milestone={milestone} phaseId="phase-1" />);
    expect(screen.queryByText('Recommended Certifications')).toBeNull();
  });

  it('does not render certifications section when undefined', () => {
    render(<MilestoneCard milestone={baseMilestone} phaseId="phase-1" />);
    expect(screen.queryByText('Recommended Certifications')).toBeNull();
  });

  it('still renders resources alongside certifications', () => {
    const milestone = {
      ...baseMilestone,
      certifications: [
        {
          name: 'Azure Cert',
          provider: 'Microsoft',
          url: 'https://example.com',
        },
      ],
    };

    render(<MilestoneCard milestone={milestone} phaseId="phase-1" />);

    expect(screen.getByText('Resources & Actions')).toBeTruthy();
    expect(screen.getByText('Recommended Certifications')).toBeTruthy();
  });
});
