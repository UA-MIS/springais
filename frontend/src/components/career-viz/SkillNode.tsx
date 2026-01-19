import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'
import type { SkillNodeData } from '@/data/mockRoleSkillTrees'

export function SkillNode({ data }: NodeProps<SkillNodeData>) {
  const base =
    'rounded-xl border bg-white/7 px-6 py-5 text-base font-semibold shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md'

  const kind =
    data.kind === 'role'
      ? 'text-white border-[#FFE600]/70'
      : data.kind === 'path'
        ? 'text-white/85 border-white/20'
        : 'text-white/70 border-white/15'

  return (
    <div className={[base, kind].join(' ')}>
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-white/30" />
      <div className="max-w-[360px] whitespace-normal leading-snug">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-white/30" />
    </div>
  )
}

