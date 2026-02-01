/**
 * InsightsTab - Quick wins, challenges, and critical skills
 *
 * Contains:
 * - Quick Wins section (start this week)
 * - Current Challenges / Blockers
 * - Critical Skills status
 */

import { useTheme, themeColors } from '../../context/ThemeContext';
import { useRoadmap } from '../../hooks/useRoadmap';

export default function InsightsTab() {
  const { theme, isDark, isGame } = useTheme();
  const colors = themeColors[theme];

  const { roadmap } = useRoadmap();

  if (!roadmap) return null;

  return (
    <div className="space-y-8">
      {/* Quick Wins */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: (isDark || isGame) ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.08)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#22c55e' }}
          >
            <span className="text-white text-lg">!</span>
          </div>
          <h3 className="text-xl font-semibold" style={{ color: '#22c55e' }}>
            Quick Wins - Start This Week
          </h3>
        </div>

        <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
          These are things you can start right now with immediate impact on your career progression.
        </p>

        <ul className="space-y-3">
          {roadmap.quick_wins.map((win, i) => (
            <li
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-green-500/10"
              style={{ backgroundColor: (isDark || isGame) ? 'rgba(34, 197, 94, 0.05)' : 'rgba(34, 197, 94, 0.05)' }}
            >
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: '#22c55e', color: 'white' }}
              >
                {i + 1}
              </span>
              <span style={{ color: colors.textPrimary }}>{win}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Critical Skills */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colors.accent }}
          >
            <span className="text-gray-900 text-lg">*</span>
          </div>
          <h3 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
            Critical Skills to Develop
          </h3>
        </div>

        <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
          These are the most important skills across your entire journey. Focus on these throughout your roadmap.
        </p>

        <div className="flex flex-wrap gap-3">
          {roadmap.critical_skills_to_develop.map((skill, i) => (
            <div
              key={i}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                backgroundColor: (isDark || isGame) ? 'rgba(255, 230, 0, 0.15)' : 'rgba(255, 230, 0, 0.2)',
                color: colors.textPrimary,
                border: `1px solid ${colors.accent}40`,
              }}
            >
              {skill}
            </div>
          ))}
        </div>
      </div>

      {/* Potential Challenges */}
      {roadmap.potential_blockers.length > 0 && (
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: (isDark || isGame) ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#dc2626' }}
            >
              <span className="text-white text-lg">!</span>
            </div>
            <h3 className="text-xl font-semibold" style={{ color: '#dc2626' }}>
              Potential Challenges
            </h3>
          </div>

          <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
            Be aware of these potential blockers. Having a plan for them will help you stay on track.
          </p>

          <ul className="space-y-3">
            {roadmap.potential_blockers.map((blocker, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{ backgroundColor: (isDark || isGame) ? 'rgba(220, 38, 38, 0.05)' : 'rgba(220, 38, 38, 0.05)' }}
              >
                <span style={{ color: '#dc2626' }} className="flex-shrink-0 font-bold">
                  !
                </span>
                <span style={{ color: colors.textPrimary }}>{blocker}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Journey Summary */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
          Your Journey at a Glance
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: (isDark || isGame) ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
            <div className="text-3xl font-bold" style={{ color: colors.accent }}>
              {roadmap.quick_wins.length}
            </div>
            <div className="text-sm" style={{ color: colors.textMuted }}>
              Quick Wins
            </div>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: (isDark || isGame) ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
            <div className="text-3xl font-bold" style={{ color: colors.accent }}>
              {roadmap.critical_skills_to_develop.length}
            </div>
            <div className="text-sm" style={{ color: colors.textMuted }}>
              Critical Skills
            </div>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: (isDark || isGame) ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
            <div className="text-3xl font-bold" style={{ color: '#dc2626' }}>
              {roadmap.potential_blockers.length}
            </div>
            <div className="text-sm" style={{ color: colors.textMuted }}>
              Challenges to Prepare For
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
