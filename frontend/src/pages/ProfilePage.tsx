import { useTheme, themeColors } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import SkillsDashboard from '../components/skills/SkillsDashboard'

export default function ProfilePage() {
  const { isDark } = useTheme()
  const colors = isDark ? themeColors.dark : themeColors.light
  const { user } = useAuth()

  return (
    <div className="max-w-7xl mx-auto py-6 px-6">
      {/* Profile Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
          My Profile
        </h1>
        <p style={{ color: colors.textMuted }}>
          Manage your skills, resume, and career preferences
        </p>
      </div>

      {/* User Info Card */}
      <div
        className="p-6 rounded-lg mb-8"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <div className="flex items-center gap-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{
              backgroundColor: colors.accent,
              color: '#2E2E38',
            }}
          >
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
              {user?.name || 'User'}
            </h2>
            <p style={{ color: colors.textMuted }}>{user?.email || 'user@example.com'}</p>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Role: {user?.role || 'Employee'}
            </p>
          </div>
          <div className="ml-auto">
            <button
              className="px-4 py-2 rounded-md text-sm font-semibold transition-colors"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                color: colors.textPrimary,
              }}
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Resume Section */}
      <div
        className="p-6 rounded-lg mb-8"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
          Resume
        </h3>
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center"
          style={{ borderColor: colors.border }}
        >
          <p style={{ color: colors.textMuted }} className="mb-4">
            Upload your resume to get better match recommendations
          </p>
          <button
            className="px-6 py-2 rounded-md font-semibold transition-colors"
            style={{
              backgroundColor: colors.accent,
              color: '#2E2E38',
            }}
          >
            Upload Resume
          </button>
        </div>
      </div>

      {/* Skills Dashboard */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
          My Skills
        </h3>
        <SkillsDashboard />
      </div>
    </div>
  )
}
