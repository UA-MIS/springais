import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RoleSkillsGap from './RoleSkillsGap';
import { Match } from '../../services/mockMatchData';

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', isDark: true, isGame: false }),
  themeColors: {
    dark: {
      textPrimary: '#fff',
      textSecondary: '#aaa',
      textMuted: '#666',
      accent: '#f59e0b',
      cardBg: '#1a1a1a',
      cardBorder: '#333',
      border: '#333',
    },
  },
}));

const baseMatch: Match = {
  id: 'test-1',
  job_id: 'job-1',
  job_title: 'Test Role',
  service_line: 'Consulting',
  department: 'Tech',
  location: 'Remote',
  posted_date: '2026-01-01',
  experience_required: '3-5 years',
  overall_score: 0.85,
  skill_match_score: 0.9,
  experience_score: 0.8,
  role_fit_score: 0.7,
  matched_skills: ['Python', 'AWS'],
  skill_gaps: ['Kubernetes', 'Docker'],
  explanation: 'Good fit',
};

describe('RoleSkillsGap', () => {
  it('renders matched skills', () => {
    render(<RoleSkillsGap match={baseMatch} />);
    expect(screen.getByText('Python')).toBeTruthy();
    expect(screen.getByText('AWS')).toBeTruthy();
  });

  it('renders skill gaps', () => {
    render(<RoleSkillsGap match={baseMatch} />);
    expect(screen.getByText('Kubernetes')).toBeTruthy();
    expect(screen.getByText('Docker')).toBeTruthy();
  });

  it('does not render related skills section when transferable_skills is undefined', () => {
    render(<RoleSkillsGap match={baseMatch} />);
    expect(screen.queryByText(/Related Skills/)).toBeNull();
  });

  it('does not render related skills section when transferable_skills is empty', () => {
    const match = { ...baseMatch, transferable_skills: [] };
    render(<RoleSkillsGap match={match} />);
    expect(screen.queryByText(/Related Skills/)).toBeNull();
  });

  it('renders related skills section when transferable_skills are present', () => {
    const match = {
      ...baseMatch,
      transferable_skills: ['SQL', 'Leadership'],
    };
    render(<RoleSkillsGap match={match} />);
    expect(screen.getByText(/Related Skills \(2\)/)).toBeTruthy();
    expect(screen.getByText('SQL')).toBeTruthy();
    expect(screen.getByText('Leadership')).toBeTruthy();
  });

  it('shows related skills stat card when transferable_skills are present', () => {
    const match = {
      ...baseMatch,
      transferable_skills: ['SQL'],
    };
    render(<RoleSkillsGap match={match} />);
    // The stat card shows the count
    expect(screen.getByText('transferable skills')).toBeTruthy();
  });

  it('includes transferable count in total required skills', () => {
    const match = {
      ...baseMatch,
      matched_skills: ['Python'],
      transferable_skills: ['SQL'],
      skill_gaps: ['Docker'],
    };
    render(<RoleSkillsGap match={match} />);
    // Total = 1 matched + 1 transferable + 1 gap = 3
    expect(screen.getByText('of 3 required')).toBeTruthy();
  });

  it('shows recommendation about related skills when present', () => {
    const match = {
      ...baseMatch,
      transferable_skills: ['SQL', 'Leadership'],
    };
    render(<RoleSkillsGap match={match} />);
    expect(screen.getByText(/2 related skills that can help you bridge the gap/)).toBeTruthy();
  });

  it('uses singular form for single related skill in recommendation', () => {
    const match = {
      ...baseMatch,
      transferable_skills: ['SQL'],
    };
    render(<RoleSkillsGap match={match} />);
    expect(screen.getByText(/1 related skill that can help you bridge the gap/)).toBeTruthy();
  });

  it('renders skill match percentage', () => {
    render(<RoleSkillsGap match={baseMatch} />);
    expect(screen.getByText('90%')).toBeTruthy();
  });

  it('shows success message when no skill gaps', () => {
    const match = { ...baseMatch, skill_gaps: [] };
    render(<RoleSkillsGap match={match} />);
    expect(screen.getByText(/Great news! You have all the skills required/)).toBeTruthy();
  });
});
