import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { mockCareerGraphData } from '@/data/mockCareerGraphData'
import { RoleRequirementTree } from '@/components/career-viz/RoleRequirementTree'
import { useTheme, themeColors } from '../context/ThemeContext'

export function RoleRequirementPage() {
  const { roleId } = useParams()
  const { isDark } = useTheme()
  const colors = isDark ? themeColors.dark : themeColors.light

  const role = useMemo(() => {
    if (!roleId) return null
    return mockCareerGraphData.roles.find((r) => r.id === roleId) ?? null
  }, [roleId])

  return (
    <div
      className="career-paths relative min-h-screen overflow-hidden transition-colors"
      style={{ backgroundColor: colors.pageBg }}
    >
      {isDark && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(24,24,27,0.70) 0%, rgba(9,9,11,0.45) 40%, rgba(0,0,0,0.70) 80%, rgba(0,0,0,1) 100%)',
          }}
        />
      )}

      <div className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <Link
                to="/career-path"
                className="rounded-md px-3 py-2 text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.06)',
                  color: colors.textPrimary,
                }}
              >
                Back
              </Link>
              <div className="text-sm" style={{ color: colors.textMuted }}>Role requirements</div>
            </div>

            <h1
              className="mt-4 truncate text-3xl font-semibold tracking-tight"
              style={{ color: colors.textPrimary }}
            >
              {role?.label ?? roleId ?? 'Role'}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs" style={{ color: colors.textMuted }}>
              <span
                className="rounded px-2 py-1"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
              >
                {role?.department ?? '—'}
              </span>
              <span
                className="rounded px-2 py-1"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
              >
                Employees: <span className="font-semibold" style={{ color: colors.textPrimary }}>{role?.employeeCount ?? '—'}</span>
              </span>
              <span
                className="rounded px-2 py-1"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
              >
                Avg years: <span className="font-semibold" style={{ color: colors.textPrimary }}>{(role?.avgYearsInRole ?? 0).toFixed(1)}</span>
              </span>
              {roleId ? (
                <span
                  className="rounded px-2 py-1"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
                >
                  id: <span className="font-mono" style={{ color: colors.textSecondary }}>{roleId}</span>
                </span>
              ) : null}
            </div>
          </div>

          <div className="text-right text-xs" style={{ color: colors.textMuted }}>
            Mock subtree. Later: API-backed per-role requirements.
          </div>
        </div>

        <div className="relative mt-8">
          {isDark && (
            <div
              className="pointer-events-none absolute inset-0 -z-10 blur-2xl"
              style={{
                background:
                  'radial-gradient(circle at center, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.10) 28%, transparent 65%)',
              }}
            />
          )}

          <div
            className="rounded-2xl shadow-2xl backdrop-blur-md"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            <div
              className="px-6 py-4"
              style={{ borderBottom: `1px solid ${colors.cardBorder}` }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Routes to become this role</div>
                <div className="text-xs" style={{ color: colors.textMuted }}>
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
                <div
                  className="rounded-lg p-6 text-sm"
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    border: `1px solid ${colors.cardBorder}`,
                    color: colors.textMuted,
                  }}
                >
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

