/**
 * Centralized dialogue configuration for Cedric avatar companion.
 * All messages in both medieval (adventure mode) and modern variants.
 * D-CA-004: Priority speech queue with anti-annoyance protocol.
 */

export interface MessageVariant {
  medieval: string;
  modern: string;
}

/**
 * Returns the appropriate text variant based on adventure mode state.
 */
export function getCedricText(variant: MessageVariant, adventureEnabled: boolean): string {
  return adventureEnabled ? variant.medieval : variant.modern;
}

// ---------------------------------------------------------------------------
// Walkthrough Dialogue (7 steps + intro + maybe-later + completion)
// ---------------------------------------------------------------------------

export const WALKTHROUGH_MESSAGES = {
  intro: {
    medieval: 'Hail, traveler! I am Cedric, your guide through the realm of SpringAIS.',
    modern: 'Welcome to SpringAIS! I\'m Cedric, your guide -- let me show you around.',
  } as MessageVariant,

  maybeLater: {
    medieval: 'No worries! Want a quick tour without the medieval flair?',
    modern: 'No problem! Want a quick tour of the platform instead?',
  } as MessageVariant,

  maybeLaterExplore: {
    medieval: 'Very well -- I shall wait here if you change your mind!',
    modern: 'Got it -- I\'ll be here if you need help later!',
  } as MessageVariant,

  steps: [
    // Step 0: Forge Your Identity - Navigate to Profile
    {
      medieval: 'First, we must inscribe your name and abilities in the Guild Registry. The realm cannot match you to worthy quests without knowing your strengths!',
      modern: 'First, let\'s set up your profile. Upload your resume so we can find the best role matches for you!',
    } as MessageVariant,
    // Step 1: Survey the Quest Board - Navigate to Matches
    {
      medieval: 'Now let us visit the Quest Board -- the Guild has opportunities matched to your abilities!',
      modern: 'Now let\'s check out your matched roles, positions that fit your skills and experience.',
    } as MessageVariant,
    // Step 2: Mark Your First Quest - Save a role
    {
      medieval: 'A wise adventurer marks the quests that interest them most. Find a role that calls to you and press the "Mark Quest" button!',
      modern: 'Save a role that interests you by clicking the save button. This adds it to your saved roles list.',
    } as MessageVariant,
    // Step 3: Chart Your Course - Navigate to Roadmap
    {
      medieval: 'Every hero needs a map -- let us consult the Oracle of Paths to chart your journey!',
      modern: 'Let\'s create your personalized career roadmap to outline the skills you need.',
    } as MessageVariant,
    // Step 4: Visit the Merchant's Armory - Navigate to Store
    {
      medieval: 'You have earned gold through your deeds! Let us visit Old Grimshaw at the Merchant\'s Armory.',
      modern: 'You\'ve earned some coins! Let\'s visit the store to customize your avatar.',
    } as MessageVariant,
    // Step 5: Don Your Gear - Equip first item
    {
      medieval: 'Switch to your Treasure Chest and equip that aura. You will see the change on me right away!',
      modern: 'Go to your inventory tab and equip an item. You\'ll see the changes on the avatar immediately!',
    } as MessageVariant,
    // Step 6: Return to the Quest Board - Closing
    {
      medieval: 'Your training is complete! As you grow in power, the Guild will offer side quests for extra rewards.',
      modern: 'You\'re all set! As you level up, you\'ll unlock side quests for bonus rewards.',
    } as MessageVariant,
  ],

  completion: {
    medieval: 'I am proud to call you my companion, adventurer. May your path be ever bright!',
    modern: 'Great job completing the tour! I\'m here whenever you need guidance.',
  } as MessageVariant,
} as const;

// ---------------------------------------------------------------------------
// Page-Specific Messages
// ---------------------------------------------------------------------------

