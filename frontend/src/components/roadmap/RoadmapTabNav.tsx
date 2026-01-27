/**
 * RoadmapTabNav - Horizontal tab navigation for roadmap sections
 *
 * Tabs:
 * - Overview (always first)
 * - Insights (always second)
 * - Phase tabs (dynamic, one per phase)
 *
 * Features:
 * - Visual indicators for completed phases
 * - Edit mode indicator badge
 * - Smooth scrolling for many phases
 */

import { useTheme, themeColors } from '../../context/ThemeContext';
import { useRoadmap } from '../../hooks/useRoadmap';
import { TabId } from '../../context/RoadmapContext';

export default function RoadmapTabNav() {
  const { isDark } = useTheme();
  const colors = isDark ? themeColors.dark : themeColors.light;

  const { tabs, activeTab, setActiveTab, editMode, hasManualEdits } = useRoadmap();

  const getTabStyle = (tabId: TabId, isActive: boolean) => {
    if (isActive) {
      return {
        backgroundColor: colors.accent,
        color: '#2e2e38',
        borderColor: colors.accent,
      };
    }
    return {
      backgroundColor: 'transparent',
      color: colors.textSecondary,
      borderColor: 'transparent',
    };
  };

  return (
    <div
      className="px-6 py-3 flex items-center gap-2 overflow-x-auto"
      style={{
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
        borderBottom: `1px solid ${colors.cardBorder}`,
      }}
    >
      {/* Edit Mode Badge */}
      {editMode !== 'view' && (
        <div
          className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium mr-2"
          style={{
            backgroundColor: editMode === 'ai_edit' ? '#3b82f620' : '#f59e0b20',
            color: editMode === 'ai_edit' ? '#3b82f6' : '#f59e0b',
          }}
        >
          {editMode === 'ai_edit' ? 'AI Edit Mode' : 'Manual Edit Mode'}
        </div>
      )}

      {/* Manual Edits Warning */}
      {hasManualEdits && editMode === 'view' && (
        <div
          className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium mr-2"
          style={{
            backgroundColor: '#f59e0b20',
            color: '#f59e0b',
          }}
          title="This roadmap has been manually edited"
        >
          Modified
        </div>
      )}

      {/* Tabs */}
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const style = getTabStyle(tab.id, isActive);

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all border-2"
            style={style}
          >
            <div className="flex items-center gap-2">
              <span>{tab.label}</span>
              {tab.isPhaseTab && tab.progress && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: isActive ? 'rgba(0,0,0,0.2)' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                  }}
                >
                  {tab.progress.completed}/{tab.progress.total}
                </span>
              )}
              {tab.isPhaseTab && tab.progress && tab.progress.percentage === 100 && (
                <span className="text-green-500">OK</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
