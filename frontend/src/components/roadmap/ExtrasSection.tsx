/**
 * ExtrasSection - Display and manage user-added achievements
 *
 * Features:
 * - Collapsible section showing extras for a phase
 * - Add Extra button
 * - Delete functionality
 * - Category badges
 */

import { useState } from 'react';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { useRoadmap } from '../../hooks/useRoadmap';
import AddExtraModal from './AddExtraModal';

interface ExtrasSectionProps {
  phaseId: string;
}

export default function ExtrasSection({ phaseId }: ExtrasSectionProps) {
  const { isDark } = useTheme();
  const colors = isDark ? themeColors.dark : themeColors.light;

  const { extrasByPhase, deleteExtra } = useRoadmap();
  const extras = extrasByPhase[phaseId] || [];

  const [isExpanded, setIsExpanded] = useState(extras.length > 0);
  const [showAddModal, setShowAddModal] = useState(false);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'certification': return '#f59e0b';
      case 'skill': return '#3b82f6';
      case 'project': return '#8b5cf6';
      case 'achievement': return '#22c55e';
      default: return colors.textMuted;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: isDark ? 'rgba(34, 197, 94, 0.05)' : 'rgba(34, 197, 94, 0.05)',
        border: '1px solid rgba(34, 197, 94, 0.2)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#22c55e20' }}
          >
            <span style={{ color: '#22c55e' }}>+</span>
          </div>
          <div>
            <span className="font-medium" style={{ color: '#22c55e' }}>
              Extra Achievements
            </span>
            {extras.length > 0 && (
              <span
                className="ml-2 text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#22c55e', color: 'white' }}
              >
                {extras.length}
              </span>
            )}
          </div>
        </div>
        <span style={{ color: colors.textMuted }}>
          {isExpanded ? '[-]' : '[+]'}
        </span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {extras.length === 0 ? (
            <p className="text-sm" style={{ color: colors.textMuted }}>
              Track achievements beyond your roadmap! Earned extra certifications? Completed additional projects? Add them here.
            </p>
          ) : (
            <div className="space-y-2">
              {extras.map((extra) => (
                <div
                  key={extra.id}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: `${getCategoryColor(extra.category)}20`,
                      color: getCategoryColor(extra.category),
                    }}
                  >
                    {extra.category[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium" style={{ color: colors.textPrimary }}>
                        {extra.title}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${getCategoryColor(extra.category)}20`,
                          color: getCategoryColor(extra.category),
                        }}
                      >
                        {extra.category}
                      </span>
                    </div>
                    {extra.description && (
                      <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                        {extra.description}
                      </p>
                    )}
                    <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                      Completed {formatDate(extra.completed_at)}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteExtra(extra.id)}
                    className="flex-shrink-0 p-1 rounded hover:bg-red-500/10 transition-colors"
                    style={{ color: '#dc2626' }}
                    title="Delete extra"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full py-3 rounded-lg border-2 border-dashed transition-colors hover:border-green-500 hover:bg-green-500/5"
            style={{ borderColor: '#22c55e40', color: '#22c55e' }}
          >
            + Add Extra Achievement
          </button>
        </div>
      )}

      {/* Add Extra Modal */}
      {showAddModal && (
        <AddExtraModal
          phaseId={phaseId}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
