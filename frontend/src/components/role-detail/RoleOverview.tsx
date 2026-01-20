import { Match } from '../../services/mockMatchData'
import { useTheme, themeColors } from '../../context/ThemeContext'
import ProgressRing from '../common/ProgressRing'

interface RoleOverviewProps {
  match: Match
}

export default function RoleOverview({ match }: RoleOverviewProps) {
  const { isDark } = useTheme()
  const colors = isDark ? themeColors.dark : themeColors.light
  const scorePercentage = Math.round(match.overall_score * 100)

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
            <ScoreBar label="Skill Match" score={match.skill_match_score} colors={colors} isDark={isDark} />
            <ScoreBar label="Experience Match" score={match.experience_score} colors={colors} isDark={isDark} />
            <ScoreBar label="Education Match" score={match.education_score} colors={colors} isDark={isDark} />
            {match.certification_score !== undefined && (
              <ScoreBar label="Certifications" score={match.certification_score} colors={colors} isDark={isDark} />
            )}
          </div>
        </div>
      </div>

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
  score: number
  colors: typeof themeColors.dark
  isDark: boolean
}) {
  const percentage = Math.round(score * 100)
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
