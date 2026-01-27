import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'
import { useTheme, themeColors } from '../../context/ThemeContext'

export type SkillNodeData = {
  label: string
  kind: 'role' | 'path' | 'skill'
  emphasis?: 'goal'
  has?: boolean // User has this skill
  required?: boolean // Skill is required (not just preferred)
}

export function SkillNode({ data }: NodeProps<SkillNodeData>) {
  const { theme, isDark, isGame } = useTheme()
  const colors = themeColors[theme]

  // Skills the user has get green styling
  const hasSkill = data.kind === 'skill' && data.has

  const borderColor =
    data.kind === 'role'
      ? 'rgba(255, 230, 0, 0.7)'
      : data.kind === 'path'
        ? (isDark || isGame) ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'
        : hasSkill
          ? 'rgba(34, 197, 94, 0.5)' // Green for skills user has
          : colors.cardBorder

  const textColor =
    data.kind === 'role'
      ? colors.textPrimary
      : data.kind === 'path'
        ? colors.textSecondary
        : hasSkill
          ? '#22c55e' // Green text for skills user has
          : colors.textMuted

  const bgColor =
    hasSkill
      ? (isDark || isGame) ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)'
      : (isDark || isGame) ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg

  const shadow = isDark
    ? '0 12px 40px rgba(0,0,0,0.55)'
    : '0 4px 20px rgba(0,0,0,0.12)'

  return (
    <div
      className="rounded-lg px-4 py-3 text-sm font-semibold backdrop-blur-md"
      style={{
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        boxShadow: shadow,
        color: textColor,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: (isDark || isGame) ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }}
        className="!h-2 !w-2 !border-0"
      />
      <div className="max-w-[200px] whitespace-normal leading-snug text-center">
        {hasSkill && <span className="mr-1">✓</span>}
        {data.label}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: (isDark || isGame) ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }}
        className="!h-2 !w-2 !border-0"
      />
    </div>
  )
}

