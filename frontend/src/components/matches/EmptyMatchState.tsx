interface EmptyMatchStateProps {
  onResetFilters: () => void;
}

export default function EmptyMatchState({ onResetFilters }: EmptyMatchStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-2xl font-bold text-white mb-2">No matches found</h3>
      <p className="text-white/60 text-center max-w-md mb-6">
        We couldn't find any matches with your current filters. Try adjusting your search criteria to see more opportunities.
      </p>
      <button
        onClick={onResetFilters}
        className="px-6 py-3 bg-[#FFE600] text-[#2E2E38] rounded-sm hover:bg-[#FFD700] font-semibold transition-colors"
      >
        Reset Filters
      </button>
    </div>
  );
}
