/**
 * Roadmap Context - Central state management for the roadmap viewer
 *
 * Manages:
 * - Current roadmap data and ID
 * - Progress tracking (milestone completion, extras)
 * - Edit mode and history
 * - UI state (active tab, chat visibility)
 * - Chat messages
 */

import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import {
  RoadmapResponse,
  RoadmapProgressData,
  RoadmapExtra,
  RoadmapEdit,
  MilestoneProgress,
  getSavedRoadmap,
  getRoadmapProgress,
  toggleMilestone as toggleMilestoneApi,
  updateMilestoneNotes as updateMilestoneNotesApi,
  addExtra as addExtraApi,
  deleteExtra as deleteExtraApi,
  getEditHistory,
  updateEditMode as updateEditModeApi,
  requestAIEdit as requestAIEditApi,
  applyAIEdit as applyAIEditApi,
  enhancedChat,
} from '../services/roadmapService';

// ============================================
// Types
// ============================================

export type EditMode = 'view' | 'ai_edit' | 'manual_edit';
export type TabId = 'overview' | 'insights' | string; // string for phase-{id}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  modelUsed?: string;
}

export interface RoadmapState {
  // Core data
  roadmap: RoadmapResponse | null;
  roadmapId: string | null;
  title: string;

  // Progress
  milestoneProgress: Record<string, MilestoneProgress>;
  extras: RoadmapExtra[];
  extrasByPhase: Record<string, RoadmapExtra[]>;
  overallProgress: number;
  completedCount: number;
  totalCount: number;
  extrasCount: number;

  // Edit mode
  editMode: EditMode;
  hasManualEdits: boolean;
  editHistory: RoadmapEdit[];
  pendingAIEdit: {
    summary: string;
    changes: Array<{ type: string; element_id: string; description: string }>;
    preview: RoadmapResponse | null;
  } | null;

  // UI state
  activeTab: TabId;
  expandedMilestones: Set<string>;
  chatVisible: boolean;
  chatMessages: ChatMessage[];

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  chatLoading: boolean;
  aiEditLoading: boolean;
  error: string | null;
}

type RoadmapAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_ROADMAP'; payload: { roadmap: RoadmapResponse; id: string; title: string } }
  | { type: 'LOAD_PROGRESS'; payload: RoadmapProgressData }
  | { type: 'UPDATE_MILESTONE_PROGRESS'; payload: { milestoneId: string; progress: MilestoneProgress; overallProgress: number; completedCount: number } }
  | { type: 'ADD_EXTRA'; payload: RoadmapExtra }
  | { type: 'REMOVE_EXTRA'; payload: string }
  | { type: 'SET_EDIT_MODE'; payload: EditMode }
  | { type: 'SET_HAS_MANUAL_EDITS'; payload: boolean }
  | { type: 'LOAD_EDIT_HISTORY'; payload: { edits: RoadmapEdit[]; hasManualEdits: boolean; editMode: EditMode } }
  | { type: 'SET_PENDING_AI_EDIT'; payload: RoadmapState['pendingAIEdit'] }
  | { type: 'APPLY_AI_EDIT'; payload: RoadmapResponse }
  | { type: 'SET_ACTIVE_TAB'; payload: TabId }
  | { type: 'TOGGLE_MILESTONE_EXPANDED'; payload: string }
  | { type: 'SET_CHAT_VISIBLE'; payload: boolean }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_CHAT_LOADING'; payload: boolean }
  | { type: 'SET_AI_EDIT_LOADING'; payload: boolean }
  | { type: 'CLEAR_STATE' };

// ============================================
// Initial State
// ============================================

const initialState: RoadmapState = {
  roadmap: null,
  roadmapId: null,
  title: '',
  milestoneProgress: {},
  extras: [],
  extrasByPhase: {},
  overallProgress: 0,
  completedCount: 0,
  totalCount: 0,
  extrasCount: 0,
  editMode: 'view',
  hasManualEdits: false,
  editHistory: [],
  pendingAIEdit: null,
  activeTab: 'overview',
  expandedMilestones: new Set(),
  chatVisible: true, // Assistant visible by default
  chatMessages: [],
  isLoading: false,
  isSaving: false,
  chatLoading: false,
  aiEditLoading: false,
  error: null,
};

