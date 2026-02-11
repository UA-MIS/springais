import { useState } from 'react'
import type { SkillNodeData } from '../career-viz/SkillNode'
import { useTheme, themeColors } from '../../context/ThemeContext'

interface NetworkSidebarProps {
  paths: Array<{ name: string; emoji: string; progress: number; type: string; nodeId: string }>
  selectedPath: string | null
  onPathSelect: (pathName: string | null) => void
  selectedNode: { id: string; data: SkillNodeData } | null
  onNodeDeselect: () => void
  masteredCount?: number
  totalCount?: number
}

const CATEGORY_COLORS: Record<string, string> = {
  Technical: '#06b6d4',
  Leadership: '#eab308',
  Domain: '#c026d3',
  Tools: '#22c55e',
}

export function NetworkSidebar({
  paths,
  selectedPath,
  onPathSelect,
  selectedNode,
  onNodeDeselect,
  masteredCount = 0,
  totalCount = 0,
}: NetworkSidebarProps) {
  const [hoveredPath, setHoveredPath] = useState<string | null>(null)
  const { theme, isDark } = useTheme()
  const colors = themeColors[theme]
  const progressPercent = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0

  // Theme-aware sidebar colors
  const sidebarBg = isDark
    ? 'rgba(5, 5, 10, 0.6)'
    : theme === 'game'
      ? 'rgba(30, 25, 20, 0.6)'
      : 'rgba(248, 250, 252, 0.8)'
  const sidebarBorder = isDark
    ? '1px solid rgba(255, 255, 255, 0.06)'
    : theme === 'game'
      ? `1px solid ${colors.border}`
      : `1px solid ${colors.border}`
  const sectionLabel = isDark
    ? 'rgba(255, 255, 255, 0.35)'
    : colors.textMuted
  const textMain = colors.textPrimary
  const textSub = colors.textSecondary
  const textMuted = colors.textMuted
  const cardBg = isDark
    ? 'rgba(255, 255, 255, 0.015)'
    : theme === 'game'
      ? 'rgba(255, 255, 255, 0.03)'
      : 'rgba(0, 0, 0, 0.02)'
  const cardHoverBg = isDark
    ? 'rgba(255, 255, 255, 0.04)'
    : theme === 'game'
      ? 'rgba(255, 255, 255, 0.06)'
      : 'rgba(0, 0, 0, 0.04)'
  const progressTrackBg = isDark
    ? 'rgba(255, 255, 255, 0.06)'
    : theme === 'game'
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.06)'
  const borderSide = isDark
    ? 'rgba(255, 255, 255, 0.06)'
    : theme === 'game'
      ? colors.border
      : colors.border
  const progressRingTrack = isDark ? 'rgba(255,255,255,0.06)' : theme === 'game' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const panelBg = isDark
    ? 'rgba(255, 255, 255, 0.02)'
    : theme === 'game'
      ? 'rgba(255, 255, 255, 0.04)'
      : 'rgba(0, 0, 0, 0.02)'
  const panelBorder = isDark
    ? '1px solid rgba(255, 255, 255, 0.08)'
    : theme === 'game'
      ? `1px solid ${colors.border}`
      : `1px solid ${colors.border}`

  return (
    <div
      style={{
        padding: '24px',
        borderRight: sidebarBorder,
        background: sidebarBg,
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* Overall Progress */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          color: sectionLabel,
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          marginBottom: '16px',
        }}>
          Skill Mastery
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '12px',
        }}>
          {/* Mini progress ring */}
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="22" fill="none" stroke={progressRingTrack} strokeWidth="4" />
            <circle
              cx="26" cy="26" r="22"
              fill="none"
              stroke="#FFE600"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - progressPercent / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 26 26)"
              style={{ transition: 'stroke-dashoffset 0.7s ease' }}
            />
            <text x="26" y="26" textAnchor="middle" dominantBaseline="central"
              fill="#FFE600" fontSize="12" fontWeight="700"
            >
              {progressPercent}%
            </text>
          </svg>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: textMain }}>
              {masteredCount} / {totalCount}
            </div>
            <div style={{ fontSize: '11px', color: textMuted }}>
              skills mastered
            </div>
          </div>
        </div>
      </div>

      {/* Category Paths */}
      <div style={{
        fontSize: '10px',
        fontWeight: 700,
        color: sectionLabel,
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        marginBottom: '14px',
      }}>
        Skill Clusters
      </div>

      {paths.map((path) => {
        const isActive = selectedPath === path.name
        const isHovered = hoveredPath === path.name
        const catColor = CATEGORY_COLORS[path.name] || '#a78bfa'

        return (
          <div
            key={path.nodeId}
            onClick={() => onPathSelect(isActive ? null : path.name)}
            onMouseEnter={() => setHoveredPath(path.name)}
            onMouseLeave={() => setHoveredPath(null)}
            style={{
              padding: '14px 16px',
              background: isActive
                ? `${catColor}12`
                : isHovered
                  ? cardHoverBg
                  : cardBg,
              borderRadius: '8px',
              marginBottom: '8px',
              borderLeft: `3px solid ${isActive ? catColor : borderSide}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: isActive ? catColor : textSub,
                transition: 'color 0.2s',
              }}>
                {path.name}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: catColor,
                opacity: isActive ? 1 : 0.6,
                transition: 'opacity 0.2s',
              }}>
                {Math.round(path.progress)}%
              </span>
            </div>
            {/* Progress bar */}
            <div style={{
              height: '3px',
              background: progressTrackBg,
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                background: catColor,
                borderRadius: '2px',
                width: `${path.progress}%`,
                transition: 'width 0.5s ease',
                boxShadow: `0 0 6px ${catColor}40`,
              }} />
            </div>
          </div>
        )
      })}

      {/* Active Filter */}
      {selectedPath && (
        <div style={{
          marginTop: '16px',
          padding: '10px 14px',
          background: 'rgba(255, 230, 0, 0.05)',
          border: '1px solid rgba(255, 230, 0, 0.15)',
          borderRadius: '8px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: CATEGORY_COLORS[selectedPath] || '#FFE600',
            }}>
              {selectedPath}
            </span>
            <span style={{
              fontSize: '10px',
              color: textMuted,
            }}>
              filtered
            </span>
          </div>
          <button
            onClick={() => onPathSelect(null)}
            style={{
              width: '100%',
              padding: '6px 10px',
              background: 'transparent',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : colors.border}`,
              borderRadius: '5px',
              color: textMuted,
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = cardHoverBg
              e.currentTarget.style.color = textMain
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = textMuted
            }}
          >
            Show All
          </button>
        </div>
      )}

      {/* Skill Detail Panel */}
      {selectedNode && (
        <div style={{
          marginTop: '24px',
          background: panelBg,
          borderRadius: '10px',
          border: panelBorder,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 14px',
            background: selectedNode.data.has
              ? `${CATEGORY_COLORS[selectedNode.data.category || ''] || '#FFE600'}10`
              : (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'),
            borderBottom: panelBorder,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: CATEGORY_COLORS[selectedNode.data.category || ''] || '#FFE600',
            }}>
              {selectedNode.data.label}
            </span>
            <span
              onClick={onNodeDeselect}
              style={{
                fontSize: '14px',
                color: textMuted,
                cursor: 'pointer',
                lineHeight: '1',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = textMain }}
              onMouseLeave={(e) => { e.currentTarget.style.color = textMuted }}
            >
              x
            </span>
          </div>
          <div style={{ padding: '14px' }}>
            <div style={{
              fontSize: '10px',
              color: textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px',
            }}>
              {selectedNode.data.kind === 'role'
                ? 'Your Position'
                : selectedNode.data.kind === 'target'
                  ? 'Target Role'
                  : selectedNode.data.kind === 'path'
                    ? 'Skill Cluster'
                    : 'Skill Node'}
            </div>
            {selectedNode.data.kind === 'skill' && (
              <>
                {selectedNode.data.has && !selectedNode.data.transferable && (
                  <div style={{
                    display: 'inline-block',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#22c55e',
                    padding: '3px 8px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    borderRadius: '4px',
                    marginBottom: '8px',
                  }}>
                    MASTERED
                  </div>
                )}
                {selectedNode.data.transferable && (
                  <div style={{
                    display: 'inline-block',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#a78bfa',
                    padding: '3px 8px',
                    background: 'rgba(167, 139, 250, 0.1)',
                    border: '1px solid rgba(167, 139, 250, 0.2)',
                    borderRadius: '4px',
                    marginBottom: '8px',
                  }}>
                    TRANSFERABLE
                  </div>
                )}
                {!selectedNode.data.has && selectedNode.data.required && (
                  <div style={{
                    display: 'inline-block',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#f59e0b',
                    padding: '3px 8px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    borderRadius: '4px',
                    marginBottom: '8px',
                  }}>
                    SKILL GAP
                  </div>
                )}
                {!selectedNode.data.has && !selectedNode.data.required && (
                  <div style={{
                    display: 'inline-block',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: textMuted,
                    padding: '3px 8px',
                    background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border}`,
                    borderRadius: '4px',
                    marginBottom: '8px',
                  }}>
                    LOCKED
                  </div>
                )}
              </>
            )}
            <p style={{
              fontSize: '11px',
              color: textMuted,
              lineHeight: '1.6',
              marginTop: '8px',
            }}>
              {selectedNode.data.kind === 'role'
                ? 'You are here. Work through skill clusters to progress toward your target role.'
                : selectedNode.data.kind === 'target'
                  ? 'Your destination role. Complete the skill paths to reach this position.'
                  : selectedNode.data.kind === 'path'
                    ? `This cluster groups ${selectedNode.data.label.toLowerCase()} skills needed for this role.`
                    : selectedNode.data.has
                      ? selectedNode.data.transferable
                        ? 'This skill transfers from your existing experience. It strengthens your path to the target role.'
                        : 'You have demonstrated this skill. It strengthens your path to the target role.'
                      : selectedNode.data.required
                        ? 'This is a skill gap. Developing it will strengthen your candidacy.'
                        : 'This skill is not yet available. Complete prerequisite skills to unlock it.'}
            </p>
          </div>
        </div>
      )}

      {/* Legend */}
      {!selectedNode && (
        <div style={{
          marginTop: '24px',
          padding: '14px',
          background: panelBg,
          borderRadius: '10px',
          border: panelBorder,
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 700,
            color: sectionLabel,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '12px',
          }}>
            Legend
          </div>
          {[
            { label: 'Mastered', color: '#22c55e', desc: 'Bright, glowing' },
            { label: 'Transferable', color: '#a78bfa', desc: 'Purple glow' },
            { label: 'Available', color: '#f59e0b', desc: 'Dim, pulsing' },
            { label: 'Locked', color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', desc: 'Dark outline' },
          ].map((item) => (
            <div key={item.label} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '8px',
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: item.color,
                boxShadow: item.label === 'Mastered' || item.label === 'Transferable' ? `0 0 6px ${item.color}` : 'none',
              }} />
              <div>
                <span style={{ fontSize: '11px', color: textSub, fontWeight: 500 }}>
                  {item.label}
                </span>
                <span style={{ fontSize: '10px', color: textMuted, marginLeft: '6px' }}>
                  {item.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
