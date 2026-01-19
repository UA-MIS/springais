import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'
import type { RoleNodeData } from './graphTransformUtils'

export function RoleNode({ data }: NodeProps<RoleNodeData>) {
  const isGoal = data.isGoal === true && !data.isCurrentRole

  const border = data.isCurrentRole
    ? 'border-[#FFE600]'
    : isGoal
      ? 'border-[#FFE600]/80'
    : data.isPossibleNext
      ? 'border-green-500/80'
      : data.isSelected
        ? 'border-[#FFE600]'
        : 'border-white/15'

  const shadow = data.isCurrentRole
    ? 'shadow-[0_0_0_1px_rgba(255,230,0,0.20),0_12px_40px_rgba(0,0,0,0.55)]'
    : isGoal
      ? 'shadow-[0_0_0_1px_rgba(255,230,0,0.14),0_12px_40px_rgba(0,0,0,0.55)]'
    : data.isPossibleNext
      ? 'shadow-[0_0_0_1px_rgba(34,197,94,0.18),0_12px_40px_rgba(0,0,0,0.55)]'
      : data.isSelected
        ? 'shadow-[0_0_0_1px_rgba(255,230,0,0.18),0_12px_40px_rgba(0,0,0,0.55)]'
        : 'shadow-[0_12px_40px_rgba(0,0,0,0.55)]'

  return (
    <div
      className={[
        'rounded-lg border bg-white/7 px-4 py-3 backdrop-blur-md',
        'min-w-[220px] max-w-[260px]',
        'transition-[box-shadow,transform] duration-150',
        'hover:-translate-y-[1px]',
        border,
        shadow,
      ].join(' ')}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-0 !bg-white/30"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">{data.label}</div>
          <div className="mt-1 text-xs text-white/60">{data.department}</div>
        </div>
        <div className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">
          {data.employeeCount}
        </div>
      </div>

      <div className="mt-2 text-[11px] text-white/45">
        Avg years: <span className="font-semibold text-white/70">{(data.avgYearsInRole ?? 0).toFixed(1)}</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-0 !bg-white/30"
      />
    </div>
  )
}

