import { CareerVisualization } from '@/components/career-viz/CareerVisualization'

export function CareerPathPage() {
  return (
    <div className="career-paths relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      {/* slow-blend overlay gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(24,24,27,0.70) 0%, rgba(9,9,11,0.45) 40%, rgba(0,0,0,0.70) 80%, rgba(0,0,0,1) 100%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Career Path Explorer</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Interactive skill-tree style career map. Click a role to see possible next steps.
            </p>
          </div>

          <div className="text-right text-xs text-white/45">
            Mock data (Block K). Step 3 wires <span className="font-mono text-white/60">/api/patterns/graph</span>.
          </div>
        </div>

        {/* glass surface + spotlight */}
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
                <div className="text-sm font-semibold text-white">Skill Tree</div>
                <div className="text-xs text-white/45">
                  Accent: <span className="font-mono text-[#FFE600]">#FFE600</span>
                </div>
              </div>
            </div>

            <div className="p-4">
              <CareerVisualization employeeCurrentRoleId="analyst" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

