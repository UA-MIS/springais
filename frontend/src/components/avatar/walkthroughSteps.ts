/**
 * Walkthrough step definitions (Story 2.2).
 *
 * 7 steps matching architecture Section 4: target selectors, detection types,
 * avatar states, and reward amounts.
 */

import type { Step } from 'react-joyride';
import { AnimationState } from '../../context/cedricTypes';

export interface WalkthroughStepData {
  avatarState: AnimationState;
  rewardXP: number;
  rewardGold: number;
  completionDetection: 'navigation' | 'action' | 'timer' | 'element-click';
  targetRoute?: string;
  completionRoute?: string;
  completionSelector?: string;
  completionTimer?: number;
}

export const TOTAL_STEPS = 7;

export const WALKTHROUGH_STEPS: Step[] = [
  // Step 0: "Forge Your Identity" -- Navigate to Profile
  {
    target: '[data-tour="nav-profile"]',
    content:
      'First, we must inscribe your name and abilities in the Guild Registry. The realm cannot match you to worthy quests without knowing your strengths!',
    placement: 'right',
    disableBeacon: true,
    data: {
      avatarState: AnimationState.Pointing,
      rewardXP: 100,
      rewardGold: 50,
      completionDetection: 'action',
      targetRoute: '/profile',
    } as WalkthroughStepData,
  },
  // Step 1: "Survey the Quest Board" -- Navigate to Matches
  {
    target: '[data-tour="nav-matches"]',
    content:
      'Now let us visit the Quest Board. The Guild has opportunities that match your abilities. This way!',
    placement: 'right',
    disableBeacon: true,
    data: {
      avatarState: AnimationState.Pointing,
      rewardXP: 50,
      rewardGold: 0,
      completionDetection: 'timer',
      completionTimer: 5000,
      targetRoute: '/matches',
    } as WalkthroughStepData,
  },
  // Step 2: "Mark Your First Quest" -- Save a role
  {
    target: '[data-tour="save-role-button"]',
    content:
      'A wise adventurer marks the quests that interest them most. Find a role that calls to you and press the "Mark Quest" button to save it!',
    placement: 'bottom',
    disableBeacon: true,
    data: {
      avatarState: AnimationState.Pointing,
      rewardXP: 100,
      rewardGold: 50,
      completionDetection: 'action',
    } as WalkthroughStepData,
  },
  // Step 3: "Chart Your Course" -- Navigate to Roadmap
  {
    target: '[data-tour="nav-roadmap"]',
    content:
      'Every hero needs a map. Let us consult the Oracle of Paths to chart your journey. To the Adventure Path!',
    placement: 'right',
    disableBeacon: true,
    data: {
      avatarState: AnimationState.Excited,
      rewardXP: 500,
      rewardGold: 200,
      completionDetection: 'action',
      targetRoute: '/roadmap',
    } as WalkthroughStepData,
  },
  // Step 4: "Visit the Merchant's Armory" -- Navigate to Store
  {
    target: '[data-tour="nav-store"]',
    content:
      "You have earned gold through your deeds! Let us visit Old Grimshaw at the Merchant's Armory. He has wares that can... enhance your appearance.",
    placement: 'right',
    disableBeacon: true,
    data: {
      avatarState: AnimationState.Excited,
      rewardXP: 50,
      rewardGold: 25,
      completionDetection: 'navigation',
      targetRoute: '/store',
    } as WalkthroughStepData,
  },
  // Step 5: "Don Your Gear" -- Equip first item
  {
    target: '[data-tour="inventory-tab"]',
    content:
      'Switch to your Treasure Chest and equip that aura. You will see the change on me right away!',
    placement: 'bottom',
    disableBeacon: true,
    data: {
      avatarState: AnimationState.Pointing,
      rewardXP: 50,
      rewardGold: 0,
      completionDetection: 'action',
    } as WalkthroughStepData,
  },
  // Step 6: "Return to the Quest Board" -- Closing
  {
    target: 'body',
    content:
      "Your training is complete! As you grow in power, the Adventurer's Guild will offer you side quests for extra rewards. For now, return to the Quest Board and begin your journey in earnest!",
    placement: 'center',
    disableBeacon: true,
    data: {
      avatarState: AnimationState.VictoryPose,
      rewardXP: 0,
      rewardGold: 0,
      completionDetection: 'timer',
      completionTimer: 5000,
    } as WalkthroughStepData,
  },
];

/**
 * Dispatch a walkthrough action event to signal step completion.
 * Components call this when the user performs the required action for the current step.
 *
 * @param step - The walkthrough step index (0-6)
 */
export function dispatchWalkthroughAction(step: number): void {
  window.dispatchEvent(
    new CustomEvent('cedric-walkthrough-action', { detail: { step } })
  );
}
