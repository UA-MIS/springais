import { Match } from '../../services/mockMatchData'
import { useTheme, themeColors } from '../../context/ThemeContext'

interface RoleSuccessPatternsProps {
  match: Match
}

export default function RoleSuccessPatterns({ match }: RoleSuccessPatternsProps) {
  const { isDark } = useTheme()
  const colors = isDark ? themeColors.dark : themeColors.light

  // Mock success pattern data for the role
  const successPatterns = {
    topSkills: [
      { skill: 'Data Analysis', percentage: 92 },
      { skill: 'Excel/Sheets', percentage: 88 },
      { skill: 'Communication', percentage: 85 },
      { skill: 'Problem Solving', percentage: 82 },
      { skill: 'SQL', percentage: 78 },
    ],
    keyBehaviors: [
      'Proactively seeks feedback from stakeholders',
      'Documents processes and shares knowledge',
      'Takes ownership of deliverables end-to-end',
      'Builds strong relationships across teams',
      'Stays current with industry trends',
    ],
    commonBackground: [
      { label: 'Finance/Accounting', percentage: 45 },
      { label: 'Business/Economics', percentage: 30 },
      { label: 'Engineering/Tech', percentage: 15 },
      { label: 'Other', percentage: 10 },
    ],
    avgTimeToPromotion: '2.5 years',
    retentionRate: '85%',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="p-6 rounded-lg"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>
          Success Patterns for {match.job_title}
        </h3>
        <p style={{ color: colors.textMuted }}>
          Learn from employees who have successfully transitioned to and thrived in this role.
          These insights are based on historical data and performance patterns.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Avg Time to Next Promotion"
          value={successPatterns.avgTimeToPromotion}
          colors={colors}
          isDark={isDark}
        />
        <StatCard
          label="Role Retention Rate"
          value={successPatterns.retentionRate}
          colors={colors}
          isDark={isDark}
        />
        <StatCard
          label="Transition Success"
          value="78%"
          colors={colors}
          isDark={isDark}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Skills */}
        <div
          className="p-6 rounded-lg"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
            Top Skills of Successful {match.job_title}s
          </h3>
          <div className="space-y-4">
            {successPatterns.topSkills.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm" style={{ color: colors.textSecondary }}>{item.skill}</span>
                  <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                    {item.percentage}%
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: colors.accent,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Behaviors */}
        <div
          className="p-6 rounded-lg"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
            Key Success Behaviors
          </h3>
          <ul className="space-y-3">
            {successPatterns.keyBehaviors.map((behavior, index) => (
              <li
                key={index}
                className="flex items-start gap-3"
              >
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    color: '#22c55e',
                  }}
                >
                  {index + 1}
                </span>
                <span style={{ color: colors.textSecondary }}>{behavior}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Background Distribution */}
      <div
        className="p-6 rounded-lg"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
          Common Backgrounds
        </h3>
        <p className="mb-4 text-sm" style={{ color: colors.textMuted }}>
          Educational and professional backgrounds of successful employees in this role
        </p>
        <div className="flex flex-wrap gap-4">
          {successPatterns.commonBackground.map((item, index) => (
            <div
              key={index}
              className="flex-1 min-w-[140px] p-4 rounded-lg text-center"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${colors.cardBorder}`,
              }}
            >
              <p className="text-2xl font-bold" style={{ color: colors.accent }}>
                {item.percentage}%
              </p>
              <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Your Alignment */}
      <div
        className="p-6 rounded-lg"
        style={{
          backgroundColor: isDark ? 'rgba(255, 230, 0, 0.08)' : 'rgba(255, 230, 0, 0.1)',
          border: '1px solid rgba(255, 230, 0, 0.25)',
        }}
      >
        <h3 className="text-lg font-semibold mb-3" style={{ color: colors.textPrimary }}>
          Your Alignment with Success Patterns
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Skills You Already Have:
            </p>
            <div className="flex flex-wrap gap-2">
              {match.matched_skills.slice(0, 4).map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    color: '#22c55e',
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Skills to Develop:
            </p>
            <div className="flex flex-wrap gap-2">
              {match.skill_gaps.slice(0, 3).map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b',
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  colors,
  isDark,
}: {
  label: string
  value: string
  colors: typeof themeColors.dark
  isDark: boolean
}) {
  return (
    <div
      className="p-5 rounded-lg text-center"
      style={{
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
        border: `1px solid ${colors.cardBorder}`,
      }}
    >
      <p className="text-sm" style={{ color: colors.textMuted }}>{label}</p>
      <p className="text-3xl font-bold mt-1" style={{ color: colors.accent }}>{value}</p>
    </div>
  )
}
