import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'
import type { RoleNodeData } from './graphTransformUtils'
import { useTheme, themeColors } from '../../context/ThemeContext'

export function RoleNode({ data }: NodeProps<RoleNodeData>) {
  const { theme, isDark, isGame } = useTheme()
  const colors = themeColors[theme]
  const isGoal = data.isGoal === true && !data.isCurrentRole

  const borderColor = data.isCurrentRole
    ? '#FFE600'
    : isGoal
      ? 'rgba(255, 230, 0, 0.8)'
    : data.isPossibleNext
      ? 'rgba(34, 197, 94, 0.8)'
      : data.isSelected
        ? '#FFE600'
        : colors.cardBorder

  const shadow = data.isCurrentRole
    ? '0 0 0 1px rgba(255,230,0,0.20), 0 12px 40px rgba(0,0,0,0.55)'
    : isGoal
      ? '0 0 0 1px rgba(255,230,0,0.14), 0 12px 40px rgba(0,0,0,0.55)'
    : data.isPossibleNext
      ? '0 0 0 1px rgba(34,197,94,0.18), 0 12px 40px rgba(0,0,0,0.55)'
      : data.isSelected
        ? '0 0 0 1px rgba(255,230,0,0.18), 0 12px 40px rgba(0,0,0,0.55)'
        : (isDark || isGame) ? '0 12px 40px rgba(0,0,0,0.55)' : '0 4px 20px rgba(0,0,0,0.12)'

  return (
    <div
      className="rounded-lg px-4 py-3 backdrop-blur-md min-w-[220px] max-w-[260px] transition-[box-shadow,transform] duration-150 hover:-translate-y-[1px]"
      style={{
        backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
        border: `1px solid ${borderColor}`,
        boxShadow: shadow,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: (isDark || isGame) ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }}
        className="!h-2 !w-2 !border-0"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold" style={{ color: colors.textPrimary }}>{data.label}</div>
          <div className="mt-1 text-xs" style={{ color: colors.textMuted }}>{data.department}</div>
        </div>
        <div
          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{
            backgroundColor: (isDark || isGame) ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            color: colors.textSecondary,
          }}
        >
          {data.employeeCount}
        </div>
      </div>

      <div className="mt-2 text-[11px]" style={{ color: colors.textMuted }}>
        Avg years: <span className="font-semibold" style={{ color: colors.textSecondary }}>{(data.avgYearsInRole ?? 0).toFixed(1)}</span>
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

