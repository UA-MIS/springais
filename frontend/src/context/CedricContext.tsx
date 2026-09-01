import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useAdventureMode } from './AdventureModeContext';
import { progressionApi, QUERY_KEYS, ProgressionState, CosmeticBrief } from '../services/progressionService';
import { PAGE_CONFIGS } from '../components/avatar/cedricPageConfig';
import { getCedricText, WALKTHROUGH_MESSAGES } from '../components/avatar/cedricMessages';
import { WALKTHROUGH_STEPS, TOTAL_STEPS, type WalkthroughStepData } from '../components/avatar/walkthroughSteps';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import {
  AnimationState,
  SpeechPriority,
  SpeechAction,
  SpeechMessage,
  AnimationQueueEntry,
} from './cedricTypes';

// Re-export types for backward compatibility
export { AnimationState, type SpeechPriority, type SpeechAction, type SpeechMessage, type AnimationQueueEntry } from './cedricTypes';

// Priority levels for animation interruption (higher = more important)
const ANIMATION_PRIORITY: Record<string, number> = {
  // Idle states: 1
  [AnimationState.Idle]: 1,
  [AnimationState.LookAround]: 1,
  [AnimationState.Sitting]: 1,
  [AnimationState.Sleeping]: 1,
  [AnimationState.WakeUp]: 1,
  // Contextual states: 2
  [AnimationState.Thinking]: 2,
  [AnimationState.Reading]: 2,
  [AnimationState.Pointing]: 2,
  [AnimationState.Confused]: 2,
  [AnimationState.Excited]: 2,
  [AnimationState.LookingFar]: 2,
  [AnimationState.TracingLines]: 2,
  [AnimationState.LookingUp]: 2,
  // Reactions: 3
  [AnimationState.JumpXP]: 3,
  [AnimationState.CatchCoin]: 3,
  [AnimationState.SpinNewItem]: 3,
  [AnimationState.WaveHello]: 3,
  [AnimationState.HoldTrophy]: 3,
  // Major reactions: 4
  [AnimationState.CelebrateLevelUp]: 4,
  [AnimationState.VictoryPose]: 4,
};

function getAnimationPriority(state: AnimationState): number {
  return ANIMATION_PRIORITY[state] ?? 1;
}

// ── State Interface ────────────────────────────────────────────────
export interface CedricState {
  // Visibility
  visibility: 'full' | 'minimized' | 'hidden';
  position: { anchor: 'bottom-right' | 'bottom-left' | 'bottom-center' };

  // Animation
  animationState: AnimationState;
  animationQueue: AnimationQueueEntry[];

  // Speech
  currentMessage: SpeechMessage | null;
  speechQueue: SpeechMessage[];

  // Walkthrough
  walkthroughActive: boolean;
  walkthroughStep: number;
  walkthroughComplete: boolean;
  isNewUser: boolean;

  // Guidance
  quietMode: boolean;
  sessionMessageCount: number;
  lastMessageTimestamp: number;

  // UI
  characterSheetOpen: boolean;

  // Accessibility
  reducedMotion: boolean;
}

export interface CedricContextType {
  state: CedricState;

  // Equipped items from progression (B3 fix: typed properly instead of unsafe cast)
  equippedItems: Record<string, CosmeticBrief | null>;

  // Speech
  enqueueMessage: (message: SpeechMessage) => void;
  dismissCurrentMessage: () => void;
  suppressMessageType: (messageType: string) => void;

  // Animation
  triggerAnimation: (animation: AnimationState, duration?: number) => void;

  // Walkthrough
  startWalkthrough: () => void;
  advanceWalkthrough: () => void;
  skipWalkthrough: () => void;
  completeWalkthrough: () => void;

  // Visibility
  minimize: () => void;
  restore: () => void;
  toggleQuietMode: () => void;

  // Character sheet
  openCharacterSheet: () => void;
  closeCharacterSheet: () => void;
}

// ── Priority Sorting ───────────────────────────────────────────────
const SPEECH_PRIORITY_ORDER: Record<SpeechPriority, number> = {
  walkthrough: 4,
  reward: 3,
  reaction: 2,
  proactive: 1,
};

function sortSpeechQueue(queue: SpeechMessage[]): SpeechMessage[] {
  return [...queue].sort(
    (a, b) => SPEECH_PRIORITY_ORDER[b.priority] - SPEECH_PRIORITY_ORDER[a.priority]
  );
}

function enforceQueueOverflow(queue: SpeechMessage[]): SpeechMessage[] {
  if (queue.length <= 3) return queue;
  return queue.filter(
    (m) => m.priority === 'walkthrough' || m.priority === 'reward'
  );
}

