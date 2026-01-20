import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'
import type { SkillNodeData } from '@/data/mockRoleSkillTrees'
import { useTheme, themeColors } from '../../context/ThemeContext'

export function SkillNode({ data }: NodeProps<SkillNodeData>) {
  const { isDark } = useTheme()
  const colors = isDark ? themeColors.dark : themeColors.light

  const borderColor =
    data.kind === 'role'
      ? 'rgba(255, 230, 0, 0.7)'
      : data.kind === 'path'
        ? isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'
        : colors.cardBorder

  const textColor =
    data.kind === 'role'
      ? colors.textPrimary
      : data.kind === 'path'
        ? colors.textSecondary
        : colors.textMuted

  const shadow = isDark
    ? '0 12px 40px rgba(0,0,0,0.55)'
    : '0 4px 20px rgba(0,0,0,0.12)'

  return (
    <div
      className="rounded-lg px-4 py-3 text-sm font-semibold backdrop-blur-md"
      style={{
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
        border: `1px solid ${borderColor}`,
        boxShadow: shadow,
        color: textColor,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }}
        className="!h-2 !w-2 !border-0"
      />
      <div className="max-w-[200px] whitespace-normal leading-snug text-center">{data.label}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }}
        className="!h-2 !w-2 !border-0"
      />
    </div>
  )
}

