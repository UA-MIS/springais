import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Match } from '../services/mockMatchData';
import { getMatches, MatchFilters } from '../services/matchService';

interface MatchesState {
  matches: Match[];
  loading: boolean;
  error: string | null;
  filters: MatchFilters;
  lastFetchTime: number | null;
}

interface MatchesContextType {
  state: MatchesState;
  fetchMatches: (filters: MatchFilters, forceRefresh?: boolean) => Promise<void>;
  setFilters: (filters: MatchFilters) => void;
  clearCache: () => void;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

const defaultState: MatchesState = {
  matches: [],
  loading: false,
  error: null,
  filters: {},
  lastFetchTime: null,
};

const MatchesContext = createContext<MatchesContextType | undefined>(undefined);

export function MatchesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MatchesState>(defaultState);

  const fetchMatches = useCallback(async (
    filters: MatchFilters,
    forceRefresh = false
  ) => {
    // Use functional setState to access current state without dependencies
    setState(prev => {
      // Check if we have cached data that's still valid
      const now = Date.now();
      const cacheValid = prev.lastFetchTime &&
        (now - prev.lastFetchTime) < CACHE_TTL_MS &&
        JSON.stringify(prev.filters) === JSON.stringify(filters);
  
      if (cacheValid && !forceRefresh && prev.matches.length > 0) {
        // Use cached data - don't fetch
        return prev; // No state update needed
      }
  
      // Start loading
      return { ...prev, loading: true, error: null };
    });
  
    // Check cache again after state update (using a ref would be better, but this works)
    // We'll do the actual fetch check in a second setState
    setState(prev => {
      const now = Date.now();
      const cacheValid = prev.lastFetchTime &&
        (now - prev.lastFetchTime) < CACHE_TTL_MS &&
        JSON.stringify(prev.filters) === JSON.stringify(filters);
  
      if (cacheValid && !forceRefresh && prev.matches.length > 0) {
        // Cache is valid, stop loading
        return { ...prev, loading: false };
      }
      return prev; // Keep loading state
    });
  
    // Now do the actual fetch
    try {
      const result = await getMatches(filters);
      setState(prev => ({
        ...prev,
        matches: result.matches,
        loading: false,
        filters,
        lastFetchTime: Date.now(),
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to load matches',
        matches: [],
      }));
    }
  }, []); // Empty deps - function is stable!

  const setFilters = useCallback((filters: MatchFilters) => {
    setState(prev => ({ ...prev, filters }));
  }, []);

  const clearCache = useCallback(() => {
    setState(prev => ({ ...prev, lastFetchTime: null }));
  }, []);

  return (
    <MatchesContext.Provider value={{ state, fetchMatches, setFilters, clearCache }}>
      {children}
    </MatchesContext.Provider>
  );
}

export function useMatches() {
  const context = useContext(MatchesContext);
  if (!context) {
    throw new Error('useMatches must be used within a MatchesProvider');
  }
  return context;
}
