/**
 * Page configuration map for Cedric's contextual guidance system.
 * Maps routes to first-visit messages, return-visit messages,
 * empty-state messages, and proactive suggestions.
 * Architecture Section 10 / D-CA-004.
 */

import { MessageVariant, PAGE_MESSAGES } from './cedricMessages';
import { AnimationState } from '../../context/cedricTypes';

export interface ProactiveSuggestion {
  id: string;
  trigger: 'idle_time' | 'data_condition';
  condition?: (state: { gold: number; level: number; daysAway: number }) => boolean;
  message: MessageVariant;
  avatarState: AnimationState;
}

export interface PageConfig {
  firstVisitMessage: MessageVariant;
  firstVisitAvatarState: AnimationState;
  returnMessages: MessageVariant[];
  returnAvatarState: AnimationState;
  emptyStateMessage?: MessageVariant;
  emptyStateAvatarState?: AnimationState;
  proactiveSuggestions?: ProactiveSuggestion[];
  /** Override Cedric's visibility on this page (e.g. 'minimized' to avoid overlapping another widget). */
  defaultVisibility?: 'full' | 'minimized' | 'hidden';
}

export const PAGE_CONFIGS: Record<string, PageConfig> = {
  '/matches': {
    firstVisitMessage: PAGE_MESSAGES['/matches'].firstVisit,
    firstVisitAvatarState: AnimationState.Pointing,
    returnMessages: PAGE_MESSAGES['/matches'].return as unknown as MessageVariant[],
    returnAvatarState: AnimationState.LookAround,
    emptyStateMessage: PAGE_MESSAGES['/matches'].empty,
    emptyStateAvatarState: AnimationState.Confused,
    proactiveSuggestions: [
      {
        id: 'matches-days-away',
        trigger: 'data_condition',
        condition: (s) => s.daysAway >= 3,
        message: {
          medieval: 'It has been a few days since you visited the Quest Board. New quests may await!',
          modern: 'It has been a few days since you checked your matches. New roles may be available!',
        },
        avatarState: AnimationState.Pointing,
      },
    ],
  },

  '/profile': {
    firstVisitMessage: PAGE_MESSAGES['/profile'].firstVisit,
    firstVisitAvatarState: AnimationState.Pointing,
    returnMessages: PAGE_MESSAGES['/profile'].return as unknown as MessageVariant[],
    returnAvatarState: AnimationState.Reading,
    emptyStateMessage: {
      medieval: 'Your Hero Sheet has empty fields. A complete record helps the Guild find worthy quests for you!',
      modern: 'Your profile is incomplete. Adding more details will improve your match quality.',
    },
    emptyStateAvatarState: AnimationState.Confused,
  },

  '/saved': {
    firstVisitMessage: PAGE_MESSAGES['/saved'].firstVisit,
    firstVisitAvatarState: AnimationState.Pointing,
    returnMessages: PAGE_MESSAGES['/saved'].return as unknown as MessageVariant[],
    returnAvatarState: AnimationState.Reading,
    emptyStateMessage: {
      medieval: 'Your Quest Log is empty! Visit the Quest Board and mark some roles that interest you.',
      modern: 'No saved roles yet. Browse your matches and save the ones you like.',
    },
    emptyStateAvatarState: AnimationState.Confused,
  },

  '/roadmap': {
    firstVisitMessage: PAGE_MESSAGES['/roadmap'].firstVisit,
    firstVisitAvatarState: AnimationState.Excited,
    returnMessages: PAGE_MESSAGES['/roadmap'].return as unknown as MessageVariant[],
    returnAvatarState: AnimationState.TracingLines,
    defaultVisibility: 'minimized',
    proactiveSuggestions: [
      {
        id: 'roadmap-milestones',
        trigger: 'data_condition',
        condition: (s) => s.level >= 1,
        message: {
          medieval: 'Your Adventure Path has uncompleted milestones. Every step brings you closer to mastery!',
          modern: 'Your roadmap has uncompleted milestones. Keep making progress on your learning goals!',
        },
        avatarState: AnimationState.Pointing,
      },
    ],
  },

  '/store': {
    firstVisitMessage: PAGE_MESSAGES['/store'].firstVisit,
    firstVisitAvatarState: AnimationState.Excited,
    returnMessages: PAGE_MESSAGES['/store'].return as unknown as MessageVariant[],
    returnAvatarState: AnimationState.LookAround,
    proactiveSuggestions: [
      {
        id: 'store-gold-high',
        trigger: 'data_condition',
        condition: (s) => s.gold > 500,
        message: {
          medieval: 'Your coffers are filling up! Old Grimshaw has fine wares that could use a new owner.',
          modern: 'You have plenty of coins! Check out the items available in the store.',
        },
        avatarState: AnimationState.Excited,
      },
    ],
  },

  '/quests': {
    firstVisitMessage: PAGE_MESSAGES['/quests'].firstVisit,
    firstVisitAvatarState: AnimationState.Excited,
    returnMessages: PAGE_MESSAGES['/quests'].return as unknown as MessageVariant[],
    returnAvatarState: AnimationState.LookAround,
  },

  '/success-patterns': {
    firstVisitMessage: PAGE_MESSAGES['/success-patterns'].firstVisit,
    firstVisitAvatarState: AnimationState.Reading,
    returnMessages: PAGE_MESSAGES['/success-patterns'].return as unknown as MessageVariant[],
    returnAvatarState: AnimationState.Reading,
  },
};