// ============================================
// Reducer
// ============================================

function roadmapReducer(state: RoadmapState, action: RoadmapAction): RoadmapState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'LOAD_ROADMAP':
      return {
        ...state,
        roadmap: action.payload.roadmap,
        roadmapId: action.payload.id,
        title: action.payload.title,
        totalCount: action.payload.roadmap.phases.reduce((sum, p) => sum + p.milestones.length, 0),
        isLoading: false,
      };

    case 'LOAD_PROGRESS':
      return {
        ...state,
        milestoneProgress: action.payload.milestones,
        extras: action.payload.extras,
        extrasByPhase: action.payload.extras_by_phase,
        overallProgress: action.payload.overall_progress,
        completedCount: action.payload.completed_count,
        totalCount: action.payload.total_count,
        extrasCount: action.payload.extras_count,
      };

    case 'UPDATE_MILESTONE_PROGRESS':
      return {
        ...state,
        milestoneProgress: {
          ...state.milestoneProgress,
          [action.payload.milestoneId]: action.payload.progress,
        },
        overallProgress: action.payload.overallProgress,
        completedCount: action.payload.completedCount,
      };

    case 'ADD_EXTRA': {
      const newExtras = [action.payload, ...state.extras];
      const newExtrasByPhase = { ...state.extrasByPhase };
      if (!newExtrasByPhase[action.payload.phase_id]) {
        newExtrasByPhase[action.payload.phase_id] = [];
      }
      newExtrasByPhase[action.payload.phase_id] = [action.payload, ...newExtrasByPhase[action.payload.phase_id]];
      return {
        ...state,
        extras: newExtras,
        extrasByPhase: newExtrasByPhase,
        extrasCount: state.extrasCount + 1,
      };
    }

    case 'REMOVE_EXTRA': {
      const extraToRemove = state.extras.find(e => e.id === action.payload);
      const newExtras = state.extras.filter(e => e.id !== action.payload);
      const newExtrasByPhase = { ...state.extrasByPhase };
      if (extraToRemove && newExtrasByPhase[extraToRemove.phase_id]) {
        newExtrasByPhase[extraToRemove.phase_id] = newExtrasByPhase[extraToRemove.phase_id].filter(
          e => e.id !== action.payload
        );
      }
      return {
        ...state,
        extras: newExtras,
        extrasByPhase: newExtrasByPhase,
        extrasCount: state.extrasCount - 1,
      };
    }

    case 'SET_EDIT_MODE':
      return { ...state, editMode: action.payload };

    case 'SET_HAS_MANUAL_EDITS':
      return { ...state, hasManualEdits: action.payload };

    case 'LOAD_EDIT_HISTORY':
      return {
        ...state,
        editHistory: action.payload.edits,
        hasManualEdits: action.payload.hasManualEdits,
        // Always start in view mode when loading a roadmap
        editMode: 'view',
      };

    case 'SET_PENDING_AI_EDIT':
      return { ...state, pendingAIEdit: action.payload, aiEditLoading: false };

    case 'APPLY_AI_EDIT':
      // Safety check for valid roadmap data
      if (!action.payload || !action.payload.phases) {
        return { ...state, pendingAIEdit: null, isSaving: false };
      }
      return {
        ...state,
        roadmap: action.payload,
        pendingAIEdit: null,
        totalCount: action.payload.phases.reduce((sum: number, p: { milestones: unknown[] }) => sum + p.milestones.length, 0),
      };

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };

    case 'TOGGLE_MILESTONE_EXPANDED': {
      const newExpanded = new Set(state.expandedMilestones);
      if (newExpanded.has(action.payload)) {
        newExpanded.delete(action.payload);
      } else {
        newExpanded.add(action.payload);
      }
      return { ...state, expandedMilestones: newExpanded };
    }

    case 'SET_CHAT_VISIBLE':
      return { ...state, chatVisible: action.payload };

    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload],
      };

    case 'SET_CHAT_LOADING':
      return { ...state, chatLoading: action.payload };

    case 'SET_AI_EDIT_LOADING':
      return { ...state, aiEditLoading: action.payload };

    case 'CLEAR_STATE':
      return initialState;

    default:
      return state;
  }
}

