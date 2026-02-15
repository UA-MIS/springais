/**
 * AvatarLoadingStage -- 192x192 enlarged avatar for loading screens (Stories 5.3, 5.4).
 *
 * Architecture Section 9: Integration Pattern + Completion Animation.
 * Renders SpeechBubble, enlarged AvatarSprite, progress bar, tip text,
 * and completion animation with confetti.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarSprite from './AvatarSprite';
import SpeechBubble from './SpeechBubble';
import ConfettiEffect from './ConfettiEffect';
import { getCedricText, type MessageVariant } from './cedricMessages';
import { useAdventureMode } from '../../context/AdventureModeContext';
import { AnimationState } from '../../context/cedricTypes';
import type { NarratorPhase } from './useCedricNarrator';

export interface AvatarLoadingStageProps {
  currentPhase: NarratorPhase | null;
  progress: number;
  tip: string | null;
  isLoading: boolean;
  /** Total elapsed time in ms -- used for short-load suppression */
  elapsedTime?: number;
  /** Completion speech bubble text variant (optional) */
  completionDialogue?: MessageVariant;
  /** Callback when fade-out completes */
  onFadeOutComplete?: () => void;
}

type StageState = 'loading' | 'completing' | 'fading-out' | 'done';

export default function AvatarLoadingStage({
  currentPhase,
  progress,
  tip,
  isLoading,
  elapsedTime = 0,
  completionDialogue,
  onFadeOutComplete,
}: AvatarLoadingStageProps) {
  const { state: adventureState } = useAdventureMode();
  const [stageState, setStageState] = useState<StageState>('loading');
  const [showConfetti, setShowConfetti] = useState(false);
  const wasLoadingRef = useRef(false);
  const totalElapsedRef = useRef(0);
  const mountedRef = useRef(true);

  // B6 fix: Track mounted state to prevent state updates after unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Track the elapsed time at completion
  useEffect(() => {
    if (isLoading) {
      totalElapsedRef.current = elapsedTime;
    }
  }, [isLoading, elapsedTime]);

  // Handle transition from loading to completion
  useEffect(() => {
    if (isLoading) {
      wasLoadingRef.current = true;
      setStageState('loading');
      return;
    }

    if (!wasLoadingRef.current) return;
    wasLoadingRef.current = false;

    const loadDuration = totalElapsedRef.current;

    // Short loads (< 2s): skip speech, brief state change only
    if (loadDuration < 2000) {
      if (mountedRef.current) {
        setStageState('done');
      }
      onFadeOutComplete?.();
      return;
    }

    // Completion animation
    setStageState('completing');
    setShowConfetti(true);

    // After 1s: fade out
    const fadeTimer = setTimeout(() => {
      if (!mountedRef.current) return;
      setShowConfetti(false);
      setStageState('fading-out');
    }, 1000);

    // After 1.5s: done
    const doneTimer = setTimeout(() => {
      if (!mountedRef.current) return;
      setStageState('done');
      onFadeOutComplete?.();
    }, 1500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [isLoading, onFadeOutComplete]);

  // Nothing to show when done or never started
  if (stageState === 'done' && !isLoading) return null;
  if (!isLoading && stageState === 'loading') return null;
  if (!currentPhase && stageState === 'loading') return null;

  const theme = adventureState.enabled ? 'game' : 'light';

  // Completing state: show Excited avatar + confetti + completion dialogue
  if (stageState === 'completing' || stageState === 'fading-out') {
    const completionText = completionDialogue
      ? getCedricText(completionDialogue, adventureState.enabled)
      : null;

    return (
      <motion.div
        className="flex flex-col items-center py-12"
        data-testid="avatar-loading-stage"
        animate={{ opacity: stageState === 'fading-out' ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
        {completionText && (
          <div className="mb-4" data-testid="completion-speech-bubble">
            <SpeechBubble
              message={{
                id: 'narrator-completion',
                text: completionText,
                priority: 'reaction',
                duration: 0,
                typing: false,
                dismissible: false,
              }}
              theme={theme}
              onDismiss={() => {}}
              position="above"
            />
          </div>
        )}

        <div data-testid="loading-avatar" className="relative">
          <AvatarSprite
            size={192}
            equippedItems={{}}
            animationState={AnimationState.Excited}
            level={adventureState.level ?? 1}
            showPedestal={true}
            showNameplate={false}
          />
          <div data-testid="completion-confetti">
            <ConfettiEffect active={showConfetti} />
          </div>
        </div>

        <div className="w-80 mt-6" data-testid="loading-progress-bar">
          <div className="h-3 rounded-full overflow-hidden bg-amber-900/30">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-700 via-yellow-500 to-amber-700"
              animate={{ width: '100%' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              data-testid="progress-bar-fill"
            />
          </div>
          <div className="text-center text-sm mt-2 text-amber-200/70" data-testid="progress-percentage">
            100%
          </div>
        </div>
      </motion.div>
    );
  }

  // Loading state
  if (!currentPhase) return null;

  const dialogueText = getCedricText(currentPhase.dialogue, adventureState.enabled);

  return (
    <div
      className="flex flex-col items-center py-12"
      data-testid="avatar-loading-stage"
    >
      {/* Speech bubble above avatar */}
      <div className="mb-4" data-testid="loading-speech-bubble">
        <SpeechBubble
          message={{
            id: 'narrator-dialogue',
            text: dialogueText,
            priority: 'reaction',
            duration: 0,
            typing: false,
            dismissible: false,
          }}
          theme={theme}
          onDismiss={() => {}}
          position="above"
        />
      </div>

      {/* Enlarged avatar (192x192) */}
      <div data-testid="loading-avatar">
        <AvatarSprite
          size={192}
          equippedItems={{}}
          animationState={currentPhase.avatarState as AnimationState}
          level={adventureState.level ?? 1}
          showPedestal={true}
          showNameplate={false}
        />
      </div>

      {/* Progress bar */}
      <div className="w-80 mt-6" data-testid="loading-progress-bar">
        <div className="h-3 rounded-full overflow-hidden bg-amber-900/30">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-700 via-yellow-500 to-amber-700"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            data-testid="progress-bar-fill"
          />
        </div>
        <div
          className="text-center text-sm mt-2 text-amber-200/70"
          data-testid="progress-percentage"
        >
          {progress}%
        </div>
      </div>

      {/* Tip text with fade animation */}
      <AnimatePresence mode="wait">
        {tip && (
          <motion.div
            key={tip}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 text-center text-sm text-amber-200/50 max-w-md"
            data-testid="loading-tip"
          >
            {tip}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
