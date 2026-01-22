import { useState, useEffect } from 'react'
import { Match } from '../../services/mockMatchData'
import { useTheme, themeColors } from '../../context/ThemeContext'
import api from '../../services/api'

interface RoleSuccessPatternsProps {
  match: Match
}

interface TransitionPattern {
  source_role: string
  target_role: string
  count: number
  success_rate: number
  avg_time_to_promotion_years: number
  common_skills: string[]
}

interface RolePatternData {
  transitions_to_role: TransitionPattern[]
  transitions_from_role: TransitionPattern[]
  skill_correlation: Record<string, number>
  loading: boolean
  error: string | null
}

export default function RoleSuccessPatterns({ match }: RoleSuccessPatternsProps) {
  const { isDark } = useTheme()
  const colors = isDark ? themeColors.dark : themeColors.light

  const [data, setData] = useState<RolePatternData>({
    transitions_to_role: [],
    transitions_from_role: [],
    skill_correlation: {},
    loading: true,
    error: null,
  })

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        // Fetch patterns for this specific role
        const roleResponse = await api.get(`/patterns/role/${encodeURIComponent(match.job_title)}`)
        const transitions = roleResponse.data?.transitions || []

        setData({
          transitions_to_role: [],  // Would need a reverse lookup API
          transitions_from_role: transitions,
          skill_correlation: {},
          loading: false,
          error: null,
        })
      } catch (err: any) {
        console.error('Failed to fetch patterns:', err)
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Pattern data not available for this role',
        }))
      }
    }

    fetchPatterns()
  }, [match.job_title])

  if (data.loading) {
    return (
      <div className="text-center py-12" style={{ color: colors.textMuted }}>
        Loading success patterns...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Role-Specific Header */}
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
          Career insights based on employees who have held or transitioned to this role.
        </p>
      </div>

      {data.error ? (
        <div
          className="p-6 rounded-lg text-center"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            color: colors.textMuted,
          }}
        >
          <p className="mb-2">{data.error}</p>
          <p className="text-sm">
            Success patterns are calculated from employee transition data.
            This role may be new or have limited historical data.
          </p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              label="Possible Next Roles"
              value={data.transitions_from_role.length.toString()}
              description="career paths from this position"
              colors={colors}
              isDark={isDark}
            />
            <MetricCard
              label="Avg Success Rate"
              value={
                data.transitions_from_role.length > 0
                  ? `${Math.round(
                      data.transitions_from_role.reduce((sum, t) => sum + t.success_rate, 0) /
                        data.transitions_from_role.length * 100
                    )}%`
                  : 'N/A'
              }
              description="for role transitions"
              colors={colors}
              isDark={isDark}
            />
            <MetricCard
              label="Key Skills"
              value={match.required_skills?.length?.toString() || match.skill_gaps.length.toString()}
              description="skills for this role"
              colors={colors}
              isDark={isDark}
            />
          </div>

          {/* Career Paths from This Role */}
          {data.transitions_from_role.length > 0 && (
            <div
              className="p-6 rounded-lg"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
                border: `1px solid ${colors.cardBorder}`,
              }}
            >
              <h4 className="text-md font-semibold mb-4" style={{ color: colors.textPrimary }}>
                Where People Go From Here
              </h4>
              <div className="space-y-3">
                {data.transitions_from_role.slice(0, 5).map((transition, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    }}
                  >
                    <div>
                      <p className="font-medium" style={{ color: colors.textPrimary }}>
                        {transition.target_role}
                      </p>
                      <p className="text-sm" style={{ color: colors.textMuted }}>
                        ~{transition.avg_time_to_promotion_years?.toFixed(1) || '?'} years avg
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold" style={{ color: '#22c55e' }}>
                        {Math.round(transition.success_rate * 100)}%
                      </p>
                      <p className="text-xs" style={{ color: colors.textMuted }}>
                        success rate
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills That Matter */}
          <div
            className="p-6 rounded-lg"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            <h4 className="text-md font-semibold mb-4" style={{ color: colors.textPrimary }}>
              Skills That Matter for This Role
            </h4>
            <div className="flex flex-wrap gap-2">
              {(match.required_skills || [...match.matched_skills, ...match.skill_gaps])
                .slice(0, 10)
                .map((skill, idx) => {
                  const hasSkill = match.matched_skills.includes(skill)
                  return (
                    <span
                      key={idx}
                      className="px-3 py-2 rounded-lg text-sm font-medium"
                      style={{
                        backgroundColor: hasSkill
                          ? 'rgba(34, 197, 94, 0.12)'
                          : 'rgba(245, 158, 11, 0.12)',
                        color: hasSkill ? '#22c55e' : '#f59e0b',
                        border: `1px solid ${hasSkill ? 'rgba(34, 197, 94, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                      }}
                    >
                      {hasSkill && '✓ '}{skill}
                    </span>
                  )
                })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  description,
  colors,
  isDark,
}: {
  label: string
  value: string
  description: string
  colors: typeof themeColors.dark
  isDark: boolean
}) {
  return (
    <div
      className="p-5 rounded-lg"
      style={{
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
        border: `1px solid ${colors.cardBorder}`,
      }}
    >
      <p className="text-sm" style={{ color: colors.textMuted }}>{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: colors.accent }}>{value}</p>
      <p className="text-sm mt-1" style={{ color: colors.textMuted }}>{description}</p>
    </div>
  )
}
