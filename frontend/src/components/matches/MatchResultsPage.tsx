import { useState, useMemo } from 'react';
import { Match, MOCK_MATCHES_BEST_FIT, MOCK_MATCHES_STRETCH, MOCK_MATCHES_EXPLORATORY } from '../../services/mockMatchData';
import MatchCard from './MatchCard';
import MatchModeToggle, { MatchMode } from './MatchModeToggle';
import MatchFilters, { FilterState } from './MatchFilters';
import MatchSortDropdown, { SortOption } from './MatchSortDropdown';
import EmptyMatchState from './EmptyMatchState';
import MatchDetailsModal from './MatchDetailsModal';

export default function MatchResultsPage() {
  const [mode, setMode] = useState<MatchMode>('best_fit');
  const [filters, setFilters] = useState<FilterState>({
    departments: [],
    locations: [],
    min_score: 70,
    experience_levels: []
  });
  const [sortBy, setSortBy] = useState<SortOption>('score_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const matchesPerPage = 10;

  // Get matches based on mode
  const allMatches = useMemo(() => {
    switch (mode) {
      case 'best_fit':
        return MOCK_MATCHES_BEST_FIT;
      case 'stretch':
        return MOCK_MATCHES_STRETCH;
      case 'exploratory':
        return MOCK_MATCHES_EXPLORATORY;
      default:
        return MOCK_MATCHES_BEST_FIT;
    }
  }, [mode]);

  // Filter matches
  const filteredMatches = useMemo(() => {
    return allMatches.filter((match) => {
      // Filter by departments
      if (filters.departments.length > 0 && !filters.departments.includes(match.department)) {
        return false;
      }
      // Filter by locations
      if (filters.locations.length > 0 && !filters.locations.includes(match.location)) {
        return false;
      }
      // Filter by min score
      if (match.overall_score < filters.min_score / 100) {
        return false;
      }
      // Filter by experience level (simple check - could be enhanced)
      if (filters.experience_levels.length > 0) {
        // This is a simplified check - in real app, would parse experience_required
        // For now, just check if any experience level matches the required range
        const matchExperience = match.experience_required || '';
        const hasMatchingExperience = filters.experience_levels.some(level => {
          // Simple string matching - could be improved
          return matchExperience.includes(level.split('-')[0]) || 
                 matchExperience.includes(level.split('+')[0]);
        });
        if (!hasMatchingExperience) {
          return false;
        }
      }
      return true;
    });
  }, [allMatches, filters]);

  // Sort matches
  const sortedMatches = useMemo(() => {
    return [...filteredMatches].sort((a, b) => {
      if (sortBy === 'score_desc') return b.overall_score - a.overall_score;
      if (sortBy === 'score_asc') return a.overall_score - b.overall_score;
      if (sortBy === 'date_desc') {
        return new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.posted_date).getTime() - new Date(b.posted_date).getTime();
      }
      return 0;
    });
  }, [filteredMatches, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedMatches.length / matchesPerPage);
  const startIndex = (currentPage - 1) * matchesPerPage;
  const endIndex = startIndex + matchesPerPage;
  const paginatedMatches = sortedMatches.slice(startIndex, endIndex);

  const handleModeChange = (newMode: MatchMode) => {
    setMode(newMode);
    setCurrentPage(1);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleViewDetails = (matchId: string) => {
    // Search across all match arrays to find the match
    const allMatchesCombined = [
      ...MOCK_MATCHES_BEST_FIT,
      ...MOCK_MATCHES_STRETCH,
      ...MOCK_MATCHES_EXPLORATORY
    ];
    const match = allMatchesCombined.find(m => m.id === matchId);
    if (match) {
      setSelectedMatch(match);
    }
  };

  const handleSave = (matchId: string) => {
    // TODO: Save match to user's saved matches
    console.log('Save match:', matchId);
    // Could show a toast notification here
  };

  const handleResetFilters = () => {
    setFilters({
      departments: [],
      locations: [],
      min_score: 70,
      experience_levels: []
    });
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-white mb-2">Match Results</h1>
      <p className="text-lg text-white/60 mb-6">Discover job opportunities matched to your skills and career goals</p>

      {/* Mode Toggle */}
      <MatchModeToggle mode={mode} onModeChange={handleModeChange} />

      {/* Filters and Sort */}
      <div className="mb-6">
        <MatchFilters filters={filters} onFiltersChange={handleFiltersChange} />
        <div className="mt-4">
          <MatchSortDropdown sortBy={sortBy} onSortChange={setSortBy} />
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-white/60">
        Showing {paginatedMatches.length} of {sortedMatches.length} matches
        {sortedMatches.length !== allMatches.length && (
          <span className="ml-2">
            (filtered from {allMatches.length} total)
          </span>
        )}
      </div>

      {/* Match Cards */}
      {paginatedMatches.length === 0 ? (
        <EmptyMatchState onResetFilters={handleResetFilters} />
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {paginatedMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onViewDetails={handleViewDetails}
                onSave={handleSave}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white/10 text-white/85 font-semibold rounded-sm hover:bg-white/15 transition-colors border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-white/60">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white/10 text-white/85 font-semibold rounded-sm hover:bg-white/15 transition-colors border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Match Details Modal */}
      <MatchDetailsModal
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onSave={handleSave}
      />
    </div>
  );
}
