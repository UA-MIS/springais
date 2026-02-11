import { memo, useState } from 'react'
import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'
import { useTheme, themeColors } from '../../context/ThemeContext'

export type SkillNodeData = {
  label: string
  kind: 'role' | 'path' | 'skill' | 'target'
  category?: 'Technical' | 'Leadership' | 'Domain' | 'Tools'
  emphasis?: 'goal'
  has?: boolean
  transferable?: boolean
  required?: boolean
  progress?: number
  isCustomizing?: boolean
  description?: string
  priority?: number // 1-5, affects size
}

// Category color scheme
const CATEGORY_COLORS: Record<string, { primary: string; glow: string; dim: string }> = {
  Technical: { primary: '#06b6d4', glow: 'rgba(6, 182, 212, 0.6)', dim: 'rgba(6, 182, 212, 0.15)' },
  Leadership: { primary: '#eab308', glow: 'rgba(234, 179, 8, 0.6)', dim: 'rgba(234, 179, 8, 0.15)' },
  Domain: { primary: '#c026d3', glow: 'rgba(192, 38, 211, 0.6)', dim: 'rgba(192, 38, 211, 0.15)' },
  Tools: { primary: '#22c55e', glow: 'rgba(34, 197, 94, 0.6)', dim: 'rgba(34, 197, 94, 0.15)' },
}

const DEFAULT_COLOR = { primary: '#a78bfa', glow: 'rgba(167, 139, 250, 0.6)', dim: 'rgba(167, 139, 250, 0.15)' }

function getCategoryColor(category?: string) {
  if (!category) return DEFAULT_COLOR
  return CATEGORY_COLORS[category] || DEFAULT_COLOR
}

