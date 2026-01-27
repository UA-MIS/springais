import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'
import { useTheme, themeColors } from '../../context/ThemeContext'

export type SkillNodeData = {
  label: string
  kind: 'role' | 'path' | 'skill'
  emphasis?: 'goal'
  has?: boolean // User has this skill
  required?: boolean // Skill is required (not just preferred)
  progress?: number // Progress percentage (0-100) for skills
  isCustomizing?: boolean
}

export function SkillNode({ data, selected }: NodeProps<SkillNodeData>) {
  const { isDark } = useTheme()
  const colors = isDark ? themeColors.dark : themeColors.light
  const wiggleStyle = data.isCustomizing
    ? { animation: 'nodeWiggle 0.9s ease-in-out infinite' }
    : {}

  // Skills the user has get green styling
  const hasSkill = data.kind === 'skill' && data.has
  const progress = data.progress ?? (hasSkill ? 100 : 0)
  const isInProgress = data.kind === 'skill' && !hasSkill && progress > 0 && progress < 100

  // Determine node state
  const nodeState = 
    data.kind === 'role' ? 'current' :
    hasSkill ? 'complete' :
    isInProgress ? 'in-progress' :
    'available'

  // For role nodes (center node), use special styling
  if (data.kind === 'role') {
    return (
      <div
        className="network-node-interactive current"
        style={{ cursor: data.isCustomizing ? 'grab' : 'pointer', ...wiggleStyle }}
      >
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: 'transparent', border: 'none' }}
          className="!h-0 !w-0"
        />
        <svg width="60" height="60" viewBox="0 0 60 60" style={{ overflow: 'visible' }}>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Glow ring */}
          <circle
            r="38"
            cx="30"
            cy="30"
            fill="none"
            stroke="rgba(255,230,0,0.3)"
            strokeWidth="8"
            filter="url(#glow)"
          />
          {/* Outer ring */}
          <circle
            r="30"
            cx="30"
            cy="30"
            fill="#2E2E38"
            stroke={colors.accent}
            strokeWidth="3"
          />
          {/* Inner fill */}
          <circle
            r="22"
            cx="30"
            cy="30"
            fill={colors.accent}
          />
          {/* Text */}
          <text
            x="30"
            y="35"
            fill="#1A1A24"
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
          >
            YOU
          </text>
        </svg>
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: 'transparent', border: 'none' }}
          className="!h-0 !w-0"
        />
      </div>
    )
  }

  // For path nodes (categories), use medium-sized circles
  if (data.kind === 'path') {
    return (
      <div
        className="network-node-interactive"
        style={{ cursor: data.isCustomizing ? 'grab' : 'pointer', ...wiggleStyle }}
      >
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: 'transparent', border: 'none' }}
          className="!h-0 !w-0"
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
              border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : colors.cardBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            {data.label === 'Technical' ? '☁️' :
             data.label === 'Leadership' ? '👥' :
             data.label === 'Domain' ? '💼' : '🛠️'}
          </div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: colors.textPrimary,
              textAlign: 'center',
              maxWidth: '100px',
            }}
          >
            {data.label}
          </div>
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: 'transparent', border: 'none' }}
          className="!h-0 !w-0"
        />
      </div>
    )
  }

  // For skill nodes, use circular nodes with progress rings
  const nodeSize = 52
  const progressRadius = 26
  const circumference = 2 * Math.PI * progressRadius
  const progressOffset = circumference - (progress / 100) * circumference

  return (
    <div
      className={`network-node-interactive ${nodeState}`}
      style={{ cursor: data.isCustomizing ? 'grab' : 'pointer', ...wiggleStyle }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: 'transparent', border: 'none' }}
        className="!h-0 !w-0"
      />
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <svg width={nodeSize} height={nodeSize} viewBox={`0 0 ${nodeSize} ${nodeSize}`} style={{ overflow: 'visible' }}>
          {/* Progress ring background */}
          {progress > 0 && (
            <circle
              r={progressRadius}
              cx={nodeSize / 2}
              cy={nodeSize / 2}
              fill="none"
              stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
              strokeWidth="5"
            />
          )}
          {/* Progress ring */}
          {progress > 0 && (
            <circle
              r={progressRadius}
              cx={nodeSize / 2}
              cy={nodeSize / 2}
              fill="none"
              stroke={hasSkill ? '#22c55e' : colors.accent}
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={progressOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${nodeSize / 2} ${nodeSize / 2})`}
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
          )}
          {/* Node background */}
          <circle
            r={22}
            cx={nodeSize / 2}
            cy={nodeSize / 2}
            fill={hasSkill ? '#22c55e' : (isDark ? '#2E2E38' : colors.cardBg)}
            stroke={hasSkill ? '#22c55e' : (selected ? colors.accent : (isDark ? 'rgba(255,255,255,0.2)' : colors.cardBorder))}
            strokeWidth={selected ? 3 : 2}
          />
          {/* Skill abbreviation or icon */}
          <text
            x={nodeSize / 2}
            y={nodeSize / 2 + 4}
            fill={hasSkill ? '#ffffff' : colors.textPrimary}
            textAnchor="middle"
            fontSize="9"
            fontWeight="600"
          >
            {data.label.length > 8 ? data.label.substring(0, 6).toUpperCase() : data.label.substring(0, 3).toUpperCase()}
          </text>
        </svg>
        {/* Tooltip on hover would go here */}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: 'transparent', border: 'none' }}
        className="!h-0 !w-0"
      />
    </div>
  )
}

