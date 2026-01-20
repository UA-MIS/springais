import { useState } from 'react';

export type SortOption = 'score_desc' | 'score_asc' | 'date_desc' | 'date_asc';

interface ThemeColors {
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  cardBg: string;
  cardBorder: string;
  border: string;
  accent: string;
}

interface MatchSortDropdownProps {
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
  isDark: boolean;
  colors: ThemeColors;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'score_desc', label: 'Match Score (High to Low)' },
  { value: 'score_asc', label: 'Match Score (Low to High)' },
  { value: 'date_desc', label: 'Date Posted (Newest First)' },
  { value: 'date_asc', label: 'Date Posted (Oldest First)' }
];

export default function MatchSortDropdown({ sortBy, onSortChange, isDark, colors }: MatchSortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = SORT_OPTIONS.find(opt => opt.value === sortBy);

  const inputBgColor = isDark ? 'rgba(255, 255, 255, 0.1)' : colors.cardBg;
  const dropdownBgColor = isDark ? 'rgba(30, 30, 40, 0.95)' : colors.cardBg;

  return (
    <div className="relative">
      <label
        className="block text-sm font-medium mb-2"
        style={{ color: colors.textMuted }}
      >
        Sort By
      </label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full md:w-64 px-4 py-2 rounded-sm text-left flex justify-between items-center transition-colors"
          style={{
            backgroundColor: inputBgColor,
            border: `1px solid ${colors.border}`,
            color: colors.textPrimary,
          }}
        >
          <span className="text-sm">{selectedOption?.label}</span>
          <span style={{ color: colors.textMuted }}>▼</span>
        </button>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div
              className="absolute z-20 w-full mt-1 rounded-sm shadow-2xl"
              style={{
                backgroundColor: dropdownBgColor,
                border: `1px solid ${colors.border}`,
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm transition-colors"
                  style={{
                    color: colors.textPrimary,
                    backgroundColor: sortBy === option.value
                      ? `${colors.accent}33`
                      : 'transparent',
                    fontWeight: sortBy === option.value ? 600 : 400,
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