// ── Reducer ────────────────────────────────────────────────────────
type CedricAction =
  | { type: 'ENQUEUE_MESSAGE'; message: SpeechMessage }
  | { type: 'DISMISS_CURRENT_MESSAGE' }
  | { type: 'SHOW_NEXT_MESSAGE' }
  | { type: 'SET_ANIMATION'; animation: AnimationState }
  | { type: 'QUEUE_ANIMATION'; entry: AnimationQueueEntry }
  | { type: 'DEQUEUE_ANIMATION' }
  | { type: 'START_WALKTHROUGH' }
  | { type: 'ADVANCE_WALKTHROUGH' }
  | { type: 'SKIP_WALKTHROUGH' }
  | { type: 'COMPLETE_WALKTHROUGH' }
  | { type: 'SET_VISIBILITY'; visibility: 'full' | 'minimized' | 'hidden' }
  | { type: 'TOGGLE_QUIET_MODE' }
  | { type: 'SET_CHARACTER_SHEET'; open: boolean }
  | { type: 'INIT_FROM_PROGRESSION'; walkthrough_step: number; walkthrough_completed: boolean; isNewUser: boolean }
  | { type: 'INCREMENT_SESSION_COUNT' }
  | { type: 'UPDATE_LAST_MESSAGE_TIMESTAMP' }
  | { type: 'CLEAR_NON_PERSISTENT' };

function cedricReducer(state: CedricState, action: CedricAction): CedricState {
  switch (action.type) {
    case 'ENQUEUE_MESSAGE': {
      let newQueue = sortSpeechQueue([...state.speechQueue, action.message]);
      newQueue = enforceQueueOverflow(newQueue);

      // If no current message, show immediately
      if (!state.currentMessage) {
        const [next, ...rest] = newQueue;
        return {
          ...state,
          currentMessage: next || null,
          speechQueue: rest,
          animationState: next?.avatarState ?? state.animationState,
        };
      }

      return { ...state, speechQueue: newQueue };
    }

    case 'DISMISS_CURRENT_MESSAGE': {
      return {
        ...state,
        currentMessage: null,
      };
    }

    case 'SHOW_NEXT_MESSAGE': {
      if (state.speechQueue.length === 0) {
        return {
          ...state,
          currentMessage: null,
        };
      }
      const [next, ...rest] = state.speechQueue;
      return {
        ...state,
        currentMessage: next,
        speechQueue: rest,
        animationState: next.avatarState ?? state.animationState,
      };
    }

    case 'SET_ANIMATION': {
      const currentPriority = getAnimationPriority(state.animationState);
      const newPriority = getAnimationPriority(action.animation);

      // Major reactions (priority 4) are never interrupted
      if (currentPriority === 4 && newPriority < 4) {
        return state;
      }

      // Reactions (priority 3) play to completion; queue new reactions
      if (currentPriority === 3 && newPriority <= 3) {
        return {
          ...state,
          animationQueue: [
            ...state.animationQueue,
            { animation: action.animation, duration: 1000 },
          ],
        };
      }

      // Otherwise, new animation can interrupt
      if (newPriority >= currentPriority) {
        return { ...state, animationState: action.animation };
      }

      return state;
    }

    case 'QUEUE_ANIMATION': {
      const queue = [...state.animationQueue, action.entry];
      // Collapse queue if > 3 (keep major reactions)
      if (queue.length > 3) {
        const major = queue.filter(
          (e) => getAnimationPriority(e.animation) >= 4
        );
        const other = queue.filter(
          (e) => getAnimationPriority(e.animation) < 4
        );
        return {
          ...state,
          animationQueue: [...major, ...other.slice(-1)],
        };
      }
      return { ...state, animationQueue: queue };
    }

    case 'DEQUEUE_ANIMATION': {
      const [next, ...rest] = state.animationQueue;
      if (!next) {
        return { ...state, animationState: AnimationState.Idle, animationQueue: [] };
      }
      return {
        ...state,
        animationState: next.animation,
        animationQueue: rest,
      };
    }

    case 'START_WALKTHROUGH':
      return {
        ...state,
        walkthroughActive: true,
        walkthroughStep: 0,
        visibility: 'full',
      };

    case 'ADVANCE_WALKTHROUGH':
      return {
        ...state,
        walkthroughStep: state.walkthroughStep + 1,
      };

    case 'SKIP_WALKTHROUGH':
      return {
        ...state,
        walkthroughActive: false,
        walkthroughComplete: true,
      };

    case 'COMPLETE_WALKTHROUGH':
      return {
        ...state,
        walkthroughActive: false,
        walkthroughComplete: true,
        walkthroughStep: 7,
      };

    case 'SET_VISIBILITY':
      return { ...state, visibility: action.visibility };

    case 'TOGGLE_QUIET_MODE': {
      const newQuiet = !state.quietMode;
      try {
        localStorage.setItem('cedric-quiet-mode', String(newQuiet));
      } catch {
        // Ignore localStorage errors
      }
      return { ...state, quietMode: newQuiet };
    }

    case 'SET_CHARACTER_SHEET':
      return { ...state, characterSheetOpen: action.open };

    case 'INIT_FROM_PROGRESSION':
      return {
        ...state,
        walkthroughStep: action.walkthrough_step,
        walkthroughComplete: action.walkthrough_completed,
        isNewUser: action.isNewUser,
      };

    case 'INCREMENT_SESSION_COUNT':
      return { ...state, sessionMessageCount: state.sessionMessageCount + 1 };

    case 'UPDATE_LAST_MESSAGE_TIMESTAMP':
      return { ...state, lastMessageTimestamp: Date.now() };

    case 'CLEAR_NON_PERSISTENT': {
      // Keep walkthrough and reward messages; drop reaction and proactive
      const persistentCurrent =
        state.currentMessage &&
        (state.currentMessage.priority === 'walkthrough' || state.currentMessage.priority === 'reward')
          ? state.currentMessage
          : null;
      const persistentQueue = state.speechQueue.filter(
        (m) => m.priority === 'walkthrough' || m.priority === 'reward'
      );
      return {
        ...state,
        currentMessage: persistentCurrent,
        speechQueue: persistentQueue,
      };
    }

    default:
      return state;
  }
}

