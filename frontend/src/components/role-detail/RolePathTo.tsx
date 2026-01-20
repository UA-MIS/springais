import { Match } from '../../services/mockMatchData'
import { useTheme, themeColors } from '../../context/ThemeContext'
import { RoleRequirementTree } from '../career-viz/RoleRequirementTree'

interface RolePathToProps {
  match: Match
}

// Map job titles to role IDs in the mock data
const roleIdMap: Record<string, string> = {
  'Senior Analyst': 'senior-analyst',
  'Manager': 'manager',
  'Senior Manager': 'senior-manager',
  'Director': 'director',
  // Add more mappings as needed
}

export default function RolePathTo({ match }: RolePathToProps) {
  const { isDark } = useTheme()
  const colors = isDark ? themeColors.dark : themeColors.light

  // Try to find a matching role ID for the career tree
  const roleId = roleIdMap[match.job_title] || 'senior-analyst' // Default to senior-analyst for demo

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
            <RoleRequirementTree roleId={roleId} />
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
          <p className="text-2xl font-bold mt-1" style={{ color: colors.accent }}>2.8 years</p>
          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>to reach this role</p>
        </div>
        <div
          className="p-5 rounded-lg"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <p className="text-sm" style={{ color: colors.textMuted }}>Most Common Path</p>
          <p className="text-2xl font-bold mt-1" style={{ color: colors.accent }}>Technical</p>
          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>branch taken by 65%</p>
        </div>
        <div
          className="p-5 rounded-lg"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <p className="text-sm" style={{ color: colors.textMuted }}>Success Rate</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#22c55e' }}>78%</p>
          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>with right skills</p>
        </div>
      </div>
    </div>
  )
}