// ============================================
// Context
// ============================================

interface RoadmapContextValue {
  state: RoadmapState;
  actions: {
    loadRoadmap: (id: string) => Promise<void>;
    toggleMilestone: (milestoneId: string, phaseId: string) => Promise<void>;
    updateMilestoneNotes: (milestoneId: string, phaseId: string, notes: string) => Promise<void>;
    addExtra: (phaseId: string, title: string, description: string | null, category: string) => Promise<void>;
    deleteExtra: (extraId: string) => Promise<void>;
    setEditMode: (mode: EditMode) => Promise<void>;
    requestAIEdit: (instructions: string, editType?: string) => Promise<void>;
    applyPendingAIEdit: () => Promise<void>;
    cancelPendingAIEdit: () => void;
    setActiveTab: (tab: TabId) => void;
    toggleMilestoneExpanded: (milestoneId: string) => void;
    toggleChat: () => void;
    sendChatMessage: (message: string) => Promise<void>;
    clearState: () => void;
  };
  computed: {
    currentPhase: { id: string; name: string; index: number } | null;
    nextMilestone: { id: string; title: string; phaseId: string } | null;
    phaseProgress: (phaseId: string) => { completed: number; total: number; percentage: number };
  };
}

const RoadmapContext = createContext<RoadmapContextValue | null>(null);

// ============================================
// Provider
// ============================================

