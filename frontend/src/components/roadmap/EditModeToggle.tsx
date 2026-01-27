/**
 * EditModeToggle - Switch between view/AI/manual edit modes
 *
 * Features:
 * - Three mode options with descriptions
 * - Warning for manual edit mode
 * - AI edit panel when in AI edit mode
 */

import { useState } from 'react';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { useRoadmap } from '../../hooks/useRoadmap';
import { EditMode } from '../../context/RoadmapContext';

interface EditModeToggleProps {
  onClose?: () => void;
}

export default function EditModeToggle({ onClose }: EditModeToggleProps) {
  const { theme, isDark, isGame } = useTheme();
  const colors = themeColors[theme];

  const {
    editMode,
    setEditMode,
    hasManualEdits,
    requestAIEdit,
    aiEditLoading,
    pendingAIEdit,
    applyPendingAIEdit,
    cancelPendingAIEdit,
    isSaving,
  } = useRoadmap();

  const [showManualWarning, setShowManualWarning] = useState(false);
  const [aiInstructions, setAiInstructions] = useState('');

  const modes: { value: EditMode; label: string; description: string; color: string }[] = [
    {
      value: 'view',
      label: 'View Mode',
      description: 'Read-only view of your roadmap',
      color: colors.textMuted,
    },
    {
      value: 'ai_edit',
      label: 'AI-Assisted Edit',
      description: 'Let AI help modify your roadmap while maintaining integrity',
      color: '#3b82f6',
    },
    {
      value: 'manual_edit',
      label: 'Manual Edit',
      description: 'Make custom changes (with warning)',
      color: '#f59e0b',
    },
  ];

  const handleModeChange = (mode: EditMode) => {
    if (mode === 'manual_edit' && editMode !== 'manual_edit') {
      setShowManualWarning(true);
    } else if (mode === 'view') {
      setEditMode(mode);
      onClose?.();
    } else {
      setEditMode(mode);
    }
  };

  const confirmManualEdit = () => {
    setShowManualWarning(false);
    setEditMode('manual_edit');
    onClose?.(); // Auto-close modal after confirming
  };

  const handleDone = () => {
    setEditMode('view');
    onClose?.();
  };

  const handleAIEditSubmit = () => {
    if (!aiInstructions.trim()) return;
    requestAIEdit(aiInstructions);
  };

  const suggestedEdits = [
    { label: 'Compress timeline', instruction: 'Compress the roadmap timeline to be 3 months shorter while keeping critical milestones' },
    { label: 'Focus on technical', instruction: 'Adjust the roadmap to focus more on technical skills and certifications' },
    { label: 'Front-load critical', instruction: 'Move the most critical milestones to earlier phases' },
    { label: 'Add more detail', instruction: 'Break down the current phases into more granular steps' },
  ];

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: colors.textMuted }}>
          Edit Mode
        </h3>
        <div className="flex gap-2">
          {modes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => handleModeChange(mode.value)}
              className="flex-1 p-3 rounded-lg text-left transition-all"
              style={{
                backgroundColor:
                  editMode === mode.value
                    ? `${mode.color}20`
                    : isDark
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(0,0,0,0.02)',
                border: editMode === mode.value ? `2px solid ${mode.color}` : '2px solid transparent',
              }}
            >
              <div className="text-sm font-medium" style={{ color: mode.color }}>
                {mode.label}
              </div>
              <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                {mode.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* AI Edit Panel */}
      {editMode === 'ai_edit' && (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: (isDark || isGame) ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#3b82f6' }}>
            AI-Assisted Edit
          </h3>

          {!pendingAIEdit ? (
            <>
              <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                Describe what changes you'd like to make. The AI will modify your roadmap while maintaining its integrity.
              </p>

              {/* Suggested Edits */}
              <div className="flex flex-wrap gap-2 mb-3">
                {suggestedEdits.map((edit, i) => (
                  <button
                    key={i}
                    onClick={() => setAiInstructions(edit.instruction)}
                    className="text-xs px-3 py-1.5 rounded-full transition-colors hover:bg-blue-500/20"
                    style={{
                      backgroundColor: (isDark || isGame) ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                    }}
                  >
                    {edit.label}
                  </button>
                ))}
              </div>

              <textarea
                value={aiInstructions}
                onChange={(e) => setAiInstructions(e.target.value)}
                placeholder="e.g., 'Compress the timeline to 12 months' or 'Focus more on technical certifications'"
                rows={3}
                className="w-full px-4 py-3 rounded-lg text-sm resize-none mb-3"
                style={{
                  backgroundColor: (isDark || isGame) ? 'rgba(255,255,255,0.05)' : '#fff',
                  color: colors.textPrimary,
                  border: `1px solid ${colors.cardBorder}`,
                }}
              />

              <button
                onClick={handleAIEditSubmit}
                disabled={!aiInstructions.trim() || aiEditLoading}
                className="w-full py-3 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  opacity: !aiInstructions.trim() || aiEditLoading ? 0.5 : 1,
                }}
              >
                {aiEditLoading ? 'Generating changes...' : 'Generate AI Edit'}
              </button>
            </>
          ) : (
            <>
              <div className="mb-4">
                <h4 className="font-medium mb-2" style={{ color: colors.textPrimary }}>
                  Proposed Changes
                </h4>
                <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                  {pendingAIEdit.summary}
                </p>
                {pendingAIEdit.changes && pendingAIEdit.changes.length > 0 ? (
                  <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                    {pendingAIEdit.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span style={{ color: '#3b82f6' }}>-</span>
                        <span>{change.description}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    No specific changes listed.
                  </p>
                )}
              </div>

              {/* Validate preview before allowing apply */}
              {pendingAIEdit.preview && pendingAIEdit.preview.phases ? (
                <div className="flex gap-3">
                  <button
                    onClick={cancelPendingAIEdit}
                    className="flex-1 py-3 rounded-lg font-medium"
                    style={{
                      backgroundColor: (isDark || isGame) ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      color: colors.textPrimary,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      await applyPendingAIEdit();
                      onClose?.();
                    }}
                    disabled={isSaving}
                    className="flex-1 py-3 rounded-lg font-medium"
                    style={{
                      backgroundColor: '#22c55e',
                      color: 'white',
                      opacity: isSaving ? 0.5 : 1,
                    }}
                  >
                    {isSaving ? 'Applying...' : 'Apply Changes'}
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: '#dc262620', border: '1px solid #dc262640' }}>
                  <p className="text-sm" style={{ color: '#dc2626' }}>
                    Unable to generate valid changes. Please try a different instruction.
                  </p>
                </div>
              )}
              {!pendingAIEdit.preview?.phases && (
                <button
                  onClick={cancelPendingAIEdit}
                  className="w-full py-3 rounded-lg font-medium"
                  style={{
                    backgroundColor: (isDark || isGame) ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    color: colors.textPrimary,
                  }}
                >
                  Try Again
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Manual Edit Warning */}
      {editMode === 'manual_edit' && (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: (isDark || isGame) ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        >
          <div className="flex items-start gap-3">
            <span style={{ color: '#f59e0b' }} className="text-xl">!</span>
            <div>
              <h4 className="font-medium" style={{ color: '#f59e0b' }}>
                Manual Edit Mode Active
              </h4>
              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                Changes you make will be marked as manual edits. Click on milestones to edit them directly.
                Manual changes may deviate from AI-recommended career paths.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Done Button (when in edit mode) */}
      {editMode !== 'view' && (
        <button
          onClick={handleDone}
          className="w-full mt-4 py-3 rounded-lg font-medium transition-all"
          style={{
            backgroundColor: colors.accent,
            color: '#2e2e38',
          }}
        >
          Done Editing
        </button>
      )}

      {/* Manual Warning Modal */}
      {showManualWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowManualWarning(false)} />
          <div
            className="relative w-full max-w-md rounded-2xl p-6"
            style={{
              backgroundColor: (isDark || isGame) ? '#1a1a1f' : '#fff',
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl" style={{ color: '#f59e0b' }}>!</span>
              <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                Enter Manual Edit Mode?
              </h2>
            </div>

            <p className="mb-4" style={{ color: colors.textSecondary }}>
              Manual editing allows you to make custom changes to your roadmap. However:
            </p>

            <ul className="mb-6 space-y-2 text-sm" style={{ color: colors.textSecondary }}>
              <li className="flex items-start gap-2">
                <span style={{ color: '#f59e0b' }}>-</span>
                <span>Changes may deviate from skills needed for your target roles</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#f59e0b' }}>-</span>
                <span>Modified elements will be visually marked as manually edited</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#f59e0b' }}>-</span>
                <span>You take ownership for outcomes from manual changes</span>
              </li>
            </ul>

            <div className="flex gap-3">
              <button
                onClick={() => setShowManualWarning(false)}
                className="flex-1 py-3 rounded-lg font-medium"
                style={{
                  backgroundColor: (isDark || isGame) ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  color: colors.textPrimary,
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmManualEdit}
                className="flex-1 py-3 rounded-lg font-medium"
                style={{ backgroundColor: '#f59e0b', color: 'white' }}
              >
                I Understand, Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
