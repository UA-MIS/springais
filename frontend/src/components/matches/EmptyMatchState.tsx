interface ThemeColors {
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
}

interface EmptyMatchStateProps {
  onResetFilters: () => void;
  isDark: boolean;
  colors: ThemeColors;
}

export default function EmptyMatchState({ onResetFilters, isDark, colors }: EmptyMatchStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-6xl mb-4">🔍</div>
      <h3
        className="text-2xl font-bold mb-2"
        style={{ color: colors.textPrimary }}
      >
        No matches found
      </h3>
      <p
        className="text-center max-w-md mb-6"
        style={{ color: colors.textMuted }}
      >
        We couldn't find any matches with your current filters. Try adjusting your search criteria to see more opportunities.
      </p>
      <button
        onClick={onResetFilters}
        className="px-6 py-3 rounded-sm font-semibold transition-colors"
        style={{
          backgroundColor: colors.accent,
          color: '#2E2E38',
        }}
      >
        Reset Filters
      </button>
    </div>
  );
}
