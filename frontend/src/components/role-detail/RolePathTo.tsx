import { useState, useEffect } from 'react'
import { Match } from '../../services/mockMatchData'
import { useTheme, themeColors } from '../../context/ThemeContext'
import { RoleRequirementTree } from '../career-viz/RoleRequirementTree'
import api from '../../services/api'

interface RolePathToProps {
  match: Match
}

interface RoleStats {
  avgTimeToPromotion: number | null
  commonPath: string | null
  successRate: number | null
}

export default function RolePathTo({ match }: RolePathToProps) {
  const { isDark } = useTheme()
  const colors = isDark ? themeColors.dark : themeColors.light
  const [roleStats, setRoleStats] = useState<RoleStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Use the job ID from the match for the skill plan
  const jobId = match.job_id || match.id

  // Fetch real statistics from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Try to get transition data for this role
        const response = await api.get(`/patterns/role/${encodeURIComponent(match.job_title)}`)
        const transitions = response.data?.transitions || []

        if (transitions.length > 0) {
          // Calculate average time and success rate from transitions
          const avgTime = transitions.reduce((sum: number, t: any) => sum + (t.avg_time_to_promotion_years || 0), 0) / transitions.length
          const avgSuccess = transitions.reduce((sum: number, t: any) => sum + (t.success_rate || 0), 0) / transitions.length

          setRoleStats({
            avgTimeToPromotion: avgTime,
            successRate: avgSuccess * 100,
            commonPath: transitions[0]?.target_role || null
          })
        }
      } catch (error) {
        console.error('Failed to fetch role stats:', error)
        // Use fallback values if API fails
        setRoleStats(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [match.job_title])

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
          Path to {match.job_title}
        </h3>
        <p style={{ color: colors.textMuted }}>
          Explore the different paths and skills that can help you reach this role.
          The diagram below shows common routes others have taken.
        </p>
      </div>

      {/* Career Tree */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <div
          className="px-6 py-4 border-b"
          style={{ borderColor: colors.cardBorder }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
              Routes to become {match.job_title}
            </div>
            <div className="text-xs" style={{ color: colors.textMuted }}>
              Technical / leadership / mentoring branches
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="h-[500px]">
            <RoleRequirementTree roleId={match.job_title} jobId={jobId} />
          </div>
        </div>
      </div>

      {/* Path Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="p-5 rounded-lg"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <p className="text-sm" style={{ color: colors.textMuted }}>Average Time</p>
          <p className="text-2xl font-bold mt-1" style={{ color: colors.accent }}>
            {loading ? '...' : roleStats?.avgTimeToPromotion ? `${roleStats.avgTimeToPromotion.toFixed(1)} years` : 'N/A'}
          </p>
          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>to reach this role</p>
        </div>
        <div
          className="p-5 rounded-lg"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <p className="text-sm" style={{ color: colors.textMuted }}>Next Role</p>
          <p className="text-2xl font-bold mt-1" style={{ color: colors.accent }}>
            {loading ? '...' : roleStats?.commonPath || 'Various'}
          </p>
          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>common progression</p>
        </div>
        <div
          className="p-5 rounded-lg"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <p className="text-sm" style={{ color: colors.textMuted }}>Success Rate</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#22c55e' }}>
            {loading ? '...' : roleStats?.successRate ? `${roleStats.successRate.toFixed(0)}%` : 'N/A'}
          </p>
          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>with right skills</p>
        </div>
      </div>
    </div>
  )
}
