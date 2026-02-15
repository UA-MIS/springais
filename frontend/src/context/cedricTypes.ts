/**
 * Shared types for the Cedric Avatar system.
 * Extracted to avoid circular dependencies between CedricContext and cedricPageConfig.
 */

// ── Animation States ───────────────────────────────────────────────
export enum AnimationState {
  // Idle progression
  Idle = 'idle',
  LookAround = 'lookAround',
  Sitting = 'sitting',
  Sleeping = 'sleeping',
  WakeUp = 'wakeUp',

  // Reactions
  JumpXP = 'jumpXP',
  CelebrateLevelUp = 'celebrateLevelUp',
  CatchCoin = 'catchCoin',
  HoldTrophy = 'holdTrophy',
  VictoryPose = 'victoryPose',
  SpinNewItem = 'spinNewItem',
  WaveHello = 'waveHello',

  // Contextual
  Thinking = 'thinking',
  Reading = 'reading',
  Pointing = 'pointing',
  Confused = 'confused',
  Excited = 'excited',
  LookingFar = 'lookingFar',
  TracingLines = 'tracingLines',
  LookingUp = 'lookingUp',
}

// ── Speech Types ───────────────────────────────────────────────────
export type SpeechPriority = 'walkthrough' | 'reward' | 'reaction' | 'proactive';

export interface SpeechAction {
  id: string;
  label: string;
  variant: 'primary' | 'ghost';
  onClick: () => void;
}

export interface SpeechMessage {
  id: string;
  text: string;
  priority: SpeechPriority;
  duration: number;
  typing: boolean;
  typingSpeed?: number;
  actions?: SpeechAction[];
  dismissible: boolean;
  suppressible: boolean;
  messageType?: string;
  avatarState?: AnimationState;
  onDismiss?: () => void;
}

export interface AnimationQueueEntry {
  animation: AnimationState;
  duration: number;
  onStart?: () => void;
}
