import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveMatch } from '../../services/matchService';
import MatchCard from './MatchCard';
import MatchFilters, { FilterState } from './MatchFilters';
import MatchSortDropdown, { SortOption } from './MatchSortDropdown';
import EmptyMatchState from './EmptyMatchState';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { useMatches } from '../../context/MatchesContext';
import { useToast } from '../../context/ToastContext';
import { useSkillsContext } from '../../context/SkillsContext';
import { useAdventureMode, getFantasyText } from '../../context/AdventureModeContext';

export default function MatchResultsPage() {
  const { theme, isDark, isGame } = useTheme();
  const colors = themeColors[theme];
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { state: adventureState, unlockAchievement, addXP, addGold } = useAdventureMode();
  const hasViewedMatches = useRef(false);

  // Check if user has uploaded a resume (has skills)
  const { skills } = useSkillsContext();
  const hasResume = skills.length > 0;

  // Use cached matches from context
  const { state: matchesState, fetchMatchesProgressive } = useMatches();

  const [filters, setFilters] = useState<FilterState>({
    departments: [],
    locations: [],
    min_score: 0,
    experience_levels: [],
    usOnly: true,  // Default to US only
  });
  const [sortBy, setSortBy] = useState<SortOption>('score_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const matchesPerPage = 10;

  // Get matches/loading/error from context
  const matches = matchesState.matches;
  const loading = matchesState.loading;
  const loadingMore = matchesState.loadingMore;
  const error = matchesState.error;

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
    // Only fetch matches if user has uploaded a resume
    if (hasResume && matches.length === 0 && !loading) {
      fetchMatchesProgressive();
    }
  }, [hasResume, fetchMatchesProgressive, matches.length, loading]);

  // Adventure Mode: Trigger "first_match" achievement when viewing matches
  useEffect(() => {
    if (adventureState.enabled && matches.length > 0 && !hasViewedMatches.current) {
      hasViewedMatches.current = true;
      unlockAchievement('first_match');
    }
  }, [matches, adventureState.enabled, unlockAchievement]);

  // Filter matches
  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
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
  }, [matches, filters]);

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
      await saveMatch(match, 'best_fit');  // Default mode for saved matches
      showToast(
        adventureState.enabled ? 'Quest marked for greatness!' : 'Match saved successfully!',
        'success'
      );
      // Adventure Mode: Grant XP and unlock achievement
      if (adventureState.enabled) {
        addXP(25, 'Saved a role');
        addGold(10, 'Saved a role');
        unlockAchievement('save_role');
      }
    } catch (err) {
      console.error('Failed to save match', err);
      showToast('Failed to save match', 'error');
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

  // Show upload resume prompt if no skills
  if (!hasResume) {
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

        <div
          className="rounded-lg p-12 text-center"
          style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}
        >
          <div className="mb-6">
            <svg
              className="w-20 h-20 mx-auto mb-4"
              fill="none"
              stroke={colors.textMuted}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h2
              className="text-2xl font-semibold mb-2"
              style={{ color: colors.textPrimary }}
            >
              Upload Your Resume to Get Started
            </h2>
            <p
              className="text-base max-w-md mx-auto mb-6"
              style={{ color: colors.textMuted }}
            >
              We need to understand your skills and experience to find the best job matches for you.
              Upload your resume and we'll analyze it to provide personalized recommendations.
            </p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-3 font-semibold rounded-sm transition-colors"
            style={{
              backgroundColor: '#FFE600',
              color: '#000',
            }}
          >
            Go to My Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="max-w-7xl mx-auto transition-colors duration-200"
      style={{ fontFamily: isGame ? "'Spectral', serif" : 'inherit' }}
    >
      <h1
        className="text-4xl font-bold mb-2"
        style={{
          color: colors.textPrimary,
          fontFamily: isGame ? "'Cinzel', serif" : 'inherit',
          textShadow: isGame ? '0 0 20px rgba(255, 230, 0, 0.2)' : 'none',
        }}
      >
        {getFantasyText('Role Matches', adventureState.enabled)}
      </h1>
      <p
        className="text-lg mb-6"
        style={{ color: colors.textMuted }}
      >
        {adventureState.enabled
          ? 'Discover quests matched to your abilities and destiny'
          : 'Discover job opportunities matched to your skills and career goals'}
      </p>

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
      {loading && matches.length === 0 ? (
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
              />
            ))}
          </div>

          {/* Loading more indicator */}
          {loadingMore && (
            <div className="py-4 text-center" style={{ color: colors.accent }}>
              Loading more matches... ({matches.length} loaded)
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 font-semibold rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.1)' : colors.cardBg,
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
                  backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.1)' : colors.cardBg,
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
