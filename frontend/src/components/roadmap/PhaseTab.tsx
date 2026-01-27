/**
 * PhaseTab - Individual phase content with milestones and extras
 *
 * Contains:
 * - Phase header with progress ring
 * - Description and target role
 * - Milestone list with checkboxes
 * - Extras section
 * - Navigation to next/previous phases
 */

import { useTheme, themeColors } from '../../context/ThemeContext';
import { useRoadmap } from '../../hooks/useRoadmap';
import MilestoneCard from './MilestoneCard';
import ExtrasSection from './ExtrasSection';

export default function PhaseTab() {
  const { isDark } = useTheme();
  const colors = isDark ? themeColors.dark : themeColors.light;

  const {
    roadmap,
    currentPhaseData,
    phaseProgress,
    goToNextPhase,
    goToPreviousPhase,
    activeTab,
  } = useRoadmap();

  if (!currentPhaseData || !roadmap) return null;

  const progress = phaseProgress(currentPhaseData.id);
  const phaseIndex = roadmap.phases.findIndex(p => p.id === currentPhaseData.id);
  const isFirstPhase = phaseIndex === 0;
  const isLastPhase = phaseIndex === roadmap.phases.length - 1;

  return (
    <div className="space-y-6">
      {/* Phase Header */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <div className="flex items-start gap-6">
          {/* Progress Ring */}
          <div className="relative flex-shrink-0">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                strokeWidth="8"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke={progress.percentage === 100 ? '#22c55e' : colors.accent}
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress.percentage / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                  {progress.percentage}%
                </div>
                <div className="text-xs" style={{ color: colors.textMuted }}>
                  complete
                </div>
              </div>
            </div>
          </div>

          {/* Phase Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span
                className="text-xs font-medium px-2 py-1 rounded"
                style={{ backgroundColor: colors.accent + '30', color: colors.accent }}
              >
                Phase {phaseIndex + 1}
              </span>
              <span className="text-sm" style={{ color: colors.textMuted }}>
                {currentPhaseData.estimated_duration_months} months
              </span>
            </div>

            <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              {currentPhaseData.name}
            </h2>

            {currentPhaseData.target_role && (
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3"
                style={{ backgroundColor: colors.accent + '20' }}
              >
                <span className="text-sm" style={{ color: colors.textMuted }}>Target:</span>
                <span className="text-sm font-medium" style={{ color: colors.accent }}>
                  {currentPhaseData.target_role}
                </span>
              </div>
            )}

            <p style={{ color: colors.textSecondary }}>
              {currentPhaseData.description}
            </p>

            {/* Progress Stats */}
            <div className="mt-4 flex items-center gap-6">
              <div>
                <span className="text-2xl font-bold" style={{ color: '#22c55e' }}>
                  {progress.completed}
                </span>
                <span className="text-sm ml-1" style={{ color: colors.textMuted }}>
                  completed
                </span>
              </div>
              <div>
                <span className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                  {progress.total - progress.completed}
                </span>
                <span className="text-sm ml-1" style={{ color: colors.textMuted }}>
                  remaining
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousPhase}
          disabled={isFirstPhase}
          className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            color: isFirstPhase ? colors.textMuted : colors.textPrimary,
            opacity: isFirstPhase ? 0.5 : 1,
          }}
        >
          <span>&lt;-</span>
          <span>Previous Phase</span>
        </button>

        <div className="text-sm" style={{ color: colors.textMuted }}>
          {phaseIndex + 1} of {roadmap.phases.length}
        </div>

        <button
          onClick={goToNextPhase}
          disabled={isLastPhase}
          className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
          style={{
            backgroundColor: isLastPhase ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : colors.accent,
            color: isLastPhase ? colors.textMuted : '#2e2e38',
            opacity: isLastPhase ? 0.5 : 1,
          }}
        >
          <span>Next Phase</span>
          <span>-&gt;</span>
        </button>
      </div>

      {/* Milestones */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
          Milestones ({progress.completed}/{progress.total})
        </h3>

        <div className="space-y-3">
          {currentPhaseData.milestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              phaseId={currentPhaseData.id}
            />
          ))}
        </div>
      </div>

      {/* Extras Section */}
      <ExtrasSection phaseId={currentPhaseData.id} />

      {/* Phase Complete Message */}
      {progress.percentage === 100 && (
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: 'linear-gradient(135deg, #22c55e20 0%, #22c55e10 100%)',
            border: '1px solid #22c55e40',
          }}
        >
          <div className="text-3xl mb-2">Phase Complete!</div>
          <p style={{ color: colors.textSecondary }}>
            You've completed all milestones in this phase.
            {!isLastPhase && ' Ready for the next challenge?'}
          </p>
          {!isLastPhase && (
            <button
              onClick={goToNextPhase}
              className="mt-4 px-6 py-3 rounded-xl font-semibold"
              style={{ backgroundColor: colors.accent, color: '#2e2e38' }}
            >
              Continue to Phase {phaseIndex + 2} -&gt;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