export const PAGE_MESSAGES = {
  '/matches': {
    firstVisit: {
      medieval: 'Welcome to the Quest Board! Each card shows a role matched to your abilities. Save the ones that interest you.',
      modern: 'Welcome to your matched roles! Each card shows a role based on your skills. Save the ones you like.',
    } as MessageVariant,
    return: [
      {
        medieval: 'Back to scout for opportunities? The realm always has new quests.',
        modern: 'Checking for new matches? Great habit!',
      } as MessageVariant,
    ],
    empty: {
      medieval: 'Hmm, the Quest Board is empty. Have you uploaded your scroll of abilities on the Hero Sheet?',
      modern: 'No matches yet. Try uploading your resume on the Profile page.',
    } as MessageVariant,
  },
  '/profile': {
    firstVisit: {
      medieval: 'This is your Hero Sheet. Upload your scroll of abilities and the Guild shall find quests worthy of your talents.',
      modern: 'This is your profile page. Upload your resume to get personalized role matches.',
    } as MessageVariant,
    return: [
      {
        medieval: 'Updating your scroll? A wise decision. The Guild rewards those who keep their records current.',
        modern: 'Keeping your profile updated helps improve your match quality.',
      } as MessageVariant,
    ],
  },
  '/saved': {
    firstVisit: {
      medieval: 'Your Quest Log holds the roles you have marked. Review them here and chart your next adventure.',
      modern: 'Your saved roles are collected here. Review them to plan your next career move.',
    } as MessageVariant,
    return: [
      {
        medieval: 'Reviewing your marked quests? A focused adventurer is a successful one.',
        modern: 'Reviewing your saved roles? Staying organized is key to a good job search.',
      } as MessageVariant,
    ],
  },
  '/roadmap': {
    firstVisit: {
      medieval: 'The Oracle has charted your Adventure Path! Follow the milestones to grow stronger.',
      modern: 'Here is your career roadmap! Follow the milestones to build your skills systematically.',
    } as MessageVariant,
    return: [
      {
        medieval: 'Checking your progress on the Adventure Path? Every step forward counts.',
        modern: 'Reviewing your roadmap progress? Consistency is the key to growth.',
      } as MessageVariant,
    ],
  },
  '/store': {
    firstVisit: {
      medieval: 'Welcome to Old Grimshaw\'s Armory! Spend your hard-earned gold on gear to customize your appearance.',
      modern: 'Welcome to the store! Use your earned coins to unlock cosmetic items for your avatar.',
    } as MessageVariant,
    return: [
      {
        medieval: 'Back for more wares? Grimshaw always has something new on the shelves.',
        modern: 'Looking to customize your avatar? Check out the latest items available.',
      } as MessageVariant,
    ],
  },
  '/quests': {
    firstVisit: {
      medieval: 'The Adventurer\'s Guild offers side quests for those brave enough. Complete them for gold and glory!',
      modern: 'Side quests offer bonus rewards for completing platform activities. Check them out!',
    } as MessageVariant,
    return: [
      {
        medieval: 'Seeking more adventures? The Guild always has tasks for eager heroes.',
        modern: 'Looking for more challenges? Check your active quests for bonus rewards.',
      } as MessageVariant,
    ],
  },
  '/success-patterns': {
    firstVisit: {
      medieval: 'The Victory Scrolls contain wisdom from those who conquered similar paths before you.',
      modern: 'Success patterns show insights from people who transitioned into similar roles.',
    } as MessageVariant,
    return: [
      {
        medieval: 'Studying the scrolls again? Knowledge is the sharpest blade.',
        modern: 'Reviewing success patterns is a great way to learn from others\' experiences.',
      } as MessageVariant,
    ],
  },
} as const;

// ---------------------------------------------------------------------------
// Error & Loading Messages
// ---------------------------------------------------------------------------

export const ERROR_MESSAGE: MessageVariant = {
  medieval: 'Something went awry in the realm. The scribes are investigating the disturbance.',
  modern: 'Something went wrong. Our team is looking into the issue.',
};

export const LOADING_MESSAGES = {
  generic: {
    medieval: 'One moment, adventurer...',
    modern: 'Loading...',
  } as MessageVariant,

  oraclePhases: [
    {
      medieval: 'Ah, you seek the Oracle\'s wisdom! Let me consult the ancient tomes...',
      modern: 'Starting your career path analysis...',
    } as MessageVariant,
    {
      medieval: 'The scribes are studying your skills and achievements. Your abilities are impressive!',
      modern: 'Analyzing your skills and experience...',
    } as MessageVariant,
    {
      medieval: 'The cartographers are mapping your optimal path through the realm...',
      modern: 'Mapping your optimal learning path...',
    } as MessageVariant,
    {
      medieval: 'Your destiny is nearly revealed. The stars are aligning in your favor!',
      modern: 'Almost done -- finalizing your personalized roadmap...',
    } as MessageVariant,
    {
      medieval: 'Any moment now. The Oracle works to ensure every detail is perfect.',
      modern: 'Putting the finishing touches on your roadmap...',
    } as MessageVariant,
  ],
} as const;
