/**
 * useCedricNarrator -- Monitors React Query loading states and provides
 * phased narration for long-running operations (Story 5.1).
 *
 * Architecture Section 9: Loading Narrator Architecture.
 * D-CA-003: Loading narrator hook.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { useAdventureMode } from '../../context/AdventureModeContext';
import { getCedricText, type MessageVariant } from './cedricMessages';
import type { AnimationState } from '../../context/cedricTypes';

export interface NarratorPhase {
  minTime: number;
  maxTime: number;
  dialogue: MessageVariant;
  avatarState: AnimationState;
  tip?: MessageVariant;
}

export interface NarratorConfig {
  phases: NarratorPhase[];
  queryKey: readonly unknown[];
  onComplete?: () => void;
}

export interface NarratorState {
  isLoading: boolean;
  currentPhase: NarratorPhase | null;
  progress: number;
  elapsedTime: number;
  tip: string | null;
}

const TICK_INTERVAL = 100;
const TIP_CYCLE_INTERVAL = 12000;

export function useCedricNarrator(config: NarratorConfig): NarratorState {
  const { phases, queryKey, onComplete } = config;
  const { state: adventureState } = useAdventureMode();

  const fetchingCount = useIsFetching({ queryKey });
  const isQueryLoading = fetchingCount > 0;

  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const wasLoadingRef = useRef(false);

  // Start tracking when query begins loading
  useEffect(() => {
    if (isQueryLoading && !isLoading) {
      setIsLoading(true);
      startTimeRef.current = Date.now();
      setElapsedTime(0);
      wasLoadingRef.current = true;
    }
  }, [isQueryLoading, isLoading]);

  // Tick elapsed time while loading
  useEffect(() => {
    if (!isLoading) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedTime(Date.now() - startTimeRef.current);
      }
    }, TICK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLoading]);

  // Complete when query stops loading
  useEffect(() => {
    if (!isQueryLoading && wasLoadingRef.current && isLoading) {
      wasLoadingRef.current = false;
      setIsLoading(false);
      setElapsedTime(0);
      startTimeRef.current = null;
      onCompleteRef.current?.();
    }
  }, [isQueryLoading, isLoading]);

  // Determine current phase
  const currentPhase = isLoading
    ? phases.find((p) => elapsedTime >= p.minTime && elapsedTime < p.maxTime) ?? null
    : null;

  // Calculate progress based on phase position
  const progress = calculateProgress(phases, elapsedTime, isLoading);

  // Cycle tips
  const tip = useTipCycler(currentPhase, adventureState.enabled);

  return { isLoading, currentPhase, progress, elapsedTime, tip };
}

function calculateProgress(
  phases: NarratorPhase[],
  elapsedTime: number,
  isLoading: boolean,
): number {
  if (!isLoading) return 0;

  // Find last finite phase maxTime to define total timeline
  const finitePhases = phases.filter((p) => p.maxTime !== Infinity);
  const totalTime = finitePhases.length > 0
    ? Math.max(...finitePhases.map((p) => p.maxTime))
    : 90000; // Default fallback

  if (elapsedTime >= totalTime) {
    return 99; // Cap at 99% until actual completion
  }

  const raw = (elapsedTime / totalTime) * 99;
  return Math.min(99, Math.round(raw));
}

function useTipCycler(
  currentPhase: NarratorPhase | null,
  adventureEnabled: boolean,
): string | null {
  const [tipText, setTipText] = useState<string | null>(null);
  const tipTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPhaseRef = useRef<NarratorPhase | null>(null);

  const getTipText = useCallback(
    (phase: NarratorPhase | null): string | null => {
      if (!phase?.tip) return null;
      return getCedricText(phase.tip, adventureEnabled);
    },
    [adventureEnabled],
  );

  useEffect(() => {
    if (tipTimerRef.current) {
      clearInterval(tipTimerRef.current);
      tipTimerRef.current = null;
    }

    if (currentPhase !== prevPhaseRef.current) {
      setTipText(getTipText(currentPhase));
      prevPhaseRef.current = currentPhase;
    }

    if (currentPhase?.tip) {
      tipTimerRef.current = setInterval(() => {
        setTipText(getTipText(currentPhase));
      }, TIP_CYCLE_INTERVAL);
    }

    return () => {
      if (tipTimerRef.current) {
        clearInterval(tipTimerRef.current);
        tipTimerRef.current = null;
      }
    };
  }, [currentPhase, getTipText]);

  return tipText;
}
