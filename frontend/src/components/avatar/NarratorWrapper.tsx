/**
 * NarratorWrapper -- Integrates AvatarLoadingStage with any loading state (Story 5.5).
 *
 * Provides a simpler API for pages that manage loading via local state
 * rather than React Query. Tracks elapsed time and phase transitions internally.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import AvatarLoadingStage from './AvatarLoadingStage';
import { getCedricText, type MessageVariant } from './cedricMessages';
import { AnimationState } from '../../context/cedricTypes';
import { useAdventureMode } from '../../context/AdventureModeContext';
import { useCedric } from '../../context/CedricContext';
import type { NarratorPhase } from './useCedricNarrator';

export interface NarratorWrapperProps {
  isLoading: boolean;
  phases: NarratorPhase[];
  completionDialogue?: MessageVariant;
  errorMessage?: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

const TICK_INTERVAL = 100;

export default function NarratorWrapper({
  isLoading,
  phases,
  completionDialogue,
  errorMessage,
  onRetry,
  children,
}: NarratorWrapperProps) {
  const { state: adventureState } = useAdventureMode();
  const { state: cedricState, triggerAnimation, enqueueMessage } = useCedric();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showContent, setShowContent] = useState(!isLoading);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasLoadingRef = useRef(false);

  // Narrator only activates when Cedric is visible
  const narratorActive = cedricState.visibility === 'full';

  // Start/stop elapsed time tracking
  useEffect(() => {
    if (isLoading && narratorActive) {
      if (!wasLoadingRef.current) {
        startTimeRef.current = Date.now();
        setElapsedTime(0);
        setShowContent(false);
        wasLoadingRef.current = true;
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
    }

    if (!isLoading && wasLoadingRef.current) {
      wasLoadingRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Brief completion animation then show content
      if (elapsedTime >= 2000) {
        triggerAnimation(AnimationState.Excited);
      }
    }

    return undefined;
  }, [isLoading, narratorActive, elapsedTime, triggerAnimation]);

  const handleFadeOutComplete = useCallback(() => {
    setShowContent(true);
  }, []);

  // Determine current phase
  const currentPhase = isLoading
    ? phases.find((p) => elapsedTime >= p.minTime && elapsedTime < p.maxTime) ?? null
    : null;

  // Calculate progress
  const finitePhases = phases.filter((p) => p.maxTime !== Infinity);
  const totalTime = finitePhases.length > 0
    ? Math.max(...finitePhases.map((p) => p.maxTime))
    : 90000;
  const progress = !isLoading
    ? 0
    : elapsedTime >= totalTime
    ? 99
    : Math.min(99, Math.round((elapsedTime / totalTime) * 99));

  // Tip text
  const tip = currentPhase?.tip
    ? getCedricText(currentPhase.tip, adventureState.enabled)
    : null;

  // Error state
  if (errorMessage && !isLoading) {
    return (
      <div className="flex flex-col items-center py-12" data-testid="narrator-error">
        <div className="text-center mb-4">
          <p className="text-red-400 text-sm">{errorMessage}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors text-sm"
            data-testid="narrator-retry-button"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  // If narrator is not active (Cedric minimized/hidden), show content directly
  if (!narratorActive) {
    return <>{children}</>;
  }

  // Loading state with narrator
  if (isLoading || !showContent) {
    return (
      <AvatarLoadingStage
        currentPhase={currentPhase}
        progress={progress}
        tip={tip}
        isLoading={isLoading}
        elapsedTime={elapsedTime}
        completionDialogue={completionDialogue}
        onFadeOutComplete={handleFadeOutComplete}
      />
    );
  }

  // Content loaded
  return <>{children}</>;
}
