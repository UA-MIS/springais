import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme, themeColors } from '../context/ThemeContext'
import { useSkillsContext } from '../context/SkillsContext'
import { getMatchDetails } from '../services/matchService'
import { Match } from '../services/mockMatchData'
import RoleOverview from '../components/role-detail/RoleOverview'
import RoleSkillsGap from '../components/role-detail/RoleSkillsGap'
import RolePathTo from '../components/role-detail/RolePathTo'
import RoleSuccessPatterns from '../components/role-detail/RoleSuccessPatterns'

type TabId = 'overview' | 'skills' | 'path' | 'patterns'

const tabs: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'skills', label: 'Skills Gap' },
  { id: 'path', label: 'Path to Role' },
  { id: 'patterns', label: 'Success Patterns' },
]

export default function RoleDetailPage() {
  const { roleId } = useParams<{ roleId: string }>()
  const navigate = useNavigate()
  const { theme, isDark, isGame } = useTheme()
  const colors = themeColors[theme]
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if user has uploaded a resume
  const { skills } = useSkillsContext()
  const hasResume = skills.length > 0

  useEffect(() => {
    if (!roleId || !hasResume) return
    let isMounted = true
    const fetchDetail = async () => {
      setLoading(true)
      setError(null)
      try {
        const detail = await getMatchDetails(roleId)
        if (isMounted) {
          setMatch(detail)
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load role details')
          setMatch(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    fetchDetail()
    return () => {
      isMounted = false
    }
  }, [roleId, hasResume])

  // Redirect to profile if no resume uploaded
  if (!hasResume) {
    return (
      <div
        className="max-w-7xl mx-auto py-10 px-6"
        style={{ color: colors.textPrimary }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Upload Your Resume First</h1>
          <p className="mb-6" style={{ color: colors.textMuted }}>
            To see personalized match scores and role analysis, please upload your resume.
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-2 rounded-md font-semibold transition-colors"
            style={{
              backgroundColor: colors.accent,
              color: '#2E2E38',
            }}
          >
            Go to My Profile
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div
        className="max-w-7xl mx-auto py-10 px-6"
        style={{ color: colors.textPrimary }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading role details…</h1>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="max-w-7xl mx-auto py-10 px-6"
        style={{ color: colors.textPrimary }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Failed to load role</h1>
          <p className="mb-6" style={{ color: colors.textMuted }}>
            {error}
          </p>
          <button
            onClick={() => navigate('/matches')}
            className="px-6 py-2 rounded-md font-semibold transition-colors"
            style={{
              backgroundColor: colors.accent,
              color: '#2E2E38',
            }}
          >
            Back to Match Results
          </button>
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div
        className="max-w-7xl mx-auto py-10 px-6"
        style={{ color: colors.textPrimary }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Role not found</h1>
          <p className="mb-6" style={{ color: colors.textMuted }}>
            The role you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/matches')}
            className="px-6 py-2 rounded-md font-semibold transition-colors"
            style={{
              backgroundColor: colors.accent,
              color: '#2E2E38',
            }}
          >
            Back to Match Results
          </button>
        </div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <RoleOverview match={match} />
      case 'skills':
        return <RoleSkillsGap match={match} />
      case 'path':
        return <RolePathTo match={match} />
      case 'patterns':
        return <RoleSuccessPatterns match={match} />
      default:
        return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-6">
      {/* Header with back button and role title */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 px-3 py-2 rounded-md text-sm font-semibold transition-colors inline-flex items-center gap-2"
          style={{
            backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
            color: colors.textPrimary,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: colors.textPrimary }}
        >
          {match.job_title}
        </h1>
        <p
          className="text-lg"
          style={{ color: colors.textMuted }}
        >
          {match.service_line} · {match.department} · {match.location}
        </p>
      </div>

      {/* Sub-navigation tabs */}
      <div
        className="border-b mb-6"
        style={{ borderColor: colors.border }}
      >
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                activeTab === tab.id
                  ? 'border-current'
                  : 'border-transparent hover:border-current/30'
              }`}
              style={{
                color: activeTab === tab.id ? colors.accent : colors.textSecondary,
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="min-h-[500px]">
        {renderTabContent()}
      </div>
    </div>
  )
}
