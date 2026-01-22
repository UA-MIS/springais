import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveMatch } from '../../services/matchService';
import MatchCard from './MatchCard';
import MatchModeToggle, { MatchMode } from './MatchModeToggle';
import MatchFilters, { FilterState } from './MatchFilters';
import MatchSortDropdown, { SortOption } from './MatchSortDropdown';
import EmptyMatchState from './EmptyMatchState';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { useMatches } from '../../context/MatchesContext';
import { Match } from '../../services/mockMatchData';

export default function MatchResultsPage() {
  const { isDark } = useTheme();
  const colors = isDark ? themeColors.dark : themeColors.light;
  const navigate = useNavigate();

  // Use cached matches from context
  const { state: matchesState, fetchMatches } = useMatches();

  const [mode, setMode] = useState<MatchMode>(matchesState.mode);
  const [filters, setFilters] = useState<FilterState>({
    departments: [],
    locations: [],
    min_score: 0,  // Not used anymore - mode controls this
    experience_levels: [],
    usOnly: true,  // Default to US only
  });
  const [sortBy, setSortBy] = useState<SortOption>('score_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const matchesPerPage = 10;

  // Get matches/loading/error from context
  const matches = matchesState.matches;
  const loading = matchesState.loading;
  const error = matchesState.error;

  // Get score range based on mode
  const getScoreRange = (mode: MatchMode): { min: number; max: number } => {
    switch (mode) {
      case 'best_fit':
        return { min: 0.90, max: 1.0 };
      case 'stretch':
        return { min: 0.70, max: 0.90 };
      case 'exploratory':
        return { min: 0, max: 0.70 };
      default:
        return { min: 0, max: 1.0 };
    }
  };

  // US locations/cities for filtering
  const US_LOCATION_PATTERNS = [
    // States
    'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut',
    'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa',
    'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan',
    'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire',
    'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio',
    'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota',
    'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia',
    'wisconsin', 'wyoming', 'dc', 'd.c.', 'district of columbia',
    // Common US cities
    'atlanta', 'austin', 'boston', 'charlotte', 'chicago', 'cleveland', 'dallas', 'denver',
    'detroit', 'houston', 'indianapolis', 'los angeles', 'miami', 'minneapolis', 'nashville',
    'new york', 'nyc', 'philadelphia', 'phoenix', 'pittsburgh', 'portland', 'san antonio',
    'san diego', 'san francisco', 'san jose', 'seattle', 'tampa', 'washington',
    // State abbreviations
    'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in',
    'ia', 'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv',
    'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn',
    'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy',
    // Keywords
    'united states', 'usa', 'u.s.', 'u.s.a',
  ];

  const isUSLocation = (location: string): boolean => {
    const lower = location.toLowerCase();
    return US_LOCATION_PATTERNS.some(pattern => lower.includes(pattern));
  };

  useEffect(() => {
    // Fetch matches using cached context - won't refetch if cache is valid
    fetchMatches(mode, filters);
  }, [mode, filters, fetchMatches]);

  // Filter matches
  const filteredMatches = useMemo(() => {
    const scoreRange = getScoreRange(mode);

    return matches.filter((match) => {
      // Filter by score range based on mode
      if (match.overall_score < scoreRange.min || match.overall_score >= scoreRange.max) {
        // Special case: exploratory shows everything below 70%, including 0
        if (mode !== 'exploratory' || match.overall_score >= scoreRange.max) {
          return false;
        }
      }

      // Filter by US only
      if (filters.usOnly && !isUSLocation(match.location)) {
        return false;
      }

      // Filter by departments
      if (filters.departments.length > 0 && !filters.departments.includes(match.department)) {
        return false;
      }

      // Filter by locations (additional filter on top of US only)
      if (filters.locations.length > 0 && !filters.locations.includes(match.location)) {
        return false;
      }

      // Filter by experience level (simple check - could be enhanced)
      if (filters.experience_levels.length > 0) {
        const matchExperience = match.experience_required || '';
        const hasMatchingExperience = filters.experience_levels.some(level => {
          return matchExperience.includes(level.split('-')[0]) ||
                 matchExperience.includes(level.split('+')[0]);
        });
        if (!hasMatchingExperience) {
          return false;
        }
      }
      return true;
    });
  }, [matches, filters, mode]);

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
    // Navigate to the role detail page
    navigate(`/role/${matchId}`);
  };

  const handleSave = async (matchId: string) => {
    const match = matches.find((item) => item.id === matchId);
    if (!match) return;
    try {
      await saveMatch(match, mode);
    } catch (err) {
      console.error('Failed to save match', err);
    }
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
    <div className="max-w-7xl mx-auto transition-colors duration-200">
      <h1
        className="text-4xl font-bold mb-2"
        style={{ color: colors.textPrimary }}
      >
        Match Results
      </h1>
      <p
        className="text-lg mb-6"
        style={{ color: colors.textMuted }}
      >
        Discover job opportunities matched to your skills and career goals
      </p>

      {/* Mode Toggle */}
      <MatchModeToggle mode={mode} onModeChange={handleModeChange} isDark={isDark} colors={colors} />

      {/* Filters and Sort */}
      <div className="mb-6">
        <MatchFilters filters={filters} onFiltersChange={handleFiltersChange} isDark={isDark} colors={colors} />
        <div className="mt-4">
          <MatchSortDropdown sortBy={sortBy} onSortChange={setSortBy} isDark={isDark} colors={colors} />
        </div>
      </div>

      {/* Results Count */}
      <div
        className="mb-4 text-sm"
        style={{ color: colors.textMuted }}
      >
        Showing {paginatedMatches.length} of {sortedMatches.length} matches
        {sortedMatches.length !== matches.length && (
          <span className="ml-2">
            (filtered from {matches.length} total)
          </span>
        )}
      </div>

      {/* Match Cards */}
      {loading ? (
        <div className="py-12 text-center" style={{ color: colors.textMuted }}>
          Loading matches...
        </div>
      ) : error ? (
        <div className="py-12 text-center" style={{ color: colors.textMuted }}>
          {error}
        </div>
      ) : paginatedMatches.length === 0 ? (
        <EmptyMatchState onResetFilters={handleResetFilters} isDark={isDark} colors={colors} />
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {paginatedMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onViewDetails={handleViewDetails}
                onSave={handleSave}
                isDark={isDark}
                colors={colors}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 font-semibold rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.cardBg,
                  color: colors.textPrimary,
                  border: `1px solid ${colors.border}`,
                }}
              >
                Previous
              </button>
              <span
                className="px-4 py-2 text-sm"
                style={{ color: colors.textMuted }}
              >
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 font-semibold rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.cardBg,
                  color: colors.textPrimary,
                  border: `1px solid ${colors.border}`,
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
}
