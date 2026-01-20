import { Match } from './mockMatchData';
import { MOCK_MATCHES_BEST_FIT, MOCK_MATCHES_STRETCH, MOCK_MATCHES_EXPLORATORY } from './mockMatchData';

export type MatchMode = 'best_fit' | 'stretch' | 'exploratory';

export interface MatchFilters {
  departments?: string[];
  locations?: string[];
  min_score?: number;
  experience_levels?: string[];
}

// For Step 2: Returns mock data
// In Step 3 (Block O), this will be replaced with actual API calls
export async function getMatches(
  mode: MatchMode,
  filters?: MatchFilters
): Promise<{ matches: Match[]; total: number }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  let matches: Match[] = [];
  switch (mode) {
    case 'best_fit':
      matches = MOCK_MATCHES_BEST_FIT;
      break;
    case 'stretch':
      matches = MOCK_MATCHES_STRETCH;
      break;
    case 'exploratory':
      matches = MOCK_MATCHES_EXPLORATORY;
      break;
  }

  // Apply filters (if provided)
  if (filters) {
    matches = matches.filter(match => {
      if (filters.departments && filters.departments.length > 0) {
        if (!filters.departments.includes(match.department)) return false;
      }
      if (filters.locations && filters.locations.length > 0) {
        if (!filters.locations.includes(match.location)) return false;
      }
      if (filters.min_score !== undefined) {
        if (match.overall_score < filters.min_score / 100) return false;
      }
      // Experience level filtering would go here
      return true;
    });
  }

  return {
    matches,
    total: matches.length
  };
}

// For Step 3: Will be implemented when connecting to Block E backend
export async function getMatchDetails(matchId: string): Promise<Match | null> {
  // TODO: Implement API call to get match details
  const allMatches = [...MOCK_MATCHES_BEST_FIT, ...MOCK_MATCHES_STRETCH, ...MOCK_MATCHES_EXPLORATORY];
  return allMatches.find(m => m.id === matchId) || null;
}

export async function saveMatch(userId: string, matchId: string): Promise<void> {
  // TODO: Implement API call to save match
  console.log('Saving match', matchId, 'for user', userId);
}