export const SkillNode = memo(function SkillNode({ data }: NodeProps<SkillNodeData>) {
  const [hovered, setHovered] = useState(false)
  const { theme, isDark } = useTheme()
  const colors = themeColors[theme]
  const wiggleStyle = data.isCustomizing
    ? { animation: 'nodeWiggle 0.9s ease-in-out infinite' }
    : {}

  const catColor = getCategoryColor(data.category)
  const hasSkill = data.kind === 'skill' && data.has
  const isTransferable = data.kind === 'skill' && data.transferable
  const isAvailable = data.kind === 'skill' && !data.has && data.required
  const isLocked = data.kind === 'skill' && !data.has && !data.required

  // Theme-aware tooltip background / text
  const tooltipBg = isDark
    ? 'rgba(10, 10, 15, 0.95)'
    : theme === 'game'
      ? 'rgba(40, 35, 30, 0.95)'
      : 'rgba(255, 255, 255, 0.95)'
  const tooltipText = colors.textPrimary
  const tooltipSubText = colors.textMuted
  const labelTextColor = isDark
    ? (hasSkill ? '#ffffff' : isAvailable ? colors.textSecondary : 'rgba(255, 255, 255, 0.45)')
    : theme === 'game'
      ? (hasSkill ? colors.textPrimary : isAvailable ? colors.textSecondary : colors.textMuted)
      : (hasSkill ? colors.textPrimary : isAvailable ? colors.textSecondary : colors.textMuted)

  // --- Central "YOU" node ---
  if (data.kind === 'role') {
    const youSize = 90
    return (
      <div
        style={{ cursor: data.isCustomizing ? 'grab' : 'pointer', ...wiggleStyle }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Handle type="target" position={Position.Top} style={{ background: 'transparent', border: 'none' }} className="!h-0 !w-0" />
        <svg width={youSize} height={youSize} viewBox={`0 0 ${youSize} ${youSize}`} style={{ overflow: 'visible' }}>
          <defs>
            <filter id="you-glow">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="you-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFE600" stopOpacity="1" />
              <stop offset="70%" stopColor="#e6cf00" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#b8a300" stopOpacity="0.4" />
            </radialGradient>
          </defs>
          {/* Outer pulse ring */}
          <circle
            r="44"
            cx={youSize / 2}
            cy={youSize / 2}
            fill="none"
            stroke="rgba(255, 230, 0, 0.2)"
            strokeWidth="2"
            style={{ animation: 'poe-pulse 3s ease-in-out infinite' }}
          />
          {/* Glow ring */}
          <circle
            r="38"
            cx={youSize / 2}
            cy={youSize / 2}
            fill="none"
            stroke="rgba(255, 230, 0, 0.35)"
            strokeWidth="6"
            filter="url(#you-glow)"
          />
          {/* Main circle */}
          <circle
            r="30"
            cx={youSize / 2}
            cy={youSize / 2}
            fill="url(#you-gradient)"
            stroke="#FFE600"
            strokeWidth="2.5"
          />
          {/* Inner highlight */}
          <circle
            r="18"
            cx={youSize / 2}
            cy={youSize / 2}
            fill="rgba(255, 255, 255, 0.15)"
          />
          <text
            x={youSize / 2}
            y={youSize / 2 + 5}
            fill="#1A1A24"
            textAnchor="middle"
            fontSize="13"
            fontWeight="800"
            fontFamily="Space Grotesk, sans-serif"
          >
            YOU
          </text>
        </svg>
        <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', border: 'none' }} className="!h-0 !w-0" />
      </div>
    )
  }

  // --- Target role node (star/diamond) ---
  if (data.kind === 'target') {
    const targetSize = 80
    return (
      <div
        style={{ cursor: 'pointer', ...wiggleStyle }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Handle type="target" position={Position.Top} style={{ background: 'transparent', border: 'none' }} className="!h-0 !w-0" />
        <svg width={targetSize} height={targetSize} viewBox={`0 0 ${targetSize} ${targetSize}`} style={{ overflow: 'visible' }}>
          <defs>
            <filter id="target-glow">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="target-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFE600" />
              <stop offset="50%" stopColor="#ffd700" />
              <stop offset="100%" stopColor="#e6cf00" />
            </linearGradient>
          </defs>
          {/* Diamond shape */}
          <polygon
            points={`${targetSize / 2},4 ${targetSize - 6},${targetSize / 2} ${targetSize / 2},${targetSize - 4} 6,${targetSize / 2}`}
            fill="url(#target-gradient)"
            stroke="#FFE600"
            strokeWidth="2"
            filter="url(#target-glow)"
            style={{
              opacity: hovered ? 1 : 0.9,
              transition: 'opacity 0.2s',
            }}
          />
          {/* Star icon in center */}
          <text
            x={targetSize / 2}
            y={targetSize / 2 + 1}
            fill="#1A1A24"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="18"
          >
            &#9733;
          </text>
        </svg>
        {/* Label below */}
        <div style={{
          textAlign: 'center',
          marginTop: '4px',
          fontSize: '10px',
          fontWeight: 700,
          color: '#FFE600',
          maxWidth: '100px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textShadow: '0 0 8px rgba(255, 230, 0, 0.5)',
        }}>
          {data.label}
        </div>
        <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', border: 'none' }} className="!h-0 !w-0" />
      </div>
    )
  }

  // --- Category hub nodes (path nodes) ---
  if (data.kind === 'path') {
    const hubSize = 70
    const color = catColor
    return (
      <div
        style={{ cursor: data.isCustomizing ? 'grab' : 'pointer', ...wiggleStyle }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Handle type="target" position={Position.Top} style={{ background: 'transparent', border: 'none' }} className="!h-0 !w-0" />
        <svg width={hubSize} height={hubSize} viewBox={`0 0 ${hubSize} ${hubSize}`} style={{ overflow: 'visible' }}>
          <defs>
            <filter id={`hub-glow-${data.label}`}>
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id={`hub-gradient-${data.label}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color.primary} stopOpacity={isDark ? 0.3 : theme === 'game' ? 0.3 : 0.15} />
              <stop offset="100%" stopColor={color.primary} stopOpacity={isDark ? 0.05 : theme === 'game' ? 0.05 : 0.03} />
            </radialGradient>
          </defs>
          {/* Outer glow */}
          <circle
            r="34"
            cx={hubSize / 2}
            cy={hubSize / 2}
            fill="none"
            stroke={color.primary}
            strokeWidth="1.5"
            strokeOpacity={hovered ? 0.6 : 0.25}
            filter={`url(#hub-glow-${data.label})`}
            style={{ transition: 'stroke-opacity 0.3s' }}
          />
          {/* Main circle */}
          <circle
            r="28"
            cx={hubSize / 2}
            cy={hubSize / 2}
            fill={`url(#hub-gradient-${data.label})`}
            stroke={color.primary}
            strokeWidth="2"
            strokeOpacity={hovered ? 0.8 : 0.5}
            style={{ transition: 'stroke-opacity 0.3s' }}
          />
          {/* Category icon */}
          <text
            x={hubSize / 2}
            y={hubSize / 2 + 5}
            fill={color.primary}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fontFamily="Space Grotesk, sans-serif"
          >
            {data.label.substring(0, 4).toUpperCase()}
          </text>
        </svg>
        {/* Label */}
        <div style={{
          textAlign: 'center',
          marginTop: '2px',
          fontSize: '10px',
          fontWeight: 600,
          color: color.primary,
          textShadow: isDark || theme === 'game' ? `0 0 6px ${color.dim}` : 'none',
          opacity: hovered ? 1 : 0.8,
          transition: 'opacity 0.3s',
        }}>
          {data.label}
        </div>
        <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', border: 'none' }} className="!h-0 !w-0" />
      </div>
    )
  }

  // --- Individual skill nodes ---
  const nodeSize = hasSkill ? 48 : isAvailable ? 44 : 38
  const color = catColor

  // Transferable skills use a purple tint
  const transferableColor = '#a78bfa'

  // Mastered: bright, fully lit
  // Transferable: purple tint, still bright
  // Available: dimmer but visible, pulsing subtly
  // Locked: dark/muted, barely visible outline
  const fillColor = hasSkill
    ? isTransferable ? `${transferableColor}` : color.primary
    : isAvailable
      ? (isDark ? `${color.primary}15` : `${color.primary}20`)
      : (isDark ? 'rgba(255, 255, 255, 0.03)' : theme === 'game' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)')

  const strokeColor = hasSkill
    ? isTransferable ? transferableColor : color.primary
    : isAvailable
      ? `${color.primary}80`
      : (isDark ? 'rgba(255, 255, 255, 0.12)' : theme === 'game' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)')

  const strokeW = hasSkill ? 2.5 : isAvailable ? 1.5 : 1
  const activeGlow = isTransferable ? `rgba(167, 139, 250, 0.6)` : color.glow

  const pulseAnimation = isAvailable && !hovered
    ? { animation: 'poe-pulse-subtle 4s ease-in-out infinite' }
    : {}

  return (
    <div
      style={{
        cursor: data.isCustomizing ? 'grab' : 'pointer',
        ...wiggleStyle,
        ...pulseAnimation,
        transition: 'transform 0.2s, filter 0.2s',
        transform: hovered ? 'scale(1.15)' : 'scale(1)',
        filter: hovered && hasSkill ? `drop-shadow(0 0 8px ${activeGlow})` : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle type="target" position={Position.Top} style={{ background: 'transparent', border: 'none' }} className="!h-0 !w-0" />
      <svg width={nodeSize} height={nodeSize} viewBox={`0 0 ${nodeSize} ${nodeSize}`} style={{ overflow: 'visible' }}>
        <defs>
          {hasSkill && (
            <filter id={`skill-glow-${data.label.replace(/\s/g, '')}`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
          <radialGradient id={`skill-fill-${data.label.replace(/\s/g, '')}`} cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor={hasSkill ? '#ffffff' : color.primary} stopOpacity={hasSkill ? 0.3 : 0.1} />
            <stop offset="100%" stopColor={hasSkill ? (isTransferable ? transferableColor : color.primary) : 'transparent'} stopOpacity={hasSkill ? 1 : 0} />
          </radialGradient>
        </defs>
        {/* Glow effect for mastered skills */}
        {hasSkill && (
          <circle
            r={nodeSize / 2 + 3}
            cx={nodeSize / 2}
            cy={nodeSize / 2}
            fill="none"
            stroke={activeGlow}
            strokeWidth="2"
            strokeOpacity={hovered ? 0.8 : 0.4}
            filter={`url(#skill-glow-${data.label.replace(/\s/g, '')})`}
            style={{ transition: 'stroke-opacity 0.3s' }}
          />
        )}
        {/* Main node circle */}
        <circle
          r={nodeSize / 2 - 2}
          cx={nodeSize / 2}
          cy={nodeSize / 2}
          fill={hasSkill ? `url(#skill-fill-${data.label.replace(/\s/g, '')})` : fillColor}
          stroke={strokeColor}
          strokeWidth={strokeW}
          style={{
            transition: 'fill 0.3s, stroke 0.3s, stroke-opacity 0.3s',
            strokeOpacity: hovered ? 1 : isLocked ? 0.3 : 0.7,
          }}
        />
      </svg>

      {/* Full skill label below the node (Issue 3) */}
      <div style={{
        textAlign: 'center',
        marginTop: '2px',
        fontSize: '9px',
        fontWeight: 600,
        color: labelTextColor,
        maxWidth: '80px',
        lineHeight: '1.2',
        wordWrap: 'break-word',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
        textShadow: isDark || theme === 'game' ? '0 1px 3px rgba(0,0,0,0.5)' : 'none',
      }}>
        {data.label}
      </div>

      {/* Tooltip on hover */}
      {hovered && (
        <div style={{
          position: 'absolute',
          top: `${nodeSize + 24}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          background: tooltipBg,
          border: `1px solid ${hasSkill ? (isTransferable ? transferableColor : color.primary) : (isDark ? 'rgba(255,255,255,0.15)' : colors.border)}`,
          borderRadius: '6px',
          padding: '6px 10px',
          whiteSpace: 'nowrap',
          zIndex: 50,
          boxShadow: hasSkill ? `0 0 12px ${color.dim}` : '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: hasSkill ? (isTransferable ? transferableColor : color.primary) : tooltipText }}>
            {data.label}
          </div>
          <div style={{ fontSize: '9px', color: hasSkill ? '#22c55e' : isTransferable ? '#a78bfa' : isAvailable ? '#f59e0b' : tooltipSubText, marginTop: '2px' }}>
            {hasSkill ? (isTransferable ? 'Transferable Skill' : 'Mastered') : isAvailable ? 'Available - Skill Gap' : 'Locked'}
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', border: 'none' }} className="!h-0 !w-0" />
    </div>
  )
})
