/**
 * MilestoneCard - Interactive card for a single milestone
 *
 * Features:
 * - Click checkbox to toggle completion
 * - Expand/collapse for details
 * - Edit button in manual edit mode
 * - Manual edit badge if modified
 * - Notes section
 */

import { useState } from 'react';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { useRoadmap } from '../../hooks/useRoadmap';
import { RoadmapMilestone } from '../../services/roadmapService';

interface MilestoneCardProps {
  milestone: RoadmapMilestone;
  phaseId: string;
  isManuallyEdited?: boolean;
}

export default function MilestoneCard({ milestone, phaseId, isManuallyEdited = false }: MilestoneCardProps) {
  const { isDark } = useTheme();
  const colors = isDark ? themeColors.dark : themeColors.light;

  const {
    toggleMilestone,
    isMilestoneCompleted,
    getMilestoneProgress,
    expandedMilestones,
    toggleMilestoneExpanded,
    updateMilestoneNotes,
    isManualEditing,
  } = useRoadmap();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const isCompleted = isMilestoneCompleted(milestone.id);
  const progress = getMilestoneProgress(milestone.id);
  const isExpanded = expandedMilestones.has(milestone.id);

  const handleEditClick = () => {
    setEditTitle(milestone.title);
    setEditDescription(milestone.description);
    setEditNotes(progress?.notes || '');
    setShowEditModal(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save notes first
      if (editNotes !== (progress?.notes || '')) {
        await updateMilestoneNotes(milestone.id, phaseId, editNotes);
      }
      // Note: Title/description changes would require updating the roadmap data
      // For now, we just save notes. Full content editing would need backend support.
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'skill': return 'S';
      case 'experience': return 'E';
      case 'certification': return 'C';
      case 'leadership': return 'L';
      case 'networking': return 'N';
      default: return '*';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'skill': return '#3b82f6';
      case 'experience': return '#8b5cf6';
      case 'certification': return '#f59e0b';
      case 'leadership': return '#ec4899';
      case 'networking': return '#06b6d4';
      default: return colors.textMuted;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      default: return colors.textMuted;
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMilestone(milestone.id, phaseId);
  };

  return (
    <div
      className={`rounded-xl overflow-hidden transition-all ${isCompleted ? 'opacity-80' : ''}`}
      style={{
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
        border: `1px solid ${isCompleted ? '#22c55e40' : colors.cardBorder}`,
      }}
    >
      {/* Main Content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Completion Checkbox */}
          <button
            onClick={handleToggle}
            className="flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all hover:scale-110"
            style={{
              borderColor: isCompleted ? '#22c55e' : colors.textMuted,
              backgroundColor: isCompleted ? '#22c55e' : 'transparent',
            }}
          >
            {isCompleted && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Category Badge */}
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: `${getCategoryColor(milestone.category)}20`, color: getCategoryColor(milestone.category) }}
          >
            {getCategoryIcon(milestone.category)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`font-medium ${isCompleted ? 'line-through' : ''}`}
                style={{ color: colors.textPrimary }}
              >
                {milestone.title}
              </span>

              {/* Priority Badge */}
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  backgroundColor: `${getPriorityColor(milestone.priority)}20`,
                  color: getPriorityColor(milestone.priority),
                }}
              >
                {milestone.priority}
              </span>

              {/* Duration */}
              <span className="text-xs" style={{ color: colors.textMuted }}>
                ~{milestone.estimated_duration_months} mo
              </span>

              {/* Manual Edit Badge */}
              {isManuallyEdited && (
                <span
                  className="text-xs px-2 py-0.5 rounded flex items-center gap-1"
                  style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}
                  title="This milestone has been manually modified"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Modified
                </span>
              )}
            </div>

            <p
              className={`text-sm mt-1 ${isCompleted ? 'line-through' : ''}`}
              style={{ color: colors.textSecondary }}
            >
              {milestone.description}
            </p>

            {/* Expand Button */}
            <button
              onClick={() => toggleMilestoneExpanded(milestone.id)}
              className="text-xs mt-2 font-medium"
              style={{ color: colors.accent }}
            >
              {isExpanded ? 'Show less' : 'Show details'}
            </button>
          </div>

          {/* Edit Button (in manual edit mode) */}
          {isManualEditing && (
            <button
              onClick={handleEditClick}
              className="flex-shrink-0 p-2 rounded-lg transition-colors hover:bg-yellow-500/20"
              style={{ color: '#f59e0b' }}
              title="Edit milestone notes"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div
          className="px-4 pb-4 pt-2 space-y-4"
          style={{ borderTop: `1px solid ${colors.cardBorder}` }}
        >
          {/* Skills */}
          {milestone.skills_to_develop.length > 0 && (
            <div>
              <div className="text-xs font-medium mb-2" style={{ color: colors.textMuted }}>
                Skills to Develop
              </div>
              <div className="flex flex-wrap gap-2">
                {milestone.skills_to_develop.map((skill, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      color: colors.textSecondary,
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          {milestone.resources.length > 0 && (
            <div>
              <div className="text-xs font-medium mb-2" style={{ color: colors.textMuted }}>
                Resources & Actions
              </div>
              <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                {milestone.resources.map((res, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span style={{ color: colors.accent }}>-</span>
                    <span>{res}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Indicators */}
          {milestone.success_indicators.length > 0 && (
            <div>
              <div className="text-xs font-medium mb-2" style={{ color: colors.textMuted }}>
                Success Indicators
              </div>
              <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                {milestone.success_indicators.map((ind, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span style={{ color: '#22c55e' }}>OK</span>
                    <span>{ind}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {progress?.notes && (
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: isDark ? 'rgba(255,230,0,0.1)' : 'rgba(255,230,0,0.15)' }}
            >
              <div className="text-xs font-medium mb-1" style={{ color: colors.textMuted }}>
                Your Notes
              </div>
              <p className="text-sm" style={{ color: colors.textPrimary }}>
                {progress.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div
            className="relative w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: isDark ? '#1a1a1f' : '#fff',
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                Edit Milestone
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg hover:bg-gray-500/10"
                style={{ color: colors.textMuted }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Warning Banner */}
            <div
              className="mb-4 p-3 rounded-lg flex items-start gap-2"
              style={{ backgroundColor: '#f59e0b20', border: '1px solid #f59e0b40' }}
            >
              <span style={{ color: '#f59e0b' }}>!</span>
              <p className="text-xs" style={{ color: '#f59e0b' }}>
                Manual edits may deviate from AI-recommended career paths. Changes are tracked for reference.
              </p>
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  color: colors.textPrimary,
                  border: `1px solid ${colors.cardBorder}`,
                }}
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-lg text-sm resize-none"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  color: colors.textPrimary,
                  border: `1px solid ${colors.cardBorder}`,
                }}
              />
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                Your Notes
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add personal notes, progress updates, or reminders..."
                rows={3}
                className="w-full p-3 rounded-lg text-sm resize-none"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  color: colors.textPrimary,
                  border: `1px solid ${colors.cardBorder}`,
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isSaving}
                className="flex-1 py-3 rounded-lg font-medium"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  color: colors.textPrimary,
                  opacity: isSaving ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 rounded-lg font-medium"
                style={{
                  backgroundColor: colors.accent,
                  color: '#2e2e38',
                  opacity: isSaving ? 0.5 : 1,
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            <p className="text-xs mt-3 text-center" style={{ color: colors.textMuted }}>
              Note: Title and description changes require full roadmap regeneration. Notes are saved immediately.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
