export type MatchMode = 'best_fit' | 'stretch' | 'exploratory';

interface ThemeColors {
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  cardBg: string;
  cardBorder: string;
  border: string;
  accent: string;
}

interface MatchModeToggleProps {
  mode: MatchMode;
  onModeChange: (mode: MatchMode) => void;
  isDark: boolean;
  colors: ThemeColors;
}

const MODES: { value: MatchMode; label: string; scoreRange: string; stars: string }[] = [
  { value: 'best_fit', label: 'Best Fit', scoreRange: '90%+', stars: '⭐⭐⭐' },
  { value: 'stretch', label: 'Stretch', scoreRange: '70-85%', stars: '⭐⭐' },
  { value: 'exploratory', label: 'Exploratory', scoreRange: '50-70%', stars: '⭐' }
];

export default function MatchModeToggle({ mode, onModeChange, isDark, colors }: MatchModeToggleProps) {
  return (
    <div className="mb-6">
      <div className="flex gap-2">
        {MODES.map((modeOption) => (
          <button
            key={modeOption.value}
            onClick={() => onModeChange(modeOption.value)}
            className="flex-1 px-4 py-3 rounded-sm font-semibold transition-all"
            style={
              mode === modeOption.value
                ? {
                    backgroundColor: colors.accent,
                    color: '#2E2E38',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }
                : {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.cardBg,
                    color: colors.textPrimary,
                    border: `1px solid ${colors.border}`,
                  }
            }
          >
            <div className="text-lg font-semibold mb-1">{modeOption.label}</div>
            <div className="text-xs mb-1">{modeOption.stars}</div>
            <div className="text-xs opacity-75">{modeOption.scoreRange}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
