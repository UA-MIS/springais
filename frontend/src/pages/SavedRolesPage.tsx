import { useTheme, themeColors } from '../context/ThemeContext'
import { useNavigate } from 'react-router-dom'

export default function SavedRolesPage() {
  const { isDark } = useTheme()
  const colors = isDark ? themeColors.dark : themeColors.light
  const navigate = useNavigate()

  // For now, show empty state - in real app, this would fetch from backend
  const savedRoles: any[] = []

  return (
    <div className="max-w-7xl mx-auto py-6 px-6">
      <h1 className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
        Saved Roles
      </h1>
      <p className="mb-8" style={{ color: colors.textMuted }}>
        Roles you've bookmarked for later review
      </p>

      {savedRoles.length === 0 ? (
        <div
          className="p-12 rounded-lg text-center"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ color: colors.textMuted }}
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>
            No saved roles yet
          </h3>
          <p className="mb-6 max-w-md mx-auto" style={{ color: colors.textMuted }}>
            When you find roles that interest you, save them here to track your applications
            and compare opportunities.
          </p>
          <button
            onClick={() => navigate('/matches')}
            className="px-6 py-2 rounded-md font-semibold transition-colors"
            style={{
              backgroundColor: colors.accent,
              color: '#2E2E38',
            }}
          >
            Browse Match Results
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Saved roles would be listed here */}
        </div>
      )}
    </div>
  )
}
