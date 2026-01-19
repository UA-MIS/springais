import type { CareerRole, CareerTransition } from '@/data/mockCareerGraphData'
import type { Node } from 'reactflow'
import type { RoleNodeData } from './graphTransformUtils'
import { RoleRequirementTree } from './RoleRequirementTree'

export type NodeDetailsPanelProps = {
  selectedNode: Node<RoleNodeData> | null
  roleById: Map<string, CareerRole>
  outgoingTransitions: CareerTransition[]
  onClose: () => void
  onSelectRoleId?: (roleId: string) => void
}

function fmtPct(v: number) {
  return `${Math.round(v * 100)}%`
}

export function NodeDetailsPanel(props: NodeDetailsPanelProps) {
  const { selectedNode, outgoingTransitions, roleById, onClose, onSelectRoleId } = props

  if (!selectedNode) return null

  const roleId = selectedNode.id
  const role = roleById.get(roleId)

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {/* click-catcher */}
      <button
        className="pointer-events-auto absolute inset-0 cursor-default bg-black/70"
        aria-label="Close role details"
        onClick={onClose}
        type="button"
      />

      <aside className="pointer-events-auto absolute right-0 top-0 h-full w-[420px] max-w-[92vw] overflow-y-auto border-l border-white/15 bg-white/7 shadow-2xl backdrop-blur-md">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold text-white">{role?.label ?? selectedNode.data.label}</div>
            <div className="mt-1 text-sm text-white/60">{role?.department ?? selectedNode.data.department}</div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/70">
              <span className="rounded bg-white/10 px-2 py-1">
                Employees:{' '}
                <span className="font-semibold text-white">{role?.employeeCount ?? selectedNode.data.employeeCount}</span>
              </span>
              <span className="rounded bg-white/10 px-2 py-1">
                Avg years:{' '}
                <span className="font-semibold text-white">
                  {(role?.avgYearsInRole ?? selectedNode.data.avgYearsInRole ?? 0).toFixed(1)}
                </span>
              </span>
              <span className="rounded bg-white/10 px-2 py-1">
                Role id: <span className="font-mono font-semibold text-white/80">{roleId}</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-white/15 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            Close
          </button>
        </div>

        <div className="p-5">
          <div className="text-sm font-semibold text-white">Next steps</div>
          <div className="mt-1 text-sm text-white/60">Outgoing transitions from this role.</div>

          {outgoingTransitions.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-white/15 bg-white/5 p-4 text-sm text-white/70">
              No outgoing transitions in this dataset.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {outgoingTransitions.map((t) => {
                const target = roleById.get(t.target)
                return (
                  <div key={`${t.source}__${t.target}`} className="rounded-lg border border-white/15 bg-black/10 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white">
                          {target?.label ?? t.target}
                        </div>
                        <div className="mt-1 text-xs text-white/60">{target?.department ?? '—'}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold text-white">{fmtPct(t.successRate)}</div>
                        <div className="text-xs text-white/60">success</div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/70">
                      <span className="rounded bg-white/10 px-2 py-1">
                        Avg time: <span className="font-semibold text-white">{t.avgTimeYears.toFixed(1)}y</span>
                      </span>
                      <span className="rounded bg-white/10 px-2 py-1">
                        Sample: <span className="font-semibold text-white">{t.sampleSize}</span>
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs font-semibold text-white/80">Common skills</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {t.commonSkills.slice(0, 10).map((s) => (
                          <span
                            key={s}
                            className="rounded-full border border-white/15 bg-white/7 px-2 py-1 text-[11px] font-semibold text-white/70"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {onSelectRoleId ? (
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => onSelectRoleId(t.target)}
                          className="rounded-md bg-white/15 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
                        >
                          Focus target
                        </button>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-8">
            <div className="text-sm font-semibold text-white">Routes to become this role</div>
            <div className="mt-1 text-sm text-white/60">
              Second tree: technical vs leadership vs mentoring (mock). Clicking roles will swap to API-backed data in Step 3.
            </div>
            <RoleRequirementTree roleId={roleId} />
          </div>
        </div>
      </aside>
    </div>
  )
}

