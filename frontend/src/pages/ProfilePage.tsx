import { useState, useMemo, useEffect } from 'react'
import { useTheme, themeColors } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useSavedRoles } from '../context/SavedRolesContext'
import SkillsDashboard from '../components/skills/SkillsDashboard'
import ResumeUpload from '../components/skills/ResumeUpload'
import { useSkillsContext } from '../context/SkillsContext'
import { DARK_THEME, LIGHT_THEME } from '../components/skills/ThemeSwitcher'
import { quickAddSkill, getStaleSkills } from '../services/skillProgressService'

export default function ProfilePage() {
  const { theme, isDark, isGame } = useTheme()
  const colors = themeColors[theme]
  const { user } = useAuth()
  const {
    refreshAllSkills,
    clearSkills,
    skills,
    skillCategories,
    enhanceSkillGroupings,
    fetchSkillGroupings
  } = useSkillsContext()

  // Get saved roles
  const savedRolesContext = useSavedRoles()
  const savedRoles = savedRolesContext?.state.savedRoles || []

  // State for enhance button
  const [isEnhancing, setIsEnhancing] = useState(false)

  // State for individual skill quick-add
  const [addingSkill, setAddingSkill] = useState<string | null>(null)
  const [addedSkills, setAddedSkills] = useState<Set<string>>(new Set())

  // State for stale skills warning
  const [staleSkills, setStaleSkills] = useState<Array<{
    skill_name: string;
    proficiency: number;
    proficiency_label: string;
    last_updated: string | null;
    days_since_update: number | null;
  }>>([])
  const [loadingStale, setLoadingStale] = useState(false)

  // Fetch stale skills on mount
  useEffect(() => {
    const fetchStale = async () => {
      setLoadingStale(true)
      try {
        const result = await getStaleSkills()
        setStaleSkills(result.stale_skills)
      } catch (err) {
        console.error('Failed to fetch stale skills:', err)
      } finally {
        setLoadingStale(false)
      }
    }
    fetchStale()
  }, [skills])

  // Collect all skills from saved roles that user doesn't have yet
  const savedRoleSkills = useMemo(() => {
    const userSkillNames = new Set(skills.map((s: any) => s.name?.toLowerCase()))
    const skillSet = new Set<string>()

    savedRoles.forEach((role: any) => {
      // Add skill gaps (skills user needs)
      (role.skill_gaps || []).forEach((skill: string) => {
        if (!userSkillNames.has(skill.toLowerCase())) {
          skillSet.add(skill)
        }
      })
    })

    return Array.from(skillSet)
  }, [savedRoles, skills])

  // Theme object for ResumeUpload component (uses local theme constants)
  const localTheme = (isDark || isGame) ? DARK_THEME : LIGHT_THEME

  // Handle skills extracted from resume upload
  // ResumeUpload already generates groupings, so we just need to refresh the UI
  const handleSkillsExtracted = async () => {
    console.log('Skills extraction complete, refreshing skills list...')
    // Refresh groupings first (ResumeUpload already generated them)
    await fetchSkillGroupings()
    // Then refresh all skills to update the UI
    await refreshAllSkills()
  }

  // Handle enhance skills button click (bulk add)
  const handleEnhanceSkills = async () => {
    if (savedRoleSkills.length === 0) return

    setIsEnhancing(true)
    try {
      const existingGroupings = { categories: skillCategories }
      // Backend now adds skills to profile AND creates tracking records
      await enhanceSkillGroupings(existingGroupings, savedRoleSkills)
      // Refresh groupings first (to get updated categories)
      await fetchSkillGroupings()
      // Then refresh skills to show them in UI
      await refreshAllSkills()
      // Mark all as added
      setAddedSkills(new Set(savedRoleSkills.map(s => s.toLowerCase())))
    } catch (err) {
      console.error('Failed to enhance skills:', err)
    } finally {
      setIsEnhancing(false)
    }
  }

  // Handle individual skill quick-add
  const handleQuickAddSkill = async (skillName: string) => {
    setAddingSkill(skillName)
    try {
      await quickAddSkill(skillName, 'job_gap')
      // Refresh the skills list
      await refreshAllSkills()
      // Mark as added
      setAddedSkills(prev => new Set([...prev, skillName.toLowerCase()]))
    } catch (err) {
      console.error('Failed to add skill:', err)
    } finally {
      setAddingSkill(null)
    }
  }

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
          backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
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
                backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
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
          backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
          Resume
        </h3>
        <p style={{ color: colors.textMuted }} className="mb-4">
          Upload your resume to extract skills and get better match recommendations
        </p>
        <ResumeUpload onSkillsExtracted={handleSkillsExtracted} clearSkills={clearSkills} theme={localTheme} />
      </div>

      {/* Skills from Saved Roles Section */}
      {savedRoleSkills.length > 0 && (
        <div
          className="p-6 rounded-lg mb-8"
          style={{
            backgroundColor: (isDark || isGame) ? 'rgba(255, 230, 0, 0.08)' : 'rgba(255, 230, 0, 0.1)',
            border: `1px solid ${(isDark || isGame) ? 'rgba(255, 230, 0, 0.3)' : 'rgba(255, 230, 0, 0.4)'}`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                Skills from Your Saved Roles
              </h3>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                These {savedRoleSkills.length} skills are required by roles you're interested in
              </p>
            </div>
            <button
              onClick={handleEnhanceSkills}
              disabled={isEnhancing}
              className="px-4 py-2 rounded-md font-semibold transition-all active:scale-95"
              style={{
                backgroundColor: colors.accent,
                color: '#2E2E38',
                opacity: isEnhancing ? 0.7 : 1,
              }}
            >
              {isEnhancing ? 'Enhancing...' : 'Add to My Goals'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {savedRoleSkills.slice(0, 20).map((skill, i) => {
              const isAdded = addedSkills.has(skill.toLowerCase())
              const isAdding = addingSkill === skill

              return (
                <button
                  key={i}
                  onClick={() => !isAdded && handleQuickAddSkill(skill)}
                  disabled={isAdded || isAdding || isEnhancing}
                  className="px-3 py-1 rounded-full text-sm flex items-center gap-1.5 transition-all"
                  style={{
                    backgroundColor: isAdded
                      ? (isDark || isGame) ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)'
                      : (isDark || isGame) ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    color: isAdded ? '#22c55e' : colors.textPrimary,
                    cursor: isAdded ? 'default' : 'pointer',
                    opacity: isAdding ? 0.6 : 1,
                  }}
                >
                  {skill}
                  {isAdded ? (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : isAdding ? (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </button>
              )
            })}
            {savedRoleSkills.length > 20 && (
              <span
                className="px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  color: colors.textMuted,
                }}
              >
                +{savedRoleSkills.length - 20} more
              </span>
            )}
          </div>
          <p className="text-xs mt-3" style={{ color: colors.textMuted }}>
            Click individual skills to add them, or use "Add to My Goals" to add all at once
          </p>
        </div>
      )}

      {/* Stale Skills Warning */}
      {staleSkills.length > 0 && !loadingStale && (
        <div
          className="p-6 rounded-lg mb-8"
          style={{
            backgroundColor: (isDark || isGame) ? 'rgba(251, 146, 60, 0.1)' : 'rgba(251, 146, 60, 0.08)',
            border: `1px solid ${(isDark || isGame) ? 'rgba(251, 146, 60, 0.3)' : 'rgba(251, 146, 60, 0.4)'}`,
          }}
        >
          <div className="flex items-start gap-3 mb-4">
            <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                Skills Need Attention
              </h3>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                These {staleSkills.length} skills haven't been updated in over 6 months. Consider reviewing your proficiency levels.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {staleSkills.slice(0, 5).map((skill, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{
                  backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.05)' : 'white',
                  border: `1px solid ${colors.cardBorder}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium" style={{ color: colors.textPrimary }}>
                    {skill.skill_name}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      color: colors.textSecondary,
                    }}
                  >
                    Level {skill.proficiency}: {skill.proficiency_label}
                  </span>
                </div>
                <span className="text-sm" style={{ color: colors.textMuted }}>
                  {skill.days_since_update ? `${skill.days_since_update} days ago` : 'Never updated'}
                </span>
              </div>
            ))}
            {staleSkills.length > 5 && (
              <p className="text-sm text-center pt-2" style={{ color: colors.textMuted }}>
                +{staleSkills.length - 5} more skills need attention
              </p>
            )}
          </div>
        </div>
      )}

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
