/**
 * RoadmapViewer - Main container for the tabular roadmap view
 *
 * Structure:
 * - Header with back button, title, and edit button
 * - Global Progress Bar (sticky top)
 * - Tab Navigation
 * - Tab Content Area
 * - Chat Panel (always visible, togglable)
 */

import { useEffect, useState } from 'react';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { useRoadmap } from '../../hooks/useRoadmap';
import GlobalProgressBar from './GlobalProgressBar';
import RoadmapTabNav from './RoadmapTabNav';
import OverviewTab from './OverviewTab';
import InsightsTab from './InsightsTab';
import PhaseTab from './PhaseTab';
import EditModeToggle from './EditModeToggle';
import RoadmapAssistant from './RoadmapAssistant';

interface RoadmapViewerProps {
  roadmapId: string;
  onBack: () => void;
}

export default function RoadmapViewer({ roadmapId, onBack }: RoadmapViewerProps) {
  const { theme, isDark, isGame } = useTheme();
  const colors = themeColors[theme];

  const [showEditModal, setShowEditModal] = useState(false);

  const {
    loadRoadmap,
    clearState,
    roadmap,
    isLoading,
    error,
    activeTab,
    editMode,
    chatVisible,
    title,
  } = useRoadmap();

  // Load roadmap on mount
  useEffect(() => {
    loadRoadmap(roadmapId);
    return () => clearState();
  }, [roadmapId, loadRoadmap, clearState]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mb-4 mx-auto"
            style={{ borderColor: colors.accent, borderTopColor: 'transparent' }}
          />
          <p style={{ color: colors.textMuted }}>Loading your roadmap...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl mb-4">!</div>
          <p className="text-lg mb-2" style={{ color: colors.textPrimary }}>
            Failed to load roadmap
          </p>
          <p className="mb-4" style={{ color: colors.textMuted }}>{error}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg font-medium"
            style={{ backgroundColor: colors.accent, color: '#2e2e38' }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // No roadmap loaded
  if (!roadmap) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 flex items-start justify-between">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              color: colors.textPrimary,
            }}
          >
            <span>&lt;-</span>
            <span>Back to Roadmaps</span>
          </button>

          {/* Title */}
          <h1 className="text-2xl font-bold mt-4" style={{ color: colors.textPrimary }}>
            {title}
          </h1>
        </div>

        {/* Edit Roadmap Button - Top Right */}
        <button
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: editMode !== 'view' ? '#f59e0b20' : ((isDark || isGame) ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
            color: editMode !== 'view' ? '#f59e0b' : colors.textMuted,
            border: editMode !== 'view' ? '1px solid #f59e0b40' : `1px solid ${colors.cardBorder}`,
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span>{editMode !== 'view' ? 'Editing' : 'Edit Roadmap'}</span>
        </button>
      </div>

      {/* Global Progress Bar */}
      <GlobalProgressBar />

      {/* Tab Navigation */}
      <RoadmapTabNav />

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'insights' && <InsightsTab />}
        {activeTab.startsWith('phase-') && <PhaseTab />}
      </div>

      {/* Chat Assistant - Always available, togglable */}
      <RoadmapAssistant visible={chatVisible} />

      {/* Edit Mode Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          />
          <div
            className="relative w-full max-w-lg rounded-2xl p-6"
            style={{
              backgroundColor: (isDark || isGame) ? '#1a1a1f' : '#fff',
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                Edit Roadmap
              </h2>
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

            <EditModeToggle onClose={() => setShowEditModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
