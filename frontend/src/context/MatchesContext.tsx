import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { Match } from '../services/mockMatchData';
import { getMatches, getMatchesBatch, MatchFilters } from '../services/matchService';

interface MatchesState {
  matches: Match[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  filters: MatchFilters;
  lastFetchTime: number | null;
  totalCount: number;
  fullyLoaded: boolean;
}

interface MatchesContextType {
  state: MatchesState;
  fetchMatches: (filters: MatchFilters, forceRefresh?: boolean) => Promise<void>;
  fetchMatchesProgressive: () => Promise<void>;
  setFilters: (filters: MatchFilters) => void;
  clearCache: () => void;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache
const BATCH_SIZE = 10;

const defaultState: MatchesState = {
  matches: [],
  loading: false,
  loadingMore: false,
  error: null,
  filters: {},
  lastFetchTime: null,
  totalCount: 0,
  fullyLoaded: false,
};

const MatchesContext = createContext<MatchesContextType | undefined>(undefined);

export function MatchesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MatchesState>(defaultState);
  const fetchingRef = useRef(false);

  // Progressive fetch - loads matches in batches of 10
  const fetchMatchesProgressive = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      matches: [],
      fullyLoaded: false,
      totalCount: 0,
    }));

    let offset = 0;
    let total = 0;

    try {
      // Fetch batches until we have all matches
      while (true) {
        const result = await getMatchesBatch(BATCH_SIZE, offset);
        total = result.total;

        if (result.matches.length === 0) {
          // No more matches
          setState(prev => ({
            ...prev,
            loading: false,
            loadingMore: false,
            fullyLoaded: true,
            lastFetchTime: Date.now(),
          }));
          break;
        }

        // Append new matches
        setState(prev => ({
          ...prev,
          matches: [...prev.matches, ...result.matches],
          loading: false,
          loadingMore: offset + BATCH_SIZE < total,
          totalCount: total,
        }));

        offset += BATCH_SIZE;

        if (offset >= total) {
          // All matches loaded
          setState(prev => ({
            ...prev,
            loadingMore: false,
            fullyLoaded: true,
            lastFetchTime: Date.now(),
          }));
          break;
        }

        // Small delay between batches to let UI breathe
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        loadingMore: false,
        error: err.message || 'Failed to load matches',
      }));
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  const fetchMatches = useCallback(async (
    filters: MatchFilters,
    forceRefresh = false
  ) => {
    // Check if we have cached data that's still valid
    const now = Date.now();
    const cacheValid = state.lastFetchTime &&
      (now - state.lastFetchTime) < CACHE_TTL_MS &&
      JSON.stringify(state.filters) === JSON.stringify(filters);

    if (cacheValid && !forceRefresh && state.matches.length > 0) {
      // Use cached data
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await getMatches(filters);
      setState(prev => ({
        ...prev,
        matches: result.matches,
        loading: false,
        filters,
        lastFetchTime: Date.now(),
        totalCount: result.total,
        fullyLoaded: true,
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to load matches',
        matches: [],
      }));
    }
  }, [state.lastFetchTime, state.filters, state.matches.length]);

  const setFilters = useCallback((filters: MatchFilters) => {
    setState(prev => ({ ...prev, filters }));
  }, []);

  const clearCache = useCallback(() => {
    setState(prev => ({ ...prev, lastFetchTime: null, fullyLoaded: false }));
  }, []);

  return (
    <MatchesContext.Provider value={{ state, fetchMatches, fetchMatchesProgressive, setFilters, clearCache }}>
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
