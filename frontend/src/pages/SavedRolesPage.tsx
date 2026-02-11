import { useState, useEffect } from 'react'
import { useTheme, themeColors } from '../context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { getSavedMatches, deleteSavedMatch, SavedMatch } from '../services/matchService'
import MatchCard from '../components/matches/MatchCard'
import { Match } from '../services/mockMatchData'

export default function SavedRolesPage() {
  const { theme, isDark, isGame } = useTheme()
  const colors = themeColors[theme]
  const navigate = useNavigate()
  const [savedRoles, setSavedRoles] = useState<SavedMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSavedRoles()
  }, [])

  const loadSavedRoles = async () => {
    try {
      setLoading(true)
      setError(null)
      const matches = await getSavedMatches()
      setSavedRoles(matches)
    } catch (err) {
      console.error('Failed to load saved roles:', err)
      setError('Failed to load saved roles. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUnsave = async (matchId: string) => {
    try {
      await deleteSavedMatch(matchId)
      setSavedRoles(savedRoles.filter(m => m.match_id !== matchId))
    } catch (err) {
      console.error('Failed to unsave role:', err)
      alert('Failed to remove saved role. Please try again.')
    }
  }

  const convertSavedMatchToMatch = (saved: SavedMatch): Match => {
    return {
      id: saved.job_id,
      job_id: saved.job_id,
      job_title: saved.job_title,
      service_line: saved.service_line,
      department: saved.department,
      location: saved.location,
      posted_date: new Date(saved.saved_at).toISOString().split('T')[0],
      experience_required: undefined,
      overall_score: saved.scores.overall,
      skill_match_score: saved.scores.skill_match,
      experience_score: saved.scores.experience_match,
      role_fit_score: saved.scores.role_fit,
      matched_skills: saved.matched_skills,
      skill_gaps: saved.skill_gaps,
      explanation: saved.explanation || '',
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-6">
      <h1 className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
        Saved Roles
      </h1>
      <p className="mb-8" style={{ color: colors.textMuted }}>
        Roles you've bookmarked for later review
      </p>

      {loading ? (
        <div className="text-center py-12" style={{ color: colors.textMuted }}>
          Loading saved roles...
        </div>
      ) : error ? (
        <div
          className="p-6 rounded-lg text-center"
          style={{
            backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <p style={{ color: colors.textPrimary }}>{error}</p>
          <button
            onClick={loadSavedRoles}
            className="mt-4 px-4 py-2 rounded-md font-semibold transition-colors"
            style={{
              backgroundColor: colors.accent,
              color: '#2E2E38',
            }}
          >
            Retry
          </button>
        </div>
      ) : savedRoles.length === 0 ? (
        <div
          className="p-12 rounded-lg text-center"
          style={{
            backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
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
          {savedRoles.map((saved) => {
            const match = convertSavedMatchToMatch(saved)
            return (
              <div key={saved.match_id} className="relative">
                <MatchCard
                  match={match}
                  onViewDetails={(id) => navigate(`/role/${id}`)}
                  onSave={() => handleUnsave(saved.match_id)}
                />
                <button
                  onClick={() => handleUnsave(saved.match_id)}
                  className="absolute top-4 right-4 px-3 py-1 text-sm rounded-md transition-colors"
                  style={{
                    backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    color: colors.textPrimary,
                  }}
                  title="Remove from saved"
                >
                  Remove
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
