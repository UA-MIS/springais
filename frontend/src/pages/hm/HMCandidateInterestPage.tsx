import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { useHiringManager } from '../../context/HiringManagerContext';
import { CandidateInterestResponse, AnonymizedCandidateDetail } from '../../services/hiringManagerService';
import SkillGapDisplay from '../../components/matches/SkillGapDisplay';

// Fit level colors and labels
const fitLevelConfig = {
  strong_fit: { color: '#22c55e', label: 'Strong Fit', bg: 'rgba(34, 197, 94, 0.15)' },
  good_fit: { color: '#84cc16', label: 'Good Fit', bg: 'rgba(132, 204, 22, 0.15)' },
  moderate_fit: { color: '#eab308', label: 'Moderate Fit', bg: 'rgba(234, 179, 8, 0.15)' },
  developing: { color: '#f97316', label: 'Developing', bg: 'rgba(249, 115, 22, 0.15)' },
};

interface CandidateCardProps {
  candidate: AnonymizedCandidateDetail;
  colors: typeof themeColors.dark;
  isDark: boolean;
}

function CandidateCard({ candidate, colors, isDark }: CandidateCardProps) {
  const fitConfig = fitLevelConfig[candidate.fit_level];
  const scorePercentage = Math.round(candidate.overall_score * 100);

  return (
    <div
      className="p-6 rounded-lg"
      style={{
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
        border: `1px solid ${colors.cardBorder}`,
      }}
    >
      {/* Header: Candidate label + Score */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <h4 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
            {candidate.candidate_label}
          </h4>
          <span
            className="px-2 py-1 text-xs font-medium rounded"
            style={{
              backgroundColor: fitConfig.bg,
              color: fitConfig.color,
              border: `1px solid ${fitConfig.color}40`,
            }}
          >
            {fitConfig.label}
          </span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: colors.accent }}>
            {scorePercentage}%
          </div>
          <div className="text-xs" style={{ color: colors.textMuted }}>
            Overall Match
          </div>
        </div>
      </div>

      {/* Skills Display */}
      <SkillGapDisplay
        matched_skills={candidate.matched_skills}
        transferable_skills={candidate.transferable_skills}
        skill_gaps={candidate.skill_gaps}
        skill_match_score={candidate.skill_match_score}
        isDark={isDark}
        colors={{
          textPrimary: colors.textPrimary,
          textSecondary: colors.textSecondary,
          textMuted: colors.textMuted,
          border: colors.cardBorder,
        }}
      />
    </div>
  );
}

