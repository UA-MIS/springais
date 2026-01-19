import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { mockCareerGraphData } from '@/data/mockCareerGraphData'
import { RoleRequirementTree } from '@/components/career-viz/RoleRequirementTree'

export function RoleRequirementPage() {
  const { roleId } = useParams()

  const role = useMemo(() => {
    if (!roleId) return null
    return mockCareerGraphData.roles.find((r) => r.id === roleId) ?? null
  }, [roleId])

  return (
    <div className="career-paths relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(24,24,27,0.70) 0%, rgba(9,9,11,0.45) 40%, rgba(0,0,0,0.70) 80%, rgba(0,0,0,1) 100%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <Link
                to="/career-paths"
                className="rounded-md bg-white/15 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
              >
                Back
              </Link>
              <div className="text-sm text-white/45">Role requirements</div>
            </div>

            <h1 className="mt-4 truncate text-3xl font-semibold tracking-tight">
              {role?.label ?? roleId ?? 'Role'}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/60">
              <span className="rounded bg-white/10 px-2 py-1">{role?.department ?? '—'}</span>
              <span className="rounded bg-white/10 px-2 py-1">
                Employees: <span className="font-semibold text-white">{role?.employeeCount ?? '—'}</span>
              </span>
              <span className="rounded bg-white/10 px-2 py-1">
                Avg years: <span className="font-semibold text-white">{(role?.avgYearsInRole ?? 0).toFixed(1)}</span>
              </span>
              {roleId ? (
                <span className="rounded bg-white/10 px-2 py-1">
                  id: <span className="font-mono text-white/80">{roleId}</span>
                </span>
              ) : null}
            </div>
          </div>

          <div className="text-right text-xs text-white/45">
            Mock subtree. Later: API-backed per-role requirements.
          </div>
        </div>

        <div className="relative mt-8">
          <div
            className="pointer-events-none absolute inset-0 -z-10 blur-2xl"
            style={{
              background:
                'radial-gradient(circle at center, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.10) 28%, transparent 65%)',
            }}
          />

          <div className="rounded-2xl border border-white/15 bg-white/7 shadow-2xl backdrop-blur-md">
            <div className="border-b border-white/10 px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">Routes to become this role</div>
                <div className="text-xs text-white/45">
                  Technical / leadership / mentoring branches
                </div>
              </div>
            </div>

            <div className="p-4">
              {roleId ? (
                <div className="h-[760px]">
                  <RoleRequirementTree roleId={roleId} />
                </div>
              ) : (
                <div className="rounded-lg border border-white/15 bg-white/5 p-6 text-sm text-white/60">
                  Missing role id.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

