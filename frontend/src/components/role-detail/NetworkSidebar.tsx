import { useState } from 'react'
import { useTheme, themeColors } from '../../context/ThemeContext'
import type { SkillNodeData } from '../career-viz/SkillNode'

interface NetworkSidebarProps {
  paths: Array<{ name: string; emoji: string; progress: number; type: string; nodeId: string }>
  selectedPath: string | null
  onPathSelect: (pathName: string | null) => void
  selectedNode: { id: string; data: SkillNodeData } | null
  onNodeDeselect: () => void
}

export function NetworkSidebar({
  paths,
  selectedPath,
  onPathSelect,
  selectedNode,
  onNodeDeselect,
}: NetworkSidebarProps) {
  const { isDark } = useTheme()
  const colors = isDark ? themeColors.dark : themeColors.light

  return (
    <div
      className="network-sidebar"
      style={{
        padding: '32px',
        borderRight: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : colors.cardBorder}`,
      }}
    >
      <div
        className="network-sidebar-title"
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: isDark ? 'rgba(255, 255, 255, 0.45)' : colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '20px',
        }}
      >
        Career Paths
      </div>

      {paths.map((path) => (
        <div
          key={path.nodeId}
          className={`path-item ${selectedPath === path.name ? 'active' : ''}`}
          onClick={() => onPathSelect(selectedPath === path.name ? null : path.name)}
          style={{
            padding: '16px',
            background: selectedPath === path.name
              ? (isDark ? 'rgba(255, 230, 0, 0.1)' : 'rgba(255, 230, 0, 0.15)')
              : (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'),
            borderRadius: '10px',
            marginBottom: '12px',
            borderLeft: `3px solid ${selectedPath === path.name ? colors.accent : (isDark ? 'rgba(255, 255, 255, 0.1)' : colors.cardBorder)}`,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (selectedPath !== path.name) {
              e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'
            }
          }}
          onMouseLeave={(e) => {
            if (selectedPath !== path.name) {
              e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'
            }
          }}
        >
          <div
            className="path-name"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: colors.textPrimary,
              marginBottom: '12px',
            }}
          >
            {path.emoji} {path.name}
          </div>
          <div
            className="path-progress-bar"
            style={{
              height: '4px',
              background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
              marginBottom: '8px',
            }}
          >
            <div
              className="path-progress-fill"
              style={{
                height: '100%',
                background: colors.accent,
                borderRadius: '2px',
                width: `${path.progress}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div
            className="path-stats"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: isDark ? 'rgba(255, 255, 255, 0.45)' : colors.textMuted,
            }}
          >
            <span>{Math.round(path.progress)}% complete</span>
            <span>{path.type}</span>
          </div>
        </div>
      ))}

      {/* Path Filter Indicator */}
      {selectedPath && (
        <div
          className="path-filter-indicator active"
          style={{
            marginTop: '20px',
            padding: '12px 16px',
            background: isDark ? 'rgba(255, 230, 0, 0.08)' : 'rgba(255, 230, 0, 0.12)',
            border: `1px solid ${isDark ? 'rgba(255, 230, 0, 0.2)' : 'rgba(255, 230, 0, 0.3)'}`,
            borderRadius: '10px',
          }}
        >
          <div
            className="filter-indicator-text"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <span
              id="filterPathName"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: colors.accent,
              }}
            >
              {selectedPath}
            </span>
            <span
              id="filterSkillCount"
              style={{
                fontSize: '12px',
                color: isDark ? 'rgba(255, 255, 255, 0.45)' : colors.textMuted,
              }}
            >
              Filtered
            </span>
          </div>
          <button
            className="filter-clear-btn"
            onClick={() => onPathSelect(null)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'transparent',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : colors.cardBorder}`,
              borderRadius: '6px',
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : colors.textMuted,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
              e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.3)' : colors.cardHoverBorder
              e.currentTarget.style.color = colors.textPrimary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : colors.cardBorder
              e.currentTarget.style.color = isDark ? 'rgba(255, 255, 255, 0.6)' : colors.textMuted
            }}
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Skill Detail Panel */}
      {selectedNode && (
        <div
          className="network-detail-panel"
          style={{
            marginTop: '24px',
            background: isDark ? 'rgba(255, 255, 255, 0.03)' : colors.cardBg,
            borderRadius: '12px',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : colors.cardBorder}`,
            overflow: 'hidden',
          }}
        >
          <div
            className="detail-panel-header"
            style={{
              padding: '12px 16px',
              background: isDark ? 'rgba(255, 230, 0, 0.1)' : 'rgba(255, 230, 0, 0.15)',
              borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : colors.cardBorder}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              className="detail-panel-title"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: colors.accent,
              }}
            >
              {selectedNode.data.label}
            </span>
            <span
              className="detail-panel-close"
              onClick={onNodeDeselect}
              style={{
                fontSize: '16px',
                color: isDark ? 'rgba(255, 255, 255, 0.45)' : colors.textMuted,
                cursor: 'pointer',
                lineHeight: '1',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.textPrimary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isDark ? 'rgba(255, 255, 255, 0.45)' : colors.textMuted
              }}
            >
              ×
            </span>
          </div>
          <div
            className="detail-panel-body"
            style={{
              padding: '16px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}
            >
              {selectedNode.data.kind === 'role' ? 'Target Role' : selectedNode.data.kind === 'path' ? 'Skill Category' : 'Skill'}
            </div>
            {selectedNode.data.kind === 'skill' && (
              <>
                {selectedNode.data.has && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#22c55e',
                      marginBottom: '8px',
                    }}
                  >
                    ✓ You have this skill
                  </div>
                )}
                {selectedNode.data.required && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: colors.accent,
                      marginBottom: '8px',
                    }}
                  >
                    Required skill
                  </div>
                )}
              </>
            )}
            <p
              className="detail-panel-hint"
              style={{
                fontSize: '12px',
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : colors.textMuted,
                lineHeight: '1.5',
                marginTop: '8px',
              }}
            >
              {selectedNode.data.kind === 'role'
                ? 'This is your target role. Work through the skill categories to reach this position.'
                : selectedNode.data.kind === 'path'
                  ? 'This category groups related skills needed for this role.'
                  : 'Click on this skill to view learning resources and track your progress.'}
            </p>
          </div>
        </div>
      )}

      {!selectedNode && (
        <div
          className="network-detail-panel"
          style={{
            marginTop: '24px',
            background: isDark ? 'rgba(255, 255, 255, 0.03)' : colors.cardBg,
            borderRadius: '12px',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : colors.cardBorder}`,
            overflow: 'hidden',
          }}
        >
          <div
            className="detail-panel-header"
            style={{
              padding: '12px 16px',
              background: isDark ? 'rgba(255, 230, 0, 0.1)' : 'rgba(255, 230, 0, 0.15)',
              borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : colors.cardBorder}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              className="detail-panel-title"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: colors.accent,
              }}
            >
              Hover over a skill
            </span>
          </div>
          <div
            className="detail-panel-body"
            style={{
              padding: '16px',
            }}
          >
            <p
              className="detail-panel-hint"
              style={{
                fontSize: '12px',
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : colors.textMuted,
                lineHeight: '1.5',
              }}
            >
              Hover over any node in the network to see skill details, progress, and next steps.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