export default function HMCandidateInterestPage() {
  const { jobPostingId } = useParams<{ jobPostingId: string }>();
  const navigate = useNavigate();
  const { theme, isDark } = useTheme();
  const colors = themeColors[theme];
  const { getInterest, isHiringManager } = useHiringManager();

  const [data, setData] = useState<CandidateInterestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jobPostingId && isHiringManager) {
      loadInterest();
    }
  }, [jobPostingId, isHiringManager]);

  const loadInterest = async () => {
    if (!jobPostingId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getInterest(jobPostingId);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load candidate interest data');
    } finally {
      setLoading(false);
    }
  };

  if (!isHiringManager) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-6">
        <div
          className="p-8 rounded-lg text-center"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <h2 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
            Access Restricted
          </h2>
          <p style={{ color: colors.textMuted }}>
            This page is only available to Hiring Manager accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-6">
      <button
        onClick={() => navigate('/hm/my-jobs')}
        className="mb-4 text-sm flex items-center gap-1"
        style={{ color: colors.accent }}
      >
        &larr; Back to My Jobs
      </button>

      {loading ? (
        <div className="text-center py-12" style={{ color: colors.textMuted }}>
          Loading candidate interest data...
        </div>
      ) : error ? (
        <div
          className="p-6 rounded-lg text-center"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <p style={{ color: colors.textPrimary }}>{error}</p>
          <button
            onClick={loadInterest}
            className="mt-4 px-4 py-2 rounded-md font-semibold"
            style={{
              backgroundColor: colors.accent,
              color: '#2E2E38',
            }}
          >
            Retry
          </button>
        </div>
      ) : data ? (
        <>
          <h1 className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
            {data.job_title}
          </h1>
          <p className="mb-6" style={{ color: colors.textMuted }}>
            Candidate Interest Overview
          </p>

          {/* Privacy Notice */}
          <div
            className="p-4 rounded-lg mb-6"
            style={{
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            <p className="text-sm" style={{ color: isDark ? '#93c5fd' : '#2563eb' }}>
              {data.privacy_notice}
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div
              className="p-4 rounded-lg text-center"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
                border: `1px solid ${colors.cardBorder}`,
              }}
            >
              <p className="text-4xl font-bold" style={{ color: colors.accent }}>
                {data.total_interested}
              </p>
              <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                Total Interested Candidates
              </p>
            </div>

            {data.average_overall_score !== null && (
              <div
                className="p-4 rounded-lg text-center"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
                  border: `1px solid ${colors.cardBorder}`,
                }}
              >
                <p className="text-4xl font-bold" style={{ color: colors.textPrimary }}>
                  {Math.round(data.average_overall_score * 100)}%
                </p>
                <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                  Average Match Score
                </p>
              </div>
            )}

            {data.average_skill_match !== null && (
              <div
                className="p-4 rounded-lg text-center"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
                  border: `1px solid ${colors.cardBorder}`,
                }}
              >
                <p className="text-4xl font-bold" style={{ color: colors.textPrimary }}>
                  {Math.round(data.average_skill_match * 100)}%
                </p>
                <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                  Average Skill Match
                </p>
              </div>
            )}
          </div>

          {/* Fit Distribution */}
          {data.total_interested > 0 && (
            <div
              className="p-6 rounded-lg mb-6"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
                border: `1px solid ${colors.cardBorder}`,
              }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
                Candidate Fit Distribution
              </h3>

              <div className="space-y-3">
                {[
                  { label: 'Strong Fit (80%+)', count: data.fit_distribution.strong_fit, color: '#22c55e' },
                  { label: 'Good Fit (65-79%)', count: data.fit_distribution.good_fit, color: '#84cc16' },
                  { label: 'Moderate Fit (50-64%)', count: data.fit_distribution.moderate_fit, color: '#eab308' },
                  { label: 'Developing (<50%)', count: data.fit_distribution.developing, color: '#f97316' },
                ].map(({ label, count, color }) => {
                  const percentage = data.total_interested > 0
                    ? (count / data.total_interested) * 100
                    : 0;

                  return (
                    <div key={label}>
                      <div className="flex justify-between mb-1">
                        <span style={{ color: colors.textSecondary }}>{label}</span>
                        <span style={{ color: colors.textPrimary }}>{count} candidates</span>
                      </div>
                      <div
                        className="h-3 rounded-full overflow-hidden"
                        style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Common Skill Gaps */}
          {data.common_skill_gaps.length > 0 && (
            <div
              className="p-6 rounded-lg"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
                border: `1px solid ${colors.cardBorder}`,
              }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
                Common Skill Gaps
              </h3>
              <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
                Skills that interested candidates commonly lack
              </p>

              <div className="space-y-2">
                {data.common_skill_gaps.map((gap) => (
                  <div
                    key={gap.skill_name}
                    className="flex justify-between items-center p-3 rounded"
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    }}
                  >
                    <span style={{ color: colors.textPrimary }}>{gap.skill_name}</span>
                    <span style={{ color: colors.textMuted }}>
                      {gap.candidates_missing} ({gap.percentage_missing}%) missing
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No candidates message */}
          {data.total_interested === 0 && (
            <div
              className="p-12 rounded-lg text-center"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
                border: `1px solid ${colors.cardBorder}`,
              }}
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>
                No candidates yet
              </h3>
              <p style={{ color: colors.textMuted }}>
                No employees have saved this job to their list yet.
                Consider sending out a company-wide announcement about this opportunity.
              </p>
            </div>
          )}

          {/* Individual Candidate Cards */}
          {data.candidates && data.candidates.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4" style={{ color: colors.textPrimary }}>
                Individual Candidate Profiles
              </h3>
              <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
                Anonymized skill profiles for each interested candidate
              </p>

              <div className="space-y-4">
                {data.candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.candidate_label}
                    candidate={candidate}
                    colors={colors}
                    isDark={isDark}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
