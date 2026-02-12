import { useState } from 'react'
import { Match } from '../../services/mockMatchData'
import { useTheme, themeColors } from '../../context/ThemeContext'
import { getDeepAnalysis, DeepAnalysis } from '../../services/matchService'
import ProgressRing from '../common/ProgressRing'
import FormattedJobDescription from './FormattedJobDescription'

interface RoleOverviewProps {
  match: Match
}

export default function RoleOverview({ match }: RoleOverviewProps) {
  const { theme, isDark, isGame } = useTheme()
  const colors = themeColors[theme]
  const scorePercentage = Math.round(match.overall_score * 100)

  // Deep Analysis state
  const [deepAnalysis, setDeepAnalysis] = useState<DeepAnalysis | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const handleDeepAnalysis = async () => {
    setAnalysisLoading(true)
    setAnalysisError(null)
    try {
      const analysis = await getDeepAnalysis(match.job_id)
      setDeepAnalysis(analysis)
    } catch (err) {
      setAnalysisError('Failed to generate deep analysis. Please try again.')
      console.error('Deep analysis error:', err)
    } finally {
      setAnalysisLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Score and Key Info */}
      <div
        className="p-6 rounded-lg"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-shrink-0">
            <ProgressRing percentage={scorePercentage} size={140} strokeWidth={10} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              Match Score: {scorePercentage}%
            </h2>
            <p className="text-base leading-relaxed" style={{ color: colors.textSecondary }}>
              "{match.explanation}"
            </p>
          </div>
        </div>
      </div>

      {/* Role Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* About the Role */}
        <div
          className="p-6 rounded-lg"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
            About the Role
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm" style={{ color: colors.textMuted }}>Service Line</span>
              <p className="font-medium" style={{ color: colors.textPrimary }}>{match.service_line}</p>
            </div>
            <div>
              <span className="text-sm" style={{ color: colors.textMuted }}>Department</span>
              <p className="font-medium" style={{ color: colors.textPrimary }}>{match.department}</p>
            </div>
            <div>
              <span className="text-sm" style={{ color: colors.textMuted }}>Location</span>
              <p className="font-medium" style={{ color: colors.textPrimary }}>{match.location}</p>
            </div>
            {match.experience_required && (
              <div>
                <span className="text-sm" style={{ color: colors.textMuted }}>Experience Required</span>
                <p className="font-medium" style={{ color: colors.textPrimary }}>{match.experience_required}</p>
              </div>
            )}
            <div>
              <span className="text-sm" style={{ color: colors.textMuted }}>Posted</span>
              <p className="font-medium" style={{ color: colors.textPrimary }}>
                {new Date(match.posted_date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            {match.job_posting_url && (
              <div>
                <span className="text-sm" style={{ color: colors.textMuted }}>Job Posting</span>
                <p className="font-medium">
                  <a
                    href={match.job_posting_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: colors.accent }}
                  >
                    View on EY Careers
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Score Breakdown */}
        <div
          className="p-6 rounded-lg"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
            Score Breakdown
          </h3>
          <div className="space-y-4">
            <ScoreBar label="Skill Match (80%)" score={match.skill_match_score} colors={colors} isDark={isDark} />
            <ScoreBar label="Experience Match (10%)" score={match.experience_score} colors={colors} isDark={isDark} />
            <ScoreBar label="Role Fit (10%)" score={match.role_fit_score} colors={colors} isDark={isDark} />
          </div>
        </div>
      </div>

      {match.job_description && (
        <div
          className="p-6 rounded-lg"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
            Job Description
          </h3>
          <FormattedJobDescription
            text={match.job_description}
            textColor={colors.textSecondary}
            headingColor={colors.textPrimary}
            mutedColor={colors.textMuted}
          />
        </div>
      )}

      {/* Matched Skills */}
      <div
        className="p-6 rounded-lg"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
          Your Matched Skills
        </h3>
        <div className="flex flex-wrap gap-2">
          {match.matched_skills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1.5 rounded-full text-sm font-medium"
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Deep Analysis Section */}
      <div
        className="p-6 rounded-lg"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
            Deep Analysis (GPT-5.2)
          </h3>
          {!deepAnalysis && (
            <button
              onClick={handleDeepAnalysis}
              disabled={analysisLoading}
              className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              style={{
                backgroundColor: analysisLoading ? colors.cardBorder : '#8B5CF6',
                color: analysisLoading ? colors.textMuted : '#ffffff',
                cursor: analysisLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {analysisLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Run Deep Analysis
                </>
              )}
            </button>
          )}
        </div>

        {analysisError && (
          <p className="text-red-500 text-sm mb-4">{analysisError}</p>
        )}

        {!deepAnalysis && !analysisLoading && !analysisError && (
          <p style={{ color: colors.textMuted }} className="text-sm">
            Get a comprehensive AI-powered analysis of your fit for this role, including skill impact assessment, success factors, and personalized recommendations.
          </p>
        )}

        {deepAnalysis && (
          <div className="space-y-5">
            {/* Overall Fit Assessment */}
            <div>
              <h4 className="font-medium mb-2" style={{ color: colors.textPrimary }}>
                Overall Fit Assessment
              </h4>
              <p className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
                {deepAnalysis.overall_fit_assessment}
              </p>
            </div>

            {/* Skill Impacts */}
            {deepAnalysis.skill_impacts && deepAnalysis.skill_impacts.length > 0 && (
              <div>
                <h4 className="font-medium mb-3" style={{ color: colors.textPrimary }}>
                  Skill Impact Analysis
                </h4>
                <div className="space-y-2">
                  {deepAnalysis.skill_impacts.slice(0, 6).map((impact, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)' }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm" style={{ color: colors.textPrimary }}>
                          {impact.skill_name}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: impact.is_gap ? '#FEE2E2' : '#D1FAE5',
                            color: impact.is_gap ? '#991B1B' : '#065F46',
                          }}
                        >
                          {impact.is_gap ? `Gap - ${impact.gap_severity}` : 'Match'}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: impact.importance === 'critical' ? '#FEE2E2' :
                                             impact.importance === 'high' ? '#FEF3C7' :
                                             impact.importance === 'medium' ? '#DBEAFE' : '#F3F4F6',
                            color: impact.importance === 'critical' ? '#991B1B' :
                                   impact.importance === 'high' ? '#92400E' :
                                   impact.importance === 'medium' ? '#1E40AF' : '#374151',
                          }}
                        >
                          {impact.importance}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: colors.textMuted }}>
                        {impact.impact_description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success & Risk Factors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deepAnalysis.success_factors && deepAnalysis.success_factors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                    <span className="text-green-500">+</span> Success Factors
                  </h4>
                  <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                    {deepAnalysis.success_factors.map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">-</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {deepAnalysis.risk_factors && deepAnalysis.risk_factors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                    <span className="text-amber-500">!</span> Risk Factors
                  </h4>
                  <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                    {deepAnalysis.risk_factors.map((factor, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500 mt-1">-</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Ramp-up Time & Comparable Roles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deepAnalysis.ramp_up_time_estimate && (
                <div>
                  <h4 className="font-medium mb-1" style={{ color: colors.textPrimary }}>
                    Estimated Ramp-up Time
                  </h4>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {deepAnalysis.ramp_up_time_estimate}
                  </p>
                </div>
              )}
              {deepAnalysis.comparable_roles && deepAnalysis.comparable_roles.length > 0 && (
                <div>
                  <h4 className="font-medium mb-1" style={{ color: colors.textPrimary }}>
                    Comparable Roles
                  </h4>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {deepAnalysis.comparable_roles.join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* Recommended Learning Path */}
            {deepAnalysis.recommended_learning_path && deepAnalysis.recommended_learning_path.length > 0 && (
              <div>
                <h4 className="font-medium mb-2" style={{ color: colors.textPrimary }}>
                  Recommended Learning Path
                </h4>
                <ol className="text-sm space-y-1 list-decimal list-inside" style={{ color: colors.textSecondary }}>
                  {deepAnalysis.recommended_learning_path.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Helper component for score bars
function ScoreBar({
  label,
  score,
  colors,
  isDark,
}: {
  label: string
  score?: number
  colors: typeof themeColors.dark
  isDark: boolean
}) {
  const normalized = Number.isFinite(score) ? (score as number) : 0
  const percentage = Math.round(normalized * 100)
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm" style={{ color: colors.textMuted }}>{label}</span>
        <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{percentage}%</span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: percentage >= 70 ? '#22c55e' : percentage >= 50 ? '#f59e0b' : '#ef4444',
          }}
        />
      </div>
    </div>
  )
}
