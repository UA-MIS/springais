/**
 * Phase configurations for the loading narrator (Story 5.2).
 *
 * Architecture Section 9: Oracle Sequence and Generic Loading phases.
 */

import { AnimationState } from '../../context/cedricTypes';
import type { NarratorPhase } from './useCedricNarrator';

/**
 * Oracle Sequence -- 5 phases for roadmap generation (the most elaborate narrator).
 */
export const ORACLE_PHASES: NarratorPhase[] = [
  {
    minTime: 0,
    maxTime: 15000,
    dialogue: {
      medieval: "Ah, you seek the Oracle's wisdom! Let me consult the ancient tomes...",
      modern: 'Starting your career path analysis...',
    },
    avatarState: AnimationState.Reading,
    tip: {
      medieval: 'While we wait -- did you know you earn XP for completing roadmap milestones?',
      modern: 'Tip: You earn rewards for completing milestones on your roadmap.',
    },
  },
  {
    minTime: 15000,
    maxTime: 30000,
    dialogue: {
      medieval: 'The scribes are studying your skills and achievements. Your abilities are... impressive!',
      modern: 'Analyzing your skills and experience...',
    },
    avatarState: AnimationState.Thinking,
    tip: {
      medieval: 'Adventurers who follow their roadmap are more likely to reach their career goals.',
      modern: 'Following a structured roadmap significantly improves career outcomes.',
    },
  },
  {
    minTime: 30000,
    maxTime: 60000,
    dialogue: {
      medieval: 'The cartographers are mapping your optimal path through the realm...',
      modern: 'Mapping your optimal learning path...',
    },
    avatarState: AnimationState.TracingLines,
  },
  {
    minTime: 60000,
    maxTime: 90000,
    dialogue: {
      medieval: 'Your destiny is nearly revealed... The stars are aligning in your favor!',
      modern: 'Almost done -- finalizing your personalized roadmap...',
    },
    avatarState: AnimationState.LookingUp,
  },
  {
    minTime: 90000,
    maxTime: Infinity,
    dialogue: {
      medieval: 'Any moment now... The Oracle works to ensure every detail is perfect.',
      modern: 'Putting the finishing touches on your roadmap...',
    },
    avatarState: AnimationState.Excited,
  },
];

/**
 * Generic loading -- single phase for shorter API calls (under 10s).
 */
export const GENERIC_LOADING_PHASES: NarratorPhase[] = [
  {
    minTime: 0,
    maxTime: Infinity,
    dialogue: {
      medieval: 'One moment, adventurer...',
      modern: 'Loading...',
    },
    avatarState: AnimationState.Thinking,
  },
];

/**
 * Match loading -- used when match results are loading after resume upload.
 */
export const MATCH_LOADING_PHASES: NarratorPhase[] = [
  {
    minTime: 0,
    maxTime: Infinity,
    dialogue: {
      medieval: 'The scouts are searching the realm for quests worthy of your talents...',
      modern: 'Finding the best role matches for your profile...',
    },
    avatarState: AnimationState.LookingFar,
  },
];

/**
 * Resume parsing -- used when resume is being analyzed.
 */
export const RESUME_LOADING_PHASES: NarratorPhase[] = [
  {
    minTime: 0,
    maxTime: Infinity,
    dialogue: {
      medieval: 'The Guild Master deciphers your scroll of abilities...',
      modern: 'Analyzing your resume...',
    },
    avatarState: AnimationState.Reading,
  },
];
