/**
 * GlobalProgressBar - Sticky progress bar visible across all tabs
 *
 * Shows:
 * - Overall completion percentage with animated fill
 * - Current phase indicator
 * - Milestone count (X of Y complete)
 * - Extras count badge
 */

import { useTheme, themeColors } from '../../context/ThemeContext';
import { useRoadmap } from '../../hooks/useRoadmap';

export default function GlobalProgressBar() {
  const { isDark } = useTheme();
  const colors = isDark ? themeColors.dark : themeColors.light;

  const {
    overallProgress,
    completedCount,
    totalCount,
    extrasCount,
    currentPhase,
    celebrationMilestone,
  } = useRoadmap();

  return (
    <div
      className="sticky top-0 z-20 px-6 py-4 backdrop-blur-md"
      style={{
        backgroundColor: isDark ? 'rgba(30, 30, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderBottom: `1px solid ${colors.cardBorder}`,
      }}
    >
      <div className="flex items-center gap-6">
        {/* Progress Circle */}
        <div className="relative">
          <svg className="w-14 h-14 transform -rotate-90">
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
              strokeWidth="4"
            />
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke={colors.accent}
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 24}`}
              strokeDashoffset={`${2 * Math.PI * 24 * (1 - overallProgress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold" style={{ color: colors.textPrimary }}>
              {Math.round(overallProgress)}%
            </span>
          </div>
        </div>

        {/* Progress Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-semibold" style={{ color: colors.textPrimary }}>
              {completedCount} of {totalCount} milestones complete
            </span>
            {extrasCount > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: '#22c55e20',
                  color: '#22c55e',
                }}
              >
                +{extrasCount} extra{extrasCount > 1 ? 's' : ''}
              </span>
            )}
            {celebrationMilestone && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium animate-pulse"
                style={{
                  backgroundColor: colors.accent + '30',
                  color: colors.accent,
                }}
              >
                {celebrationMilestone}% milestone!
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${overallProgress}%`,
                background: `linear-gradient(90deg, ${colors.accent} 0%, #22c55e 100%)`,
              }}
            />
          </div>

          {/* Current Phase */}
          {currentPhase && (
            <div className="mt-1 text-sm" style={{ color: colors.textMuted }}>
              Currently on: <span style={{ color: colors.accent }}>{currentPhase.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
