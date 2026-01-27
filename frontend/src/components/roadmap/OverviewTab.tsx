/**
 * OverviewTab - Executive summary and progress visualization
 *
 * Contains:
 * - Executive summary (why this roadmap)
 * - Dynamic progress visualization
 * - Phase timeline with clickable navigation
 * - Key stats
 */

import { useTheme, themeColors } from '../../context/ThemeContext';
import { useRoadmap } from '../../hooks/useRoadmap';

export default function OverviewTab() {
  const { theme, isDark, isGame } = useTheme();
  const colors = themeColors[theme];

  const {
    roadmap,
    overallProgress,
    completedCount,
    totalCount,
    extrasCount,
    currentPhase,
    goToPhase,
    phaseProgress,
  } = useRoadmap();

  if (!roadmap) return null;

  return (
    <div className="space-y-8">
      {/* Hero Stats */}
      <div
        className="rounded-2xl p-8"
        style={{
          backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <h2 className="text-2xl font-bold mb-6" style={{ color: colors.textPrimary }}>
          Your Career Roadmap
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="text-center">
            <div className="text-4xl font-bold" style={{ color: colors.accent }}>
              {roadmap.total_estimated_months}
            </div>
            <div className="text-sm mt-1" style={{ color: colors.textMuted }}>
              months total
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold" style={{ color: colors.accent }}>
              {roadmap.phases.length}
            </div>
            <div className="text-sm mt-1" style={{ color: colors.textMuted }}>
              phases
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold" style={{ color: colors.accent }}>
              {completedCount}/{totalCount}
            </div>
            <div className="text-sm mt-1" style={{ color: colors.textMuted }}>
              milestones done
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold" style={{ color: '#22c55e' }}>
              {extrasCount}
            </div>
            <div className="text-sm mt-1" style={{ color: colors.textMuted }}>
              extras achieved
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="prose max-w-none" style={{ color: colors.textSecondary }}>
          {roadmap.executive_summary.split('\n\n').map((para, i) => (
            <p key={i} className="mb-4 leading-relaxed text-lg">
              {para}
            </p>
          ))}
        </div>

        {roadmap.customization_notes && (
          <div
            className="mt-6 p-4 rounded-lg"
            style={{ backgroundColor: (isDark || isGame) ? 'rgba(255, 230, 0, 0.1)' : 'rgba(255, 230, 0, 0.15)' }}
          >
            <span className="text-sm" style={{ color: colors.textMuted }}>
              Personalization: {roadmap.customization_notes}
            </span>
          </div>
        )}
      </div>

      {/* Phase Timeline */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <h3 className="text-lg font-semibold mb-6" style={{ color: colors.textPrimary }}>
          Your Journey
        </h3>

        <div className="relative">
          {/* Timeline Line */}
          <div
            className="absolute left-6 top-0 bottom-0 w-0.5"
            style={{ backgroundColor: (isDark || isGame) ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
          />

          {/* Timeline Progress */}
          <div
            className="absolute left-6 top-0 w-0.5 transition-all duration-500"
            style={{
              height: `${(overallProgress / 100) * 100}%`,
              backgroundColor: colors.accent,
            }}
          />

          <div className="space-y-6">
            {roadmap.phases.map((phase, index) => {
              const progress = phaseProgress(phase.id);
              const isComplete = progress.percentage === 100;
              const isCurrent = currentPhase?.id === phase.id;

              return (
                <div
                  key={phase.id}
                  className="flex items-start gap-4 cursor-pointer group"
                  onClick={() => goToPhase(phase.id)}
                >
                  {/* Phase Circle */}
                  <div
                    className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all group-hover:scale-110"
                    style={{
                      backgroundColor: isComplete
                        ? '#22c55e'
                        : isCurrent
                        ? colors.accent
                        : isDark
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.1)',
                      color: isComplete || isCurrent ? '#2e2e38' : colors.textMuted,
                      border: isCurrent ? `3px solid ${colors.accent}` : 'none',
                    }}
                  >
                    {isComplete ? 'OK' : index + 1}
                  </div>

                  {/* Phase Info */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-3">
                      <span
                        className="font-semibold transition-colors group-hover:text-yellow-500"
                        style={{ color: isCurrent ? colors.accent : colors.textPrimary }}
                      >
                        {phase.name}
                      </span>
                      {phase.target_role && (
                        <span className="text-sm" style={{ color: colors.textMuted }}>
                          -&gt; {phase.target_role}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: (isDark || isGame) ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: colors.textMuted }}>
                        {phase.estimated_duration_months} mo
                      </span>
                    </div>

                    <p className="text-sm mt-1 line-clamp-2" style={{ color: colors.textSecondary }}>
                      {phase.description}
                    </p>

                    {/* Mini Progress Bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className="flex-1 h-1.5 rounded-full overflow-hidden max-w-xs"
                        style={{ backgroundColor: (isDark || isGame) ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${progress.percentage}%`,
                            backgroundColor: isComplete ? '#22c55e' : colors.accent,
                          }}
                        />
                      </div>
                      <span className="text-xs" style={{ color: colors.textMuted }}>
                        {progress.completed}/{progress.total}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Current Status */}
      {currentPhase && overallProgress < 100 && (
        <div
          className="rounded-2xl p-6"
          style={{
            background: `linear-gradient(135deg, ${colors.accent}20 0%, ${colors.accent}10 100%)`,
            border: `1px solid ${colors.accent}40`,
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: colors.accent, color: '#2e2e38' }}
            >
              <span className="text-2xl font-bold">{currentPhase.index + 1}</span>
            </div>
            <div>
              <div className="text-sm" style={{ color: colors.textMuted }}>
                You're currently working on
              </div>
              <div className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                {currentPhase.name}
              </div>
              <button
                onClick={() => goToPhase(currentPhase.id)}
                className="mt-2 text-sm font-medium"
                style={{ color: colors.accent }}
              >
                View Phase Details -&gt;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Message */}
      {overallProgress >= 100 && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'linear-gradient(135deg, #22c55e20 0%, #22c55e10 100%)',
            border: '1px solid #22c55e40',
          }}
        >
          <div className="text-4xl mb-4">Congratulations!</div>
          <div className="text-xl font-bold mb-2" style={{ color: '#22c55e' }}>
            You've completed your roadmap!
          </div>
          <p style={{ color: colors.textSecondary }}>
            You've achieved all {totalCount} milestones
            {extrasCount > 0 && ` plus ${extrasCount} extra achievements`}.
            Time to set new goals!
          </p>
        </div>
      )}
    </div>
  );
}
