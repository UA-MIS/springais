export type MatchMode = 'best_fit' | 'stretch' | 'exploratory';

interface MatchModeToggleProps {
  mode: MatchMode;
  onModeChange: (mode: MatchMode) => void;
}

const MODES: { value: MatchMode; label: string; scoreRange: string; stars: string }[] = [
  { value: 'best_fit', label: 'Best Fit', scoreRange: '90%+', stars: '⭐⭐⭐' },
  { value: 'stretch', label: 'Stretch', scoreRange: '70-85%', stars: '⭐⭐' },
  { value: 'exploratory', label: 'Exploratory', scoreRange: '50-70%', stars: '⭐' }
];

export default function MatchModeToggle({ mode, onModeChange }: MatchModeToggleProps) {
  return (
    <div className="mb-6">
      <div className="flex gap-2">
        {MODES.map((modeOption) => (
          <button
            key={modeOption.value}
            onClick={() => onModeChange(modeOption.value)}
            className={`
              flex-1 px-4 py-3 rounded-sm font-semibold transition-all
              ${mode === modeOption.value
                ? 'bg-[#FFE600] text-[#2E2E38] shadow-lg'
                : 'bg-white/10 text-white/85 hover:bg-white/15 border border-white/10'
              }
            `}
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
