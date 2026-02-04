import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  getMyJobs,
  browseJobs,
  saveJobToMyJobs,
  removeFromMyJobs,
  getCandidateInterest,
  HMSavedJob,
  JobBrowseItem,
  CandidateInterestResponse,
  JobBrowseFilters,
} from '../services/hiringManagerService';

interface HMState {
  myJobs: HMSavedJob[];
  browseResults: JobBrowseItem[];
  browseTotalCount: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
}

interface HMContextType {
  state: HMState;
  isHiringManager: boolean;
  fetchMyJobs: () => Promise<void>;
  fetchBrowseJobs: (filters?: JobBrowseFilters) => Promise<void>;
  saveJob: (jobPostingId: string, notes?: string) => Promise<void>;
  unsaveJob: (savedJobId: string) => Promise<void>;
  getInterest: (jobPostingId: string) => Promise<CandidateInterestResponse>;
}

const defaultState: HMState = {
  myJobs: [],
  browseResults: [],
  browseTotalCount: 0,
  currentPage: 1,
  loading: false,
  error: null,
};

const HMContext = createContext<HMContextType | undefined>(undefined);

export function HiringManagerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<HMState>(defaultState);

  const isHiringManager = user?.account_type === 'hiring_manager';

  const fetchMyJobs = useCallback(async () => {
    if (!isHiringManager) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await getMyJobs();
      setState(prev => ({
        ...prev,
        myJobs: response.jobs,
        loading: false,
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to load saved jobs',
      }));
    }
  }, [isHiringManager]);

  const fetchBrowseJobs = useCallback(async (filters: JobBrowseFilters = {}) => {
    if (!isHiringManager) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await browseJobs(filters);
      setState(prev => ({
        ...prev,
        browseResults: response.jobs,
        browseTotalCount: response.total_count,
        currentPage: response.page,
        loading: false,
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to browse jobs',
      }));
    }
  }, [isHiringManager]);

  const saveJob = useCallback(async (jobPostingId: string, notes?: string) => {
    if (!isHiringManager) return;

    try {
      const saved = await saveJobToMyJobs(jobPostingId, notes);
      setState(prev => ({
        ...prev,
        myJobs: [saved, ...prev.myJobs],
        browseResults: prev.browseResults.map(j =>
          j.id === jobPostingId ? { ...j, is_saved: true } : j
        ),
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to save job',
      }));
      throw err;
    }
  }, [isHiringManager]);

  const unsaveJob = useCallback(async (savedJobId: string) => {
    if (!isHiringManager) return;

    const jobToRemove = state.myJobs.find(j => j.id === savedJobId);

    try {
      await removeFromMyJobs(savedJobId);
      setState(prev => ({
        ...prev,
        myJobs: prev.myJobs.filter(j => j.id !== savedJobId),
        browseResults: prev.browseResults.map(j =>
          j.id === jobToRemove?.job_posting_id ? { ...j, is_saved: false } : j
        ),
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to remove job',
      }));
      throw err;
    }
  }, [isHiringManager, state.myJobs]);

  const getInterest = useCallback(async (jobPostingId: string) => {
    if (!isHiringManager) {
      throw new Error('Not a hiring manager account');
    }
    return await getCandidateInterest(jobPostingId);
  }, [isHiringManager]);

  // Load my jobs on mount if HM
  useEffect(() => {
    if (isHiringManager) {
      fetchMyJobs();
    }
  }, [isHiringManager, fetchMyJobs]);

  return (
    <HMContext.Provider
      value={{
        state,
        isHiringManager,
        fetchMyJobs,
        fetchBrowseJobs,
        saveJob,
        unsaveJob,
        getInterest,
      }}
    >
      {children}
    </HMContext.Provider>
  );
}

export function useHiringManager() {
  const context = useContext(HMContext);
  if (!context) {
    throw new Error('useHiringManager must be used within HiringManagerProvider');
  }
  return context;
}
