import { useTheme, themeColors } from '../../context/ThemeContext'

export type GraphControlsState = {
  search: string
  department: string | 'all'
  minSuccessRate: number // 0..1
}

export type GraphControlsProps = {
  state: GraphControlsState
  departments: string[]
  onChange: (next: GraphControlsState) => void
  onReset: () => void
  isOpen: boolean
  onToggle: () => void
}

export function GraphControls(props: GraphControlsProps) {
  const { state, departments, onChange, onReset, isOpen, onToggle } = props
  const { isDark } = useTheme()
  const colors = isDark ? themeColors.dark : themeColors.light

  const activeCount =
    (state.search.trim() ? 1 : 0) + (state.department !== 'all' ? 1 : 0) + (state.minSuccessRate > 0 ? 1 : 0)

  return (
    <div className="absolute right-4 top-4 z-10 max-w-[92vw]">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onToggle}
          className="rounded-full px-3 py-2 text-xs font-semibold shadow-2xl backdrop-blur-md"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid rgba(255, 230, 0, 0.3)`,
            color: colors.textPrimary,
          }}
          title="Toggle filters"
        >
          Filters{activeCount ? ` · ${activeCount}` : ''}
        </button>
      </div>

      {isOpen ? (
        <div
          className="mt-3 w-[360px] rounded-xl p-3 shadow-2xl backdrop-blur-md"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Filters</div>
            <button
              type="button"
              onClick={onReset}
              className="rounded-md px-2 py-1 text-xs font-semibold"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)',
                color: colors.textPrimary,
              }}
            >
              Reset
            </button>
          </div>

          <div className="mt-3 space-y-3">
            <label className="block">
              <div className="text-xs font-semibold" style={{ color: colors.textMuted }}>Search</div>
              <input
                value={state.search}
                onChange={(e) => onChange({ ...state, search: e.target.value })}
                placeholder="Role name (e.g. Manager)"
                className="mt-1 w-full bg-transparent px-0 py-2 text-sm outline-none border-b border-[#FFE600]/30 focus:border-[#FFE600]"
                style={{
                  color: colors.textPrimary,
                }}
              />
              <div className="mt-1 text-[11px]" style={{ color: colors.textMuted }}>Shows matches + their neighbors (PoE-ish).</div>
            </label>

            <label className="block">
              <div className="text-xs font-semibold" style={{ color: colors.textMuted }}>Department</div>
              <select
                value={state.department}
                onChange={(e) => onChange({ ...state, department: e.target.value as GraphControlsState['department'] })}
                className="mt-1 w-full rounded-md px-3 py-2 text-sm outline-none focus:border-[#FFE600]"
                style={{
                  backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${colors.cardBorder}`,
                  color: colors.textPrimary,
                }}
              >
                <option value="all">All</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold" style={{ color: colors.textMuted }}>Min success rate</div>
                <div className="text-xs font-semibold" style={{ color: colors.textPrimary }}>{Math.round(state.minSuccessRate * 100)}%</div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(state.minSuccessRate * 100)}
                onChange={(e) => onChange({ ...state, minSuccessRate: Number(e.target.value) / 100 })}
                className="mt-2 w-full accent-[#FFE600]"
              />
              <div className="mt-1 text-[11px]" style={{ color: colors.textMuted }}>Edges below threshold are hidden; nodes stay.</div>
            </label>
          </div>
        </div>
      ) : null}
    </div>
  )
}

