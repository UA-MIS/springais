/**
 * useRoadmap hook - Convenience hook wrapping the RoadmapContext
 *
 * Provides:
 * - All context state and actions
 * - Additional computed values for navigation
 * - Helper functions for common operations
 */

import { useCallback, useMemo } from 'react';
import { useRoadmapContext, TabId } from '../context/RoadmapContext';

export function useRoadmap() {
  const { state, actions, computed } = useRoadmapContext();

  // Navigation helpers
  const goToNextPhase = useCallback(() => {
    if (!state.roadmap) return;

    const currentIndex = state.roadmap.phases.findIndex(
      p => `phase-${p.id}` === state.activeTab
    );

    if (currentIndex >= 0 && currentIndex < state.roadmap.phases.length - 1) {
      const nextPhase = state.roadmap.phases[currentIndex + 1];
      actions.setActiveTab(`phase-${nextPhase.id}` as TabId);
    }
  }, [state.roadmap, state.activeTab, actions]);

  const goToPreviousPhase = useCallback(() => {
    if (!state.roadmap) return;

    const currentIndex = state.roadmap.phases.findIndex(
      p => `phase-${p.id}` === state.activeTab
    );

    if (currentIndex > 0) {
      const prevPhase = state.roadmap.phases[currentIndex - 1];
      actions.setActiveTab(`phase-${prevPhase.id}` as TabId);
    }
  }, [state.roadmap, state.activeTab, actions]);

  const goToPhase = useCallback((phaseId: string) => {
    actions.setActiveTab(`phase-${phaseId}` as TabId);
  }, [actions]);

  // Tab information
  const tabs = useMemo(() => {
    if (!state.roadmap) return [];

    const phaseTabs = state.roadmap.phases.map((phase, index) => ({
      id: `phase-${phase.id}` as TabId,
      label: `Phase ${index + 1}`,
      name: phase.name,
      phaseId: phase.id,
      isPhaseTab: true,
      progress: computed.phaseProgress(phase.id),
    }));

    return [
      { id: 'overview' as TabId, label: 'Overview', name: 'Overview', isPhaseTab: false },
      { id: 'insights' as TabId, label: 'Insights', name: 'Quick Wins & Challenges', isPhaseTab: false },
      ...phaseTabs,
    ];
  }, [state.roadmap, computed]);

  // Current tab info
  const currentTab = useMemo(() => {
    return tabs.find(t => t.id === state.activeTab) || tabs[0];
  }, [tabs, state.activeTab]);

  // Check if we're on a phase tab
  const isOnPhaseTab = useMemo(() => {
    return state.activeTab.startsWith('phase-');
  }, [state.activeTab]);

  // Get current phase data if on a phase tab
  const currentPhaseData = useMemo(() => {
    if (!state.roadmap || !isOnPhaseTab) return null;

    const phaseId = state.activeTab.replace('phase-', '');
    return state.roadmap.phases.find(p => p.id === phaseId) || null;
  }, [state.roadmap, state.activeTab, isOnPhaseTab]);

  // Get extras for current phase
  const currentPhaseExtras = useMemo(() => {
    if (!currentPhaseData) return [];
    return state.extrasByPhase[currentPhaseData.id] || [];
  }, [currentPhaseData, state.extrasByPhase]);


  // Milestone helpers
  const isMilestoneCompleted = useCallback((milestoneId: string) => {
    return state.milestoneProgress[milestoneId]?.status === 'completed';
  }, [state.milestoneProgress]);

  const getMilestoneProgress = useCallback((milestoneId: string) => {
    return state.milestoneProgress[milestoneId] || null;
  }, [state.milestoneProgress]);

  // Progress celebration thresholds
  const celebrationMilestone = useMemo(() => {
    const thresholds = [25, 50, 75, 100];
    for (const threshold of thresholds) {
      if (state.overallProgress >= threshold && state.overallProgress < threshold + 5) {
        return threshold;
      }
    }
    return null;
  }, [state.overallProgress]);

  // Edit mode helpers
  const canEdit = useMemo(() => {
    return state.editMode !== 'view';
  }, [state.editMode]);

  const isAIEditing = useMemo(() => {
    return state.editMode === 'ai_edit';
  }, [state.editMode]);

  const isManualEditing = useMemo(() => {
    return state.editMode === 'manual_edit';
  }, [state.editMode]);

  return {
    // Core state
    ...state,

    // Actions
    ...actions,

    // Computed from context
    ...computed,

    // Navigation
    goToNextPhase,
    goToPreviousPhase,
    goToPhase,

    // Tab info
    tabs,
    currentTab,
    isOnPhaseTab,
    currentPhaseData,
    currentPhaseExtras,

    // Milestones
    isMilestoneCompleted,
    getMilestoneProgress,

    // Progress
    celebrationMilestone,

    // Edit mode
    canEdit,
    isAIEditing,
    isManualEditing,
  };
}