export function RoadmapProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(roadmapReducer, initialState);

  // Load roadmap and progress data
  const loadRoadmap = useCallback(async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const [detail, progress, editHistory] = await Promise.all([
        getSavedRoadmap(id),
        getRoadmapProgress(id),
        getEditHistory(id),
      ]);

      dispatch({
        type: 'LOAD_ROADMAP',
        payload: { roadmap: detail.roadmap, id: detail.id, title: detail.title },
      });
      dispatch({ type: 'LOAD_PROGRESS', payload: progress });
      dispatch({ type: 'LOAD_EDIT_HISTORY', payload: {
        edits: editHistory.edits,
        hasManualEdits: editHistory.has_manual_edits,
        editMode: editHistory.edit_mode,
      } });
    } catch (error) {
      console.error('Failed to load roadmap:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load roadmap' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Toggle milestone completion
  const toggleMilestone = useCallback(async (milestoneId: string, phaseId: string) => {
    if (!state.roadmapId) return;

    // Optimistic update
    const currentProgress = state.milestoneProgress[milestoneId];
    const newStatus = currentProgress?.status === 'completed' ? 'not_started' : 'completed';
    const optimisticProgress: MilestoneProgress = {
      status: newStatus as 'completed' | 'not_started',
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      notes: currentProgress?.notes || null,
      phase_id: phaseId,
    };

    dispatch({
      type: 'UPDATE_MILESTONE_PROGRESS',
      payload: {
        milestoneId,
        progress: optimisticProgress,
        overallProgress: state.overallProgress + (newStatus === 'completed' ? (100 / state.totalCount) : -(100 / state.totalCount)),
        completedCount: state.completedCount + (newStatus === 'completed' ? 1 : -1),
      },
    });

    try {
      const result = await toggleMilestoneApi(state.roadmapId, milestoneId, phaseId);
      dispatch({
        type: 'UPDATE_MILESTONE_PROGRESS',
        payload: {
          milestoneId,
          progress: {
            status: result.status as 'completed' | 'not_started',
            completed_at: result.completed_at,
            notes: currentProgress?.notes || null,
            phase_id: phaseId,
          },
          overallProgress: result.overall_progress,
          completedCount: result.completed_count,
        },
      });
    } catch (error) {
      // Revert optimistic update
      dispatch({
        type: 'UPDATE_MILESTONE_PROGRESS',
        payload: {
          milestoneId,
          progress: currentProgress || { status: 'not_started', completed_at: null, notes: null, phase_id: phaseId },
          overallProgress: state.overallProgress,
          completedCount: state.completedCount,
        },
      });
      console.error('Failed to toggle milestone:', error);
    }
  }, [state.roadmapId, state.milestoneProgress, state.overallProgress, state.completedCount, state.totalCount]);

  // Update milestone notes
  const updateMilestoneNotes = useCallback(async (milestoneId: string, phaseId: string, notes: string) => {
    if (!state.roadmapId) return;

    try {
      await updateMilestoneNotesApi(state.roadmapId, milestoneId, phaseId, notes);
      const currentProgress = state.milestoneProgress[milestoneId];
      dispatch({
        type: 'UPDATE_MILESTONE_PROGRESS',
        payload: {
          milestoneId,
          progress: {
            ...currentProgress,
            notes,
            phase_id: phaseId,
          } as MilestoneProgress,
          overallProgress: state.overallProgress,
          completedCount: state.completedCount,
        },
      });
    } catch (error) {
      console.error('Failed to update milestone notes:', error);
    }
  }, [state.roadmapId, state.milestoneProgress, state.overallProgress, state.completedCount]);

  // Add extra achievement
  const addExtra = useCallback(async (phaseId: string, title: string, description: string | null, category: string) => {
    if (!state.roadmapId) return;

    try {
      const extra = await addExtraApi(state.roadmapId, phaseId, title, description, category);
      dispatch({ type: 'ADD_EXTRA', payload: extra });
    } catch (error) {
      console.error('Failed to add extra:', error);
    }
  }, [state.roadmapId]);

  // Delete extra achievement
  const deleteExtra = useCallback(async (extraId: string) => {
    if (!state.roadmapId) return;

    try {
      await deleteExtraApi(state.roadmapId, extraId);
      dispatch({ type: 'REMOVE_EXTRA', payload: extraId });
    } catch (error) {
      console.error('Failed to delete extra:', error);
    }
  }, [state.roadmapId]);

  // Set edit mode
  const setEditMode = useCallback(async (mode: EditMode) => {
    if (!state.roadmapId) return;

    try {
      await updateEditModeApi(state.roadmapId, mode);
      dispatch({ type: 'SET_EDIT_MODE', payload: mode });
    } catch (error) {
      console.error('Failed to set edit mode:', error);
    }
  }, [state.roadmapId]);

  // Request AI edit
  const requestAIEdit = useCallback(async (instructions: string, editType: string = 'timeline') => {
    if (!state.roadmapId) return;

    dispatch({ type: 'SET_AI_EDIT_LOADING', payload: true });

    try {
      const result = await requestAIEditApi(state.roadmapId, instructions, editType);

      // Validate the preview has required structure
      if (!result.preview || !result.preview.phases || !Array.isArray(result.preview.phases)) {
        console.error('AI edit returned invalid preview structure:', result);
        dispatch({ type: 'SET_AI_EDIT_LOADING', payload: false });
        // Show error in UI by setting a null payload with error message
        return;
      }

      dispatch({
        type: 'SET_PENDING_AI_EDIT',
        payload: {
          summary: result.summary || 'Changes generated',
          changes: result.changes || [],
          preview: result.preview,
        },
      });
    } catch (error) {
      console.error('Failed to request AI edit:', error);
      dispatch({ type: 'SET_AI_EDIT_LOADING', payload: false });
    }
  }, [state.roadmapId]);

  // Apply pending AI edit
  const applyPendingAIEdit = useCallback(async () => {
    if (!state.roadmapId || !state.pendingAIEdit?.preview) {
      console.error('Cannot apply AI edit: missing roadmapId or preview');
      return;
    }

    // Validate preview has required structure
    const preview = state.pendingAIEdit.preview;
    if (!preview.phases || !Array.isArray(preview.phases)) {
      console.error('Cannot apply AI edit: preview missing phases array');
      dispatch({ type: 'SET_PENDING_AI_EDIT', payload: null });
      return;
    }

    dispatch({ type: 'SET_SAVING', payload: true });

    try {
      await applyAIEditApi(state.roadmapId, preview);
      dispatch({ type: 'APPLY_AI_EDIT', payload: preview });
      dispatch({ type: 'SET_SAVING', payload: false });
      dispatch({ type: 'SET_EDIT_MODE', payload: 'view' });
    } catch (error) {
      console.error('Failed to apply AI edit:', error);
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state.roadmapId, state.pendingAIEdit]);

  // Cancel pending AI edit
  const cancelPendingAIEdit = useCallback(() => {
    dispatch({ type: 'SET_PENDING_AI_EDIT', payload: null });
  }, []);

  // Set active tab
  const setActiveTab = useCallback((tab: TabId) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  }, []);

  // Toggle milestone expanded
  const toggleMilestoneExpanded = useCallback((milestoneId: string) => {
    dispatch({ type: 'TOGGLE_MILESTONE_EXPANDED', payload: milestoneId });
  }, []);

  // Toggle chat
  const toggleChat = useCallback(() => {
    dispatch({ type: 'SET_CHAT_VISIBLE', payload: !state.chatVisible });
  }, [state.chatVisible]);

  // Send chat message
  const sendChatMessage = useCallback(async (message: string) => {
    if (!state.roadmapId) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_CHAT_LOADING', payload: true });

    try {
      // Determine current phase ID from active tab
      const currentPhaseId = state.activeTab.startsWith('phase-')
        ? state.activeTab.replace('phase-', '')
        : null;

      // Build conversation history from previous messages (last 10 messages max)
      const history = state.chatMessages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await enhancedChat(
        state.roadmapId,
        message,
        false, // Always use fast model
        state.activeTab,
        currentPhaseId,
        history
      );

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: assistantMessage });
    } catch (error) {
      console.error('Failed to send chat message:', error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: 'Sorry, I had trouble responding. Please try again.',
        timestamp: new Date(),
      };
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_CHAT_LOADING', payload: false });
    }
  }, [state.roadmapId, state.activeTab]);

  // Clear state
  const clearState = useCallback(() => {
    dispatch({ type: 'CLEAR_STATE' });
  }, []);

  // Computed values
  const currentPhase = state.roadmap
    ? (() => {
        // Find the first non-completed phase
        for (let i = 0; i < state.roadmap.phases.length; i++) {
          const phase = state.roadmap.phases[i];
          const phaseProgress = state.milestoneProgress;
          const completedInPhase = phase.milestones.filter(
            m => phaseProgress[m.id]?.status === 'completed'
          ).length;

          if (completedInPhase < phase.milestones.length) {
            return { id: phase.id, name: phase.name, index: i };
          }
        }
        // All complete
        const lastPhase = state.roadmap.phases[state.roadmap.phases.length - 1];
        return lastPhase
          ? { id: lastPhase.id, name: lastPhase.name, index: state.roadmap.phases.length - 1 }
          : null;
      })()
    : null;

  const nextMilestone = state.roadmap
    ? (() => {
        for (const phase of state.roadmap.phases) {
          for (const milestone of phase.milestones) {
            if (state.milestoneProgress[milestone.id]?.status !== 'completed') {
              return { id: milestone.id, title: milestone.title, phaseId: phase.id };
            }
          }
        }
        return null;
      })()
    : null;

  const phaseProgress = useCallback((phaseId: string) => {
    const phase = state.roadmap?.phases.find(p => p.id === phaseId);
    if (!phase) return { completed: 0, total: 0, percentage: 0 };

    const total = phase.milestones.length;
    const completed = phase.milestones.filter(
      m => state.milestoneProgress[m.id]?.status === 'completed'
    ).length;

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [state.roadmap, state.milestoneProgress]);

  const value: RoadmapContextValue = {
    state,
    actions: {
      loadRoadmap,
      toggleMilestone,
      updateMilestoneNotes,
      addExtra,
      deleteExtra,
      setEditMode,
      requestAIEdit,
      applyPendingAIEdit,
      cancelPendingAIEdit,
      setActiveTab,
      toggleMilestoneExpanded,
      toggleChat,
      sendChatMessage,
      clearState,
    },
    computed: {
      currentPhase,
      nextMilestone,
      phaseProgress,
    },
  };

  return (
    <RoadmapContext.Provider value={value}>
      {children}
    </RoadmapContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useRoadmapContext() {
  const context = useContext(RoadmapContext);
  if (!context) {
    throw new Error('useRoadmapContext must be used within a RoadmapProvider');
  }
  return context;
}
