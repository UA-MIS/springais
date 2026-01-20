import { CareerVisualization } from '@/components/career-viz/CareerVisualization'
import { useTheme, themeColors } from '../context/ThemeContext'

export function CareerPathPage() {
  const { isDark } = useTheme();
  const colors = isDark ? themeColors.dark : themeColors.light;

  return (
    <div
      className="career-paths relative min-h-screen overflow-hidden transition-colors duration-200"
      style={{
        backgroundColor: isDark ? 'transparent' : colors.pageBg,
        color: colors.textPrimary
      }}
    >
      <div className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1
              className="text-3xl font-semibold tracking-tight"
              style={{ color: colors.textPrimary }}
            >
              Career Path Explorer
            </h1>
            <p
              className="mt-2 max-w-2xl text-sm"
              style={{ color: colors.textMuted }}
            >
              Interactive skill-tree style career map. Click a role to see possible next steps.
            </p>
          </div>

          <div
            className="text-right text-xs"
            style={{ color: colors.textMuted }}
          >
            Mock data (Block K). Step 3 wires <span className="font-mono" style={{ color: colors.textSecondary }}>/api/patterns/graph</span>.
          </div>
        </div>

        {/* glass surface + spotlight */}
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
            className="rounded-2xl border shadow-2xl transition-colors duration-200"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
              backdropFilter: isDark ? 'blur(12px)' : 'none',
            }}
          >
            <div
              className="border-b px-6 py-4"
              style={{ borderColor: colors.border }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                  className="text-sm font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  Skill Tree
                </div>
                <div
                  className="text-xs"
                  style={{ color: colors.textMuted }}
                >
                  Accent: <span className="font-mono" style={{ color: colors.accent }}>#FFE600</span>
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
