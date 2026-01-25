import { useState, useMemo } from 'react'
import { useTheme, themeColors } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useSavedRoles } from '../context/SavedRolesContext'
import SkillsDashboard from '../components/skills/SkillsDashboard'
import ResumeUpload from '../components/skills/ResumeUpload'
import { useSkillsContext } from '../context/SkillsContext'
import { DARK_THEME, LIGHT_THEME } from '../components/skills/ThemeSwitcher'

export default function ProfilePage() {
  const { isDark } = useTheme()
  const colors = isDark ? themeColors.dark : themeColors.light
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

  // Theme object for ResumeUpload component
  const theme = isDark ? DARK_THEME : LIGHT_THEME

  // Handle skills extracted from resume upload
  // ResumeUpload already generates groupings, so we just need to refresh the UI
  const handleSkillsExtracted = async () => {
    console.log('Skills extraction complete, refreshing skills list...')
    // Refresh groupings first (ResumeUpload already generated them)
    await fetchSkillGroupings()
    // Then refresh all skills to update the UI
    await refreshAllSkills()
  }

  // Handle enhance skills button click
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
    } catch (err) {
      console.error('Failed to enhance skills:', err)
    } finally {
      setIsEnhancing(false)
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
        <p style={{ color: colors.textMuted }} className="mb-4">
          Upload your resume to extract skills and get better match recommendations
        </p>
        <ResumeUpload onSkillsExtracted={handleSkillsExtracted} clearSkills={clearSkills} theme={theme} />
      </div>

      {/* Skills from Saved Roles Section */}
      {savedRoleSkills.length > 0 && (
        <div
          className="p-6 rounded-lg mb-8"
          style={{
            backgroundColor: isDark ? 'rgba(255, 230, 0, 0.08)' : 'rgba(255, 230, 0, 0.1)',
            border: `1px solid ${isDark ? 'rgba(255, 230, 0, 0.3)' : 'rgba(255, 230, 0, 0.4)'}`,
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
            {savedRoleSkills.slice(0, 20).map((skill, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  color: colors.textPrimary,
                }}
              >
                {skill}
              </span>
            ))}
            {savedRoleSkills.length > 20 && (
              <span
                className="px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  color: colors.textMuted,
                }}
              >
                +{savedRoleSkills.length - 20} more
              </span>
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