// ── Initial State ──────────────────────────────────────────────────
function getInitialState(): CedricState {
  let quietMode = false;
  try {
    quietMode = localStorage.getItem('cedric-quiet-mode') === 'true';
  } catch {
    // Ignore
  }

  return {
    visibility: 'full',
    position: { anchor: 'bottom-right' },
    animationState: AnimationState.Idle,
    animationQueue: [],
    currentMessage: null,
    speechQueue: [],
    walkthroughActive: false,
    walkthroughStep: 0,
    walkthroughComplete: false,
    isNewUser: false,
    quietMode,
    sessionMessageCount: 0,
    lastMessageTimestamp: 0,
    characterSheetOpen: false,
    reducedMotion: false,
  };
}

// ── Context ────────────────────────────────────────────────────────
const CedricContext = createContext<CedricContextType | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────
export function CedricProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cedricReducer, undefined, getInitialState);
  const { state: adventureState, enableAdventureMode, addXP: adventureAddXP, addGold: adventureAddGold } = useAdventureMode();
  const location = useLocation();
  const reducedMotion = usePrefersReducedMotion();
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read progression data (walkthrough fields may not exist yet)
  const { data: progression } = useQuery<ProgressionState>({
    queryKey: QUERY_KEYS.progression,
    queryFn: progressionApi.getProgression,
    enabled: adventureState.enabled || !adventureState.loading,
    staleTime: 30000,
  });

  // Initialize walkthrough state from progression data
  useEffect(() => {
    if (progression) {
      dispatch({
        type: 'INIT_FROM_PROGRESSION',
        walkthrough_step: progression.walkthrough_step ?? 0,
        walkthrough_completed: progression.walkthrough_completed ?? false,
        isNewUser: !progression.onboarding_complete && !progression.walkthrough_completed,
      });
    }
  }, [progression]);

  // ── Story 2.3: New User Detection & Adventure Mode Prompt ──────
  const introShownRef = useRef(false);

  useEffect(() => {
    if (!state.isNewUser || introShownRef.current || state.walkthroughActive) return;
    introShownRef.current = true;

    const timer = setTimeout(() => {
      // Clear any page messages that fired before we knew this was a new user
      dispatch({ type: 'DISMISS_CURRENT_MESSAGE' });
      dispatch({ type: 'CLEAR_NON_PERSISTENT' });

      // If adventure mode is already enabled, skip the "Enable Adventure Mode!" prompt
      // and go straight to the walkthrough tour offer.
      if (adventureState.enabled) {
        dispatch({
          type: 'ENQUEUE_MESSAGE',
          message: {
            id: 'onboarding-intro-tour',
            text: getCedricText(WALKTHROUGH_MESSAGES.intro, true),
            priority: 'walkthrough',
            duration: 0,
            typing: true,
            dismissible: false,
            suppressible: false,
            avatarState: AnimationState.WaveHello,
            actions: [
              {
                id: 'start-tour',
                label: 'Show me around!',
                variant: 'primary',
                onClick: () => {
                  dispatch({ type: 'DISMISS_CURRENT_MESSAGE' });
                  dispatch({ type: 'START_WALKTHROUGH' });
                },
              },
              {
                id: 'explore-own',
                label: "I'll explore on my own",
                variant: 'ghost',
                onClick: () => {
                  dispatch({ type: 'DISMISS_CURRENT_MESSAGE' });
                  dispatch({ type: 'SET_VISIBILITY', visibility: 'minimized' });
                  progressionApi.completeOnboarding().catch(() => {});
                },
              },
            ],
          },
        });
        return;
      }

      const showMaybeLater = () => {
        dispatch({
          type: 'ENQUEUE_MESSAGE',
          message: {
            id: 'onboarding-maybe-later',
            text: getCedricText(WALKTHROUGH_MESSAGES.maybeLater, adventureState.enabled),
            priority: 'walkthrough',
            duration: 0,
            typing: true,
            dismissible: false,
            suppressible: false,
            avatarState: AnimationState.Pointing,
            actions: [
              {
                id: 'tour-modern',
                label: 'Sure, show me around!',
                variant: 'primary',
                onClick: () => {
                  dispatch({ type: 'START_WALKTHROUGH' });
                },
              },
              {
                id: 'explore-own',
                label: "I'll explore on my own",
                variant: 'ghost',
                onClick: () => {
                  dispatch({ type: 'DISMISS_CURRENT_MESSAGE' });
                  dispatch({ type: 'SET_VISIBILITY', visibility: 'minimized' });
                  progressionApi.completeOnboarding().catch(() => {
                    // Best-effort -- user can still use the platform
                  });
                },
              },
            ],
          },
        });
      };

      dispatch({
        type: 'ENQUEUE_MESSAGE',
        message: {
          id: 'onboarding-intro',
          text: getCedricText(WALKTHROUGH_MESSAGES.intro, adventureState.enabled),
          priority: 'walkthrough',
          duration: 0,
          typing: true,
          dismissible: false,
          suppressible: false,
          avatarState: AnimationState.WaveHello,
          actions: [
            {
              id: 'enable-adventure',
              label: 'Enable Adventure Mode!',
              variant: 'primary',
              onClick: () => {
                enableAdventureMode();
                dispatch({ type: 'DISMISS_CURRENT_MESSAGE' });
                dispatch({ type: 'START_WALKTHROUGH' });
              },
            },
            {
              id: 'maybe-later',
              label: 'Maybe Later',
              variant: 'ghost',
              onClick: () => {
                dispatch({ type: 'DISMISS_CURRENT_MESSAGE' });
                // After a brief gap, show the follow-up
                setTimeout(() => showMaybeLater(), 600);
              },
            },
          ],
        },
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [state.isNewUser, state.walkthroughActive, adventureState.enabled, enableAdventureMode]);

  // Auto-dismiss timer for current message
  useEffect(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    if (state.currentMessage && state.currentMessage.duration > 0) {
      dismissTimerRef.current = setTimeout(() => {
        dispatch({ type: 'DISMISS_CURRENT_MESSAGE' });
        // After dismissal, show next message with a gap
        gapTimerRef.current = setTimeout(() => {
          dispatch({ type: 'SHOW_NEXT_MESSAGE' });
        }, 500);
      }, state.currentMessage.duration);
    }

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      // Do NOT clear gapTimerRef here -- it must survive the dismiss->null transition
      // so the next message can appear after the 500ms gap
    };
  }, [state.currentMessage?.id]);

  // ── Actions ──────────────────────────────────────────────────────
  const enqueueMessage = useCallback((message: SpeechMessage) => {
    dispatch({ type: 'ENQUEUE_MESSAGE', message });
  }, []);

  const dismissCurrentMessage = useCallback(() => {
    if (state.currentMessage?.onDismiss) {
      state.currentMessage.onDismiss();
    }
    dispatch({ type: 'DISMISS_CURRENT_MESSAGE' });
    // Show next message after gap
    gapTimerRef.current = setTimeout(() => {
      dispatch({ type: 'SHOW_NEXT_MESSAGE' });
    }, 500);
  }, [state.currentMessage]);

  const suppressMessageType = useCallback((messageType: string) => {
    try {
      localStorage.setItem(`cedric-msg-suppress-${messageType}`, 'true');
    } catch {
      // Ignore
    }
  }, []);

  const triggerAnimation = useCallback(
    (animation: AnimationState, _duration?: number) => {
      dispatch({ type: 'SET_ANIMATION', animation });
    },
    []
  );

  const startWalkthrough = useCallback(() => {
    dispatch({ type: 'START_WALKTHROUGH' });
  }, []);

  const advanceWalkthrough = useCallback(() => {
    dispatch({ type: 'ADVANCE_WALKTHROUGH' });
  }, []);

  const skipWalkthrough = useCallback(() => {
    dispatch({ type: 'SKIP_WALKTHROUGH' });
    // Persist onboarding as complete (no rewards for skipping)
    progressionApi.completeOnboarding().catch(() => {});
    // Clear any existing page messages
    dispatch({ type: 'DISMISS_CURRENT_MESSAGE' });
    dispatch({ type: 'CLEAR_NON_PERSISTENT' });
    // Brief farewell message
    dispatch({
      type: 'ENQUEUE_MESSAGE',
      message: {
        id: 'walkthrough-skipped',
        text: getCedricText(WALKTHROUGH_MESSAGES.maybeLaterExplore, adventureState.enabled),
        priority: 'walkthrough',
        duration: 6000,
        typing: false,
        dismissible: true,
        suppressible: false,
        avatarState: AnimationState.WaveHello,
      },
    });
  }, [adventureState.enabled]);

  const completeWalkthrough = useCallback(() => {
    dispatch({ type: 'COMPLETE_WALKTHROUGH' });
  }, []);

  const minimize = useCallback(() => {
    dispatch({ type: 'SET_VISIBILITY', visibility: 'minimized' });
  }, []);

  const restore = useCallback(() => {
    dispatch({ type: 'SET_VISIBILITY', visibility: 'full' });
  }, []);

  const toggleQuietMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_QUIET_MODE' });
  }, []);

  const openCharacterSheet = useCallback(() => {
    dispatch({ type: 'SET_CHARACTER_SHEET', open: true });
  }, []);

  const closeCharacterSheet = useCallback(() => {
    dispatch({ type: 'SET_CHARACTER_SHEET', open: false });
  }, []);

  // Capture adventure mode actions in a ref for use in step completion callback
  const adventureActions = useRef({ addXP: adventureAddXP, addGold: adventureAddGold });
  adventureActions.current = { addXP: adventureAddXP, addGold: adventureAddGold };

  // ── Story 2.4: Walkthrough Step Completion Detection ────────────
  const stepCompletionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!state.walkthroughActive) {
      if (stepCompletionTimerRef.current) {
        clearTimeout(stepCompletionTimerRef.current);
        stepCompletionTimerRef.current = null;
      }
      return;
    }

    const currentStepDef = WALKTHROUGH_STEPS[state.walkthroughStep];
    if (!currentStepDef) return;
    const stepData = currentStepDef.data as WalkthroughStepData | undefined;
    if (!stepData) return;

    // Helper: advance step, dispatch rewards, persist to backend
    const completeCurrentStep = () => {
      if (stepCompletionTimerRef.current) {
        clearTimeout(stepCompletionTimerRef.current);
        stepCompletionTimerRef.current = null;
      }
      const { addXP: doAddXP, addGold: doAddGold } = adventureActions.current;
      if (stepData.rewardXP > 0) doAddXP(stepData.rewardXP, 'walkthrough');
      if (stepData.rewardGold > 0) doAddGold(stepData.rewardGold, 'walkthrough');
      progressionApi.completeWalkthroughStep(state.walkthroughStep + 1).catch(() => {});
      dispatch({ type: 'SET_ANIMATION', animation: AnimationState.JumpXP });
      dispatch({ type: 'ADVANCE_WALKTHROUGH' });
    };

    // Timer-based detection
    if (stepData.completionDetection === 'timer' && stepData.completionTimer) {
      stepCompletionTimerRef.current = setTimeout(completeCurrentStep, stepData.completionTimer);
    }

    // Navigation-based detection: complete when route matches targetRoute
    if (stepData.completionDetection === 'navigation' && stepData.targetRoute) {
      if (location.pathname === stepData.targetRoute) {
        completeCurrentStep();
      }
    }

    // Action-based detection: listen for custom 'cedric-walkthrough-action' events
    const handleAction = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (stepData.completionDetection === 'action' && detail?.step === state.walkthroughStep) {
        completeCurrentStep();
      }
    };
    window.addEventListener('cedric-walkthrough-action', handleAction);

    return () => {
      if (stepCompletionTimerRef.current) {
        clearTimeout(stepCompletionTimerRef.current);
        stepCompletionTimerRef.current = null;
      }
      window.removeEventListener('cedric-walkthrough-action', handleAction);
    };
  }, [state.walkthroughActive, state.walkthroughStep, location.pathname]);

  // ── Story 2.7: Walkthrough Completion Celebration ───────────────
  const completionTriggeredRef = useRef(false);

  useEffect(() => {
    if (!state.walkthroughActive || state.walkthroughStep < TOTAL_STEPS || completionTriggeredRef.current) return;
    completionTriggeredRef.current = true;

    // 1. Dismiss Joyride overlay by completing the walkthrough
    dispatch({ type: 'COMPLETE_WALKTHROUGH' });

    // 2. CelebrateLevelUp animation
    dispatch({ type: 'SET_ANIMATION', animation: AnimationState.CelebrateLevelUp });

    // 3. Call backend to persist onboarding completion
    progressionApi.completeOnboarding().catch(() => {});

    // 4. After a short delay, clear any page messages and show the final Cedric message
    setTimeout(() => {
      dispatch({ type: 'DISMISS_CURRENT_MESSAGE' });
      dispatch({ type: 'CLEAR_NON_PERSISTENT' });
      dispatch({
        type: 'ENQUEUE_MESSAGE',
        message: {
          id: 'walkthrough-complete',
          text: getCedricText(WALKTHROUGH_MESSAGES.completion, adventureState.enabled),
          priority: 'walkthrough',
          duration: 12000,
          typing: true,
          dismissible: true,
          suppressible: false,
          avatarState: AnimationState.VictoryPose,
        },
      });
    }, 2000);
  }, [state.walkthroughActive, state.walkthroughStep, adventureState.enabled]);

  // ── Story 4.2: Inactivity Timer ────────────────────────────────
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lookAroundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wakeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // B1 fix: Use refs to avoid stale closures in timer callbacks
  const animationStateRef = useRef(state.animationState);
  animationStateRef.current = state.animationState;
  const visibilityRef = useRef(state.visibility);
  visibilityRef.current = state.visibility;

  const scheduleLookAround = useCallback(() => {
    if (lookAroundTimerRef.current) clearTimeout(lookAroundTimerRef.current);
    // Random interval between 15-20s
    const delay = Math.random() * 5000 + 15000;
    lookAroundTimerRef.current = setTimeout(() => {
      if (animationStateRef.current === AnimationState.Idle && visibilityRef.current === 'full') {
        dispatch({ type: 'SET_ANIMATION', animation: AnimationState.LookAround });
        // Return to idle after 2s
        setTimeout(() => {
          dispatch({ type: 'SET_ANIMATION', animation: AnimationState.Idle });
          scheduleLookAround();
        }, 2000);
      } else {
        scheduleLookAround();
      }
    }, delay);
  }, []);

  const resetInactivity = useCallback(() => {
    // Clear existing timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);

    // WakeUp from sleeping with debounce
    if (animationStateRef.current === AnimationState.Sleeping) {
      if (wakeDebounceRef.current) clearTimeout(wakeDebounceRef.current);
      wakeDebounceRef.current = setTimeout(() => {
        dispatch({ type: 'SET_ANIMATION', animation: AnimationState.WakeUp });
        setTimeout(() => {
          dispatch({ type: 'SET_ANIMATION', animation: AnimationState.Idle });
        }, 1000);
      }, 300); // 0.3s debounce
      return;
    }

    // Reset to idle if in sitting state
    if (animationStateRef.current === AnimationState.Sitting) {
      dispatch({ type: 'SET_ANIMATION', animation: AnimationState.Idle });
    }

    // Schedule sitting after 30s inactivity
    inactivityTimerRef.current = setTimeout(() => {
      if (visibilityRef.current === 'full') {
        dispatch({ type: 'SET_ANIMATION', animation: AnimationState.Sitting });
        // Schedule sleeping after 90 more seconds
        sleepTimerRef.current = setTimeout(() => {
          dispatch({ type: 'SET_ANIMATION', animation: AnimationState.Sleeping });
        }, 90_000);
      }
    }, 30_000);
  }, []);

  useEffect(() => {
    if (state.visibility !== 'full') return;

    const handler = () => resetInactivity();
    window.addEventListener('mousemove', handler, { passive: true });
    window.addEventListener('keydown', handler, { passive: true });
    resetInactivity();
    scheduleLookAround();

    return () => {
      window.removeEventListener('mousemove', handler);
      window.removeEventListener('keydown', handler);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
      if (lookAroundTimerRef.current) clearTimeout(lookAroundTimerRef.current);
      if (wakeDebounceRef.current) clearTimeout(wakeDebounceRef.current);
    };
  }, [state.visibility]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Story 4.5: React to AdventureModeContext events ──────────
  const prevXPRef = useRef(adventureState.recentXPGain);
  const prevGoldRef = useRef(adventureState.recentGoldGain);
  const prevLevelUpRef = useRef(adventureState.levelUpPending);
  const prevAchievementRef = useRef(adventureState.recentAchievement);
  const prevQuestRef = useRef(adventureState.recentQuestComplete);

  useEffect(() => {
    if (state.walkthroughActive) return; // Suppress during walkthrough

    // XP gain -> JumpXP
    if (adventureState.recentXPGain && adventureState.recentXPGain !== prevXPRef.current) {
      dispatch({ type: 'SET_ANIMATION', animation: AnimationState.JumpXP });
    }
    prevXPRef.current = adventureState.recentXPGain;
  }, [adventureState.recentXPGain, state.walkthroughActive]);

  useEffect(() => {
    if (state.walkthroughActive) return;

    // Level up -> CelebrateLevelUp
    if (adventureState.levelUpPending && !prevLevelUpRef.current) {
      dispatch({ type: 'SET_ANIMATION', animation: AnimationState.CelebrateLevelUp });
    }
    prevLevelUpRef.current = adventureState.levelUpPending;
  }, [adventureState.levelUpPending, state.walkthroughActive]);

  useEffect(() => {
    if (state.walkthroughActive) return;

    // Gold gain -> CatchCoin
    if (adventureState.recentGoldGain && adventureState.recentGoldGain !== prevGoldRef.current) {
      dispatch({ type: 'SET_ANIMATION', animation: AnimationState.CatchCoin });
    }
    prevGoldRef.current = adventureState.recentGoldGain;
  }, [adventureState.recentGoldGain, state.walkthroughActive]);

  useEffect(() => {
    if (state.walkthroughActive) return;

    // Achievement -> HoldTrophy
    if (adventureState.recentAchievement && adventureState.recentAchievement !== prevAchievementRef.current) {
      dispatch({ type: 'SET_ANIMATION', animation: AnimationState.HoldTrophy });
    }
    prevAchievementRef.current = adventureState.recentAchievement;
  }, [adventureState.recentAchievement, state.walkthroughActive]);

  useEffect(() => {
    if (state.walkthroughActive) return;

    // Quest complete -> VictoryPose
    if (adventureState.recentQuestComplete && adventureState.recentQuestComplete !== prevQuestRef.current) {
      dispatch({ type: 'SET_ANIMATION', animation: AnimationState.VictoryPose });
    }
    prevQuestRef.current = adventureState.recentQuestComplete;
  }, [adventureState.recentQuestComplete, state.walkthroughActive]);

  // ── Animation Queue processing (Story 4.4) ──────────────────
  const animQueueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Process animation queue when current animation finishes
    if (state.animationQueue.length > 0 && getAnimationPriority(state.animationState) <= 1) {
      if (animQueueTimerRef.current) clearTimeout(animQueueTimerRef.current);
      const [next] = state.animationQueue;
      next.onStart?.();
      dispatch({ type: 'DEQUEUE_ANIMATION' });
      animQueueTimerRef.current = setTimeout(() => {
        if (state.animationQueue.length <= 1) {
          dispatch({ type: 'SET_ANIMATION', animation: AnimationState.Idle });
        }
      }, next.duration);
    }

    return () => {
      if (animQueueTimerRef.current) clearTimeout(animQueueTimerRef.current);
    };
  }, [state.animationQueue.length, state.animationState]);

  // ── Story 6.3: Anti-Annoyance Protocol ──────────────────────────
  const shouldShowProactiveMessage = useCallback((messageType: string): boolean => {
    // Rule 1: Quiet mode
    if (state.quietMode) return false;

    // Rule 2: Session cap
    if (state.sessionMessageCount >= 8) return false;

    // Rule 3: Cooldown (90 seconds)
    if (Date.now() - state.lastMessageTimestamp < 90_000) return false;

    // Rule 4: Suppressed by user
    try {
      if (localStorage.getItem(`cedric-msg-suppress-${messageType}`)) return false;
    } catch {
      // Ignore
    }

    // Rule 5: Frequency decay
    let showCount = 0;
    try {
      showCount = parseInt(localStorage.getItem(`cedric-msg-freq-${messageType}`) || '0', 10);
    } catch {
      // Ignore
    }
    const probability = Math.max(0.1, 1 / Math.pow(2, showCount));
    if (Math.random() > probability) return false;

    // Rule 6: No exact repeats
    if (state.currentMessage?.messageType === messageType) return false;

    return true;
  }, [state.quietMode, state.sessionMessageCount, state.lastMessageTimestamp, state.currentMessage?.messageType]);

  const incrementProactiveCount = useCallback((messageType: string) => {
    try {
      const count = parseInt(localStorage.getItem(`cedric-msg-freq-${messageType}`) || '0', 10);
      localStorage.setItem(`cedric-msg-freq-${messageType}`, String(count + 1));
    } catch {
      // Ignore
    }
    dispatch({ type: 'INCREMENT_SESSION_COUNT' });
    dispatch({ type: 'UPDATE_LAST_MESSAGE_TIMESTAMP' });
  }, []);

  // ── Story 6.2: Route Change Listener ────────────────────────────
  // Track whether current minimized state was caused by a page-level override
  const pageVisibilityOverrideRef = useRef(false);

  useEffect(() => {
    // Clear non-persistent messages
    dispatch({ type: 'CLEAR_NON_PERSISTENT' });

    const path = location.pathname;
    const pageConfig = PAGE_CONFIGS[path];

    // Apply per-page default visibility (e.g. minimize on /roadmap to avoid overlapping the Roadmap Assistant)
    if (pageConfig?.defaultVisibility && pageConfig.defaultVisibility !== 'full') {
      dispatch({ type: 'SET_VISIBILITY', visibility: pageConfig.defaultVisibility });
      pageVisibilityOverrideRef.current = true;
    } else if (pageVisibilityOverrideRef.current) {
      // Restore to full when leaving a page that had an override
      dispatch({ type: 'SET_VISIBILITY', visibility: 'full' });
      pageVisibilityOverrideRef.current = false;
    }

    if (!pageConfig) return;

    const hasVisited = localStorage.getItem(`cedric-first-visit-${path}`);

    // Suppress page messages during onboarding intro (new user before walkthrough starts)
    const inOnboardingIntro = state.isNewUser && !state.walkthroughComplete;

    if (!hasVisited && !state.walkthroughActive && !inOnboardingIntro) {
      // First visit message
      dispatch({
        type: 'ENQUEUE_MESSAGE',
        message: {
          id: `first-visit-${path}`,
          text: getCedricText(pageConfig.firstVisitMessage, adventureState.enabled),
          priority: 'reaction',
          duration: 8000,
          typing: false,
          dismissible: true,
          suppressible: false,
          avatarState: pageConfig.firstVisitAvatarState,
        },
      });
      try {
        localStorage.setItem(`cedric-first-visit-${path}`, 'true');
      } catch {
        // Ignore
      }
    } else if (hasVisited && !state.walkthroughActive && !inOnboardingIntro) {
      // Return visit -- subject to anti-annoyance rules
      const returnMsg = pageConfig.returnMessages[
        Math.floor(Math.random() * pageConfig.returnMessages.length)
      ];
      const messageType = `return-${path}`;
      if (returnMsg && shouldShowProactiveMessage(messageType)) {
        dispatch({
          type: 'ENQUEUE_MESSAGE',
          message: {
            id: `return-${path}-${Date.now()}`,
            text: getCedricText(returnMsg, adventureState.enabled),
            priority: 'proactive',
            duration: 8000,
            typing: false,
            dismissible: true,
            suppressible: true,
            messageType,
            avatarState: pageConfig.returnAvatarState,
          },
        });
        incrementProactiveCount(messageType);
      }
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Story 6.4: Proactive Suggestion System ──────────────────────
  const proactiveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pageEntryTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Reset page entry time and clear previous interval
    pageEntryTimeRef.current = Date.now();
    if (proactiveIntervalRef.current) clearInterval(proactiveIntervalRef.current);

    const path = location.pathname;
    const pageConfig = PAGE_CONFIGS[path];
    if (!pageConfig?.proactiveSuggestions?.length) return;

    proactiveIntervalRef.current = setInterval(() => {
      if (state.walkthroughActive) return;

      const timeOnPage = Date.now() - pageEntryTimeRef.current;
      const gold = adventureState.gold ?? 0;
      const level = adventureState.level ?? 1;
      // Approximate daysAway from last login -- default to 0
      const daysAway = 0;

      for (const suggestion of pageConfig.proactiveSuggestions!) {
        // idle_time triggers: fire after 5+ minutes on page
        if (suggestion.trigger === 'idle_time' && timeOnPage < 300_000) continue;

        // data_condition triggers: evaluate condition function
        if (suggestion.trigger === 'data_condition' && suggestion.condition) {
          if (!suggestion.condition({ gold, level, daysAway })) continue;
        }

        // Subject to anti-annoyance protocol
        if (!shouldShowProactiveMessage(suggestion.id)) continue;

        dispatch({
          type: 'ENQUEUE_MESSAGE',
          message: {
            id: `proactive-${suggestion.id}-${Date.now()}`,
            text: getCedricText(suggestion.message, adventureState.enabled),
            priority: 'proactive',
            duration: 8000,
            typing: false,
            dismissible: true,
            suppressible: true,
            messageType: suggestion.id,
            avatarState: suggestion.avatarState,
          },
        });
        incrementProactiveCount(suggestion.id);
        break; // Only one suggestion per evaluation cycle
      }
    }, 30_000);

    return () => {
      if (proactiveIntervalRef.current) clearInterval(proactiveIntervalRef.current);
    };
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // B3 fix: derive equippedItems from progression query with proper typing
  const equippedItems: Record<string, CosmeticBrief | null> = progression?.equipped_items ?? {};

  const contextValue: CedricContextType = {
    state: { ...state, reducedMotion },
    equippedItems,
    enqueueMessage,
    dismissCurrentMessage,
    suppressMessageType,
    triggerAnimation,
    startWalkthrough,
    advanceWalkthrough,
    skipWalkthrough,
    completeWalkthrough,
    minimize,
    restore,
    toggleQuietMode,
    openCharacterSheet,
    closeCharacterSheet,
  };

  return (
    <CedricContext.Provider value={contextValue}>
      {children}
    </CedricContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────
export function useCedric(): CedricContextType {
  const context = useContext(CedricContext);
  if (!context) {
    throw new Error('useCedric must be used within a CedricProvider');
  }
  return context;
}
