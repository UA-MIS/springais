import { useState } from 'react';

export type SortOption = 'score_desc' | 'score_asc' | 'date_desc' | 'date_asc';

interface MatchSortDropdownProps {
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'score_desc', label: 'Match Score (High to Low)' },
  { value: 'score_asc', label: 'Match Score (Low to High)' },
  { value: 'date_desc', label: 'Date Posted (Newest First)' },
  { value: 'date_asc', label: 'Date Posted (Oldest First)' }
];

export default function MatchSortDropdown({ sortBy, onSortChange }: MatchSortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = SORT_OPTIONS.find(opt => opt.value === sortBy);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-white/60 mb-2">
        Sort By
      </label>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full md:w-64 px-4 py-2 bg-white/10 border border-white/15 rounded-sm text-left flex justify-between items-center hover:bg-white/15 hover:border-[#FFE600] transition-colors"
        >
          <span className="text-sm text-white/85">{selectedOption?.label}</span>
          <span className="text-white/60">▼</span>
        </button>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 w-full mt-1 border border-white/15 bg-white/7 backdrop-blur-md rounded-sm shadow-2xl">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full px-4 py-2 text-left text-sm text-white/85 hover:bg-white/10
                    ${sortBy === option.value ? 'bg-[#FFE600] bg-opacity-20 font-semibold' : ''}
                  `}
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
