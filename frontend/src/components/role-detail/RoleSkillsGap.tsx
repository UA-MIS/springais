import { Match } from '../../services/mockMatchData'
import { useTheme, themeColors } from '../../context/ThemeContext'

interface RoleSkillsGapProps {
  match: Match
}

export default function RoleSkillsGap({ match }: RoleSkillsGapProps) {
  const { theme, isDark, isGame } = useTheme()
  const colors = themeColors[theme]

  const skillMatchPercent = Math.round(match.skill_match_score * 100)
  const matchedCount = match.matched_skills.length
  const transferableCount = (match.transferable_skills || []).length
  const gapCount = match.skill_gaps.length
  const totalRequired = matchedCount + transferableCount + gapCount

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className={`grid grid-cols-1 ${transferableCount > 0 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
        <StatCard
          label="Skill Match"
          value={`${skillMatchPercent}%`}
          description="of required skills"
          colors={colors}
          isDark={isDark}
          accent={skillMatchPercent >= 70 ? '#22c55e' : skillMatchPercent >= 50 ? '#f59e0b' : '#ef4444'}
        />
        <StatCard
          label="Skills You Have"
          value={matchedCount.toString()}
          description={`of ${totalRequired} required`}
          colors={colors}
          isDark={isDark}
          accent="#22c55e"
        />
        {transferableCount > 0 && (
          <StatCard
            label="Related Skills"
            value={transferableCount.toString()}
            description="transferable skills"
            colors={colors}
            isDark={isDark}
            accent="#3b82f6"
          />
        )}
        <StatCard
          label="Skills to Develop"
          value={gapCount.toString()}
          description="opportunities to grow"
          colors={colors}
          isDark={isDark}
          accent="#f59e0b"
        />
      </div>

      {/* Skills You Have */}
      <div
        className="p-6 rounded-lg"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: '#22c55e' }}
          />
          Skills You Have ({matchedCount})
        </h3>
        <div className="flex flex-wrap gap-2">
          {match.matched_skills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.25)',
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Related/Transferable Skills */}
      {transferableCount > 0 && (
        <div
          className="p-6 rounded-lg"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: '#3b82f6' }}
            />
            Related Skills ({transferableCount})
          </h3>
          <div className="flex flex-wrap gap-2">
            {(match.transferable_skills || []).map((skill) => (
              <span
                key={skill}
                className="px-3 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  color: '#3b82f6',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                }}
              >
                {skill}
              </span>
            ))}
          </div>
          <p className="text-sm mt-3" style={{ color: colors.textMuted }}>
            These are skills you have that are related to what this role requires.
          </p>
        </div>
      )}

      {/* Skills to Develop */}
      <div
        className="p-6 rounded-lg"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: colors.textPrimary }}>
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: '#f59e0b' }}
          />
          Skills to Develop ({gapCount})
        </h3>
        {gapCount === 0 ? (
          <p style={{ color: colors.textMuted }}>
            Great news! You have all the skills required for this role.
          </p>
        ) : (
          <div className="space-y-3">
            {match.skill_gaps.map((skill) => (
              <div
                key={skill}
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.06)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                <p className="font-medium" style={{ color: colors.textPrimary }}>{skill}</p>
                <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                  Required for this role
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div
        className="p-6 rounded-lg"
        style={{
          backgroundColor: isDark ? 'rgba(255, 230, 0, 0.08)' : 'rgba(255, 230, 0, 0.1)',
          border: `1px solid rgba(255, 230, 0, 0.25)`,
        }}
      >
        <h3 className="text-lg font-semibold mb-3" style={{ color: colors.textPrimary }}>
          Recommendations
        </h3>
        <ul className="space-y-2">
          {gapCount > 0 && (
            <li className="flex items-start gap-2" style={{ color: colors.textSecondary }}>
              <span style={{ color: colors.accent }}>•</span>
              Focus on developing {match.skill_gaps[0]} first - it's highly valued for this role
            </li>
          )}
          {match.matched_skills.length > 0 && (
            <li className="flex items-start gap-2" style={{ color: colors.textSecondary }}>
              <span style={{ color: colors.accent }}>•</span>
              Your {match.matched_skills[0]} experience is a strong foundation
            </li>
          )}
          {transferableCount > 0 && (
            <li className="flex items-start gap-2" style={{ color: colors.textSecondary }}>
              <span style={{ color: colors.accent }}>•</span>
              You have {transferableCount} related skill{transferableCount > 1 ? 's' : ''} that can help you bridge the gap
            </li>
          )}
          <li className="flex items-start gap-2" style={{ color: colors.textSecondary }}>
            <span style={{ color: colors.accent }}>•</span>
            Consider mentorship or training programs to accelerate skill development
          </li>
        </ul>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  description,
  colors,
  isDark,
  accent,
}: {
  label: string
  value: string
  description: string
  colors: typeof themeColors.dark
  isDark: boolean
  accent: string
}) {
  return (
    <div
      className="p-5 rounded-lg"
      style={{
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
        border: `1px solid ${colors.cardBorder}`,
      }}
    >
      <p className="text-sm mb-1" style={{ color: colors.textMuted }}>{label}</p>
      <p className="text-3xl font-bold" style={{ color: accent }}>{value}</p>
      <p className="text-sm mt-1" style={{ color: colors.textMuted }}>{description}</p>
    </div>
  )
}
