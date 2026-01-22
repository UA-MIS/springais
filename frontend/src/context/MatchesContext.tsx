import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Match } from '../services/mockMatchData';
import { getMatches, MatchFilters, MatchMode } from '../services/matchService';

interface MatchesState {
  matches: Match[];
  loading: boolean;
  error: string | null;
  mode: MatchMode;
  filters: MatchFilters;
  lastFetchTime: number | null;
}

interface MatchesContextType {
  state: MatchesState;
  fetchMatches: (mode: MatchMode, filters: MatchFilters, forceRefresh?: boolean) => Promise<void>;
  setMode: (mode: MatchMode) => void;
  setFilters: (filters: MatchFilters) => void;
  clearCache: () => void;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

const defaultState: MatchesState = {
  matches: [],
  loading: false,
  error: null,
  mode: 'best_fit',
  filters: {},
  lastFetchTime: null,
};

const MatchesContext = createContext<MatchesContextType | undefined>(undefined);

export function MatchesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MatchesState>(defaultState);

  const fetchMatches = useCallback(async (
    mode: MatchMode,
    filters: MatchFilters,
    forceRefresh = false
  ) => {
    // Check if we have cached data that's still valid
    const now = Date.now();
    const cacheValid = state.lastFetchTime &&
      (now - state.lastFetchTime) < CACHE_TTL_MS &&
      state.mode === mode &&
      JSON.stringify(state.filters) === JSON.stringify(filters);

    if (cacheValid && !forceRefresh && state.matches.length > 0) {
      // Use cached data
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await getMatches(mode, filters);
      setState(prev => ({
        ...prev,
        matches: result.matches,
        loading: false,
        mode,
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
  }, [state.lastFetchTime, state.mode, state.filters, state.matches.length]);

  const setMode = useCallback((mode: MatchMode) => {
    setState(prev => ({ ...prev, mode }));
  }, []);

  const setFilters = useCallback((filters: MatchFilters) => {
    setState(prev => ({ ...prev, filters }));
  }, []);

  const clearCache = useCallback(() => {
    setState(prev => ({ ...prev, lastFetchTime: null }));
  }, []);

  return (
    <MatchesContext.Provider value={{ state, fetchMatches, setMode, setFilters, clearCache }}>
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
