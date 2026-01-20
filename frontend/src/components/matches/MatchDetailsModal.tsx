import { useEffect } from 'react';
import { Match } from '../../services/mockMatchData';
import ProgressRing from '../common/ProgressRing';
import SkillGapDisplay from './SkillGapDisplay';

interface ThemeColors {
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  cardBg: string;
  cardBorder: string;
  border: string;
  accent: string;
}

interface MatchDetailsModalProps {
  match: Match | null;
  onClose: () => void;
  onSave: (matchId: string) => void;
  isDark: boolean;
  colors: ThemeColors;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

export default function MatchDetailsModal({ match, onClose, onSave, isDark, colors }: MatchDetailsModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (match) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [match]);

  if (!match) return null;

  const scorePercentage = Math.round(match.overall_score * 100);
  const skillMatchPercentage = Math.round(match.skill_match_score * 100);
  const experiencePercentage = Math.round(match.experience_score * 100);
  const growthPercentage = Math.round(match.growth_potential_score * 100);

  const sectionBgColor = isDark ? 'rgba(30, 30, 40, 0.5)' : 'rgba(0, 0, 0, 0.03)';
  const progressBgColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl"
        style={{
          backgroundColor: isDark ? '#18181b' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 rounded-sm transition-colors"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            border: `1px solid ${colors.border}`,
          }}
          aria-label="Close modal"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke={colors.textSecondary}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 pr-8">
              <h2
                className="text-3xl font-bold mb-3"
                style={{ color: colors.textPrimary }}
              >
                {match.job_title}
              </h2>
              <div className="space-y-2" style={{ color: colors.textMuted }}>
                <p
                  className="text-lg font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  {match.service_line} · {match.department}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span>{match.location}</span>
                  {match.experience_required && (
                    <span>{match.experience_required}</span>
                  )}
                  {match.salary_range && (
                    <span>{match.salary_range}</span>
                  )}
                  <span>Posted {formatDate(match.posted_date)}</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="text-center mb-2">
                <ProgressRing percentage={scorePercentage} size={120} strokeWidth={10} />
              </div>
              <p
                className="text-sm text-center"
                style={{ color: colors.textMuted }}
              >
                Overall Match
              </p>
            </div>
          </div>

          {/* Match Score Breakdown */}
          <div
            className="mb-6 p-4 rounded-sm"
            style={{
              backgroundColor: sectionBgColor,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: colors.textPrimary }}
            >
              Match Score Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: colors.textMuted }}>Skill Match</span>
                  <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{skillMatchPercentage}%</span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: progressBgColor }}
                >
                  <div
                    className="h-full bg-[#22C55E] transition-all"
                    style={{ width: `${skillMatchPercentage}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: colors.textMuted }}>Experience</span>
                  <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{experiencePercentage}%</span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: progressBgColor }}
                >
                  <div
                    className="h-full transition-all"
                    style={{ width: `${experiencePercentage}%`, backgroundColor: colors.accent }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: colors.textMuted }}>Growth Potential</span>
                  <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{growthPercentage}%</span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: progressBgColor }}
                >
                  <div
                    className="h-full bg-[#3B82F6] transition-all"
                    style={{ width: `${growthPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Why You Were Matched */}
          <div
            className="mb-6 p-5 rounded-sm"
            style={{
              backgroundColor: sectionBgColor,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: colors.textPrimary }}
            >
              Why You Were Matched
            </h3>
            <p
              className="leading-relaxed"
              style={{ color: colors.textSecondary }}
            >
              {match.explanation}
            </p>
          </div>

          {/* Skill Gap Analysis */}
          <div className="mb-6">
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: colors.textPrimary }}
            >
              Skill Analysis
            </h3>
            <SkillGapDisplay
              matched_skills={match.matched_skills}
              skill_gaps={match.skill_gaps}
              skill_match_score={match.skill_match_score}
              isDark={isDark}
              colors={colors}
            />
          </div>

          {/* Job Details Section */}
          <div
            className="mb-6 p-5 rounded-sm"
            style={{
              backgroundColor: sectionBgColor,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: colors.textPrimary }}
            >
              Job Details
            </h3>
            <div className="space-y-3" style={{ color: colors.textSecondary }}>
              <div>
                <span className="font-medium" style={{ color: colors.textPrimary }}>Job ID:</span>{' '}
                <span>{match.job_id}</span>
              </div>
              <div>
                <span className="font-medium" style={{ color: colors.textPrimary }}>Department:</span>{' '}
                <span>{match.department}</span>
              </div>
              <div>
                <span className="font-medium" style={{ color: colors.textPrimary }}>Service Line:</span>{' '}
                <span>{match.service_line}</span>
              </div>
              <div>
                <span className="font-medium" style={{ color: colors.textPrimary }}>Location:</span>{' '}
                <span>{match.location}</span>
              </div>
              {match.experience_required && (
                <div>
                  <span className="font-medium" style={{ color: colors.textPrimary }}>Experience Required:</span>{' '}
                  <span>{match.experience_required}</span>
                </div>
              )}
              {match.salary_range && (
                <div>
                  <span className="font-medium" style={{ color: colors.textPrimary }}>Salary Range:</span>{' '}
                  <span>{match.salary_range}</span>
                </div>
              )}
              <div>
                <span className="font-medium" style={{ color: colors.textPrimary }}>Posted Date:</span>{' '}
                <span>{formatDate(match.posted_date)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div
            className="flex flex-col gap-3 pt-4"
            style={{ borderTop: `1px solid ${colors.border}` }}
          >
            {/* Job Posting Link - Always visible at bottom */}
            <div className="mb-2">
              <a
                href={match.job_posting_url || `https://careers.ey.com/jobs/${match.job_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-sm font-semibold transition-colors text-center"
                style={{
                  backgroundColor: colors.accent,
                  color: '#2E2E38',
                }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                View Full Job Posting on EY Careers
              </a>
            </div>

            {/* Secondary Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onSave(match.id);
                  onClose();
                }}
                className="flex-1 px-6 py-3 font-semibold rounded-sm transition-colors"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.cardBg,
                  color: colors.textPrimary,
                  border: `1px solid ${colors.border}`,
                }}
              >
                Save Match
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 font-semibold rounded-sm transition-colors"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.cardBg,
                  color: colors.textPrimary,
                  border: `1px solid ${colors.border}`,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
