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

  const activeCount =
    (state.search.trim() ? 1 : 0) + (state.department !== 'all' ? 1 : 0) + (state.minSuccessRate > 0 ? 1 : 0)

  return (
    <div className="absolute right-4 top-4 z-10 max-w-[92vw]">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onToggle}
          className="rounded-full border border-[#FFE600]/30 bg-white/7 px-3 py-2 text-xs font-semibold text-white shadow-2xl backdrop-blur-md hover:border-[#FFE600]"
          title="Toggle filters"
        >
          Filters{activeCount ? ` · ${activeCount}` : ''}
        </button>
      </div>

      {isOpen ? (
        <div className="mt-3 w-[360px] rounded-xl border border-white/15 bg-white/7 p-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">Filters</div>
            <button
              type="button"
              onClick={onReset}
              className="rounded-md bg-white/15 px-2 py-1 text-xs font-semibold text-white hover:bg-white/20"
            >
              Reset
            </button>
          </div>

          <div className="mt-3 space-y-3">
            <label className="block">
              <div className="text-xs font-semibold text-white/60">Search</div>
              <input
                value={state.search}
                onChange={(e) => onChange({ ...state, search: e.target.value })}
                placeholder="Role name (e.g. Manager)"
                className="mt-1 w-full bg-transparent px-0 py-2 text-sm text-white placeholder:text-white/25 outline-none border-b border-[#FFE600]/30 focus:border-[#FFE600]"
              />
              <div className="mt-1 text-[11px] text-white/45">Shows matches + their neighbors (PoE-ish).</div>
            </label>

            <label className="block">
              <div className="text-xs font-semibold text-white/60">Department</div>
              <select
                value={state.department}
                onChange={(e) => onChange({ ...state, department: e.target.value as GraphControlsState['department'] })}
                className="mt-1 w-full rounded-md border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-[#FFE600]"
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
                <div className="text-xs font-semibold text-white/60">Min success rate</div>
                <div className="text-xs font-semibold text-white">{Math.round(state.minSuccessRate * 100)}%</div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(state.minSuccessRate * 100)}
                onChange={(e) => onChange({ ...state, minSuccessRate: Number(e.target.value) / 100 })}
                className="mt-2 w-full accent-[#FFE600]"
              />
              <div className="mt-1 text-[11px] text-white/45">Edges below threshold are hidden; nodes stay.</div>
            </label>
          </div>
        </div>
      ) : null}
    </div>
  )
}

