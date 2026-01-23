import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { getSavedMatches, deleteSavedMatch, SavedMatch } from '../services/matchService';

interface SavedRolesState {
  savedRoles: SavedMatch[];
  loading: boolean;
  error: string | null;
}

interface SavedRolesContextType {
  state: SavedRolesState;
  fetchSavedRoles: () => Promise<void>;
  removeSavedRole: (matchId: string) => Promise<void>;
  refreshSavedRoles: () => Promise<void>;
}

const defaultState: SavedRolesState = {
  savedRoles: [],
  loading: false,
  error: null,
};

export const SavedRolesContext = createContext<SavedRolesContextType | undefined>(undefined);

export function SavedRolesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SavedRolesState>(defaultState);

  const fetchSavedRoles = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const matches = await getSavedMatches();
      setState(prev => ({
        ...prev,
        savedRoles: matches,
        loading: false,
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to load saved roles',
        savedRoles: [],
      }));
    }
  }, []);

  const removeSavedRole = useCallback(async (matchId: string) => {
    try {
      await deleteSavedMatch(matchId);
      setState(prev => ({
        ...prev,
        savedRoles: prev.savedRoles.filter(m => m.match_id !== matchId),
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to remove saved role',
      }));
      throw err;
    }
  }, []);

  const refreshSavedRoles = useCallback(async () => {
    await fetchSavedRoles();
  }, [fetchSavedRoles]);

  // Load saved roles on mount
  useEffect(() => {
    fetchSavedRoles();
  }, [fetchSavedRoles]);

  return (
    <SavedRolesContext.Provider
      value={{
        state,
        fetchSavedRoles,
        removeSavedRole,
        refreshSavedRoles,
      }}
    >
      {children}
    </SavedRolesContext.Provider>
  );
}

export function useSavedRoles() {
  const context = useContext(SavedRolesContext);
  // Return undefined if context is not available (instead of throwing)
  // This allows components to handle the absence of the provider gracefully
  return context;
}
