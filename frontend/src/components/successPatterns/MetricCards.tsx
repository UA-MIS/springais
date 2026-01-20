import { SuccessPatternMetrics } from '../../services/successPatternService';

interface ThemeColors {
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  cardBg: string;
  cardBorder: string;
  border: string;
  accent: string;
}

interface MetricCardsProps {
  metrics: SuccessPatternMetrics;
  isDark?: boolean;
  colors?: ThemeColors;
}

export default function MetricCards({ metrics, isDark = true, colors }: MetricCardsProps) {
  // Default colors for backwards compatibility
  const themeColors = colors || {
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.85)',
    textMuted: 'rgba(255, 255, 255, 0.6)',
    cardBg: '#ffffff',
    cardBorder: 'rgba(255, 255, 255, 0.15)',
    border: 'rgba(255, 255, 255, 0.15)',
    accent: '#FFE600',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : themeColors.cardBg,
    border: `1px solid ${themeColors.cardBorder}`,
    backdropFilter: isDark ? 'blur(12px)' : 'none',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Average Time to Promotion */}
      <div className="p-6 rounded-sm shadow-2xl transition-all" style={cardStyle}>
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${themeColors.accent}26` }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke={themeColors.accent}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm" style={{ color: themeColors.textMuted }}>Average Time to Promotion</p>
            <p className="text-2xl font-bold" style={{ color: themeColors.textPrimary }}>{metrics.avgTimeToPromotion} years</p>
          </div>
        </div>
      </div>

      {/* Overall Success Rate */}
      <div className="p-6 rounded-sm shadow-2xl transition-all" style={cardStyle}>
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${themeColors.accent}26` }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke={themeColors.accent}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm" style={{ color: themeColors.textMuted }}>Overall Success Rate</p>
            <p className="text-2xl font-bold" style={{ color: themeColors.textPrimary }}>
              {(metrics.overallSuccessRate * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Sample Size */}
      <div className="p-6 rounded-sm shadow-2xl transition-all" style={cardStyle}>
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${themeColors.accent}26` }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke={themeColors.accent}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm" style={{ color: themeColors.textMuted }}>Sample Size</p>
            <p className="text-2xl font-bold" style={{ color: themeColors.textPrimary }}>{metrics.totalSampleSize} transitions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
