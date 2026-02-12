import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Achievement definitions
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  goldReward: number;
  condition: string;
}

// Predefined achievements
const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_login',
    name: 'The Journey Begins',
    description: 'Log into SkillBridge for the first time',
    icon: '🏰',
    xpReward: 100,
    goldReward: 50,
    condition: 'First login',
  },
  {
    id: 'first_match',
    name: 'Seeker of Destiny',
    description: 'View your first role match',
    icon: '🔮',
    xpReward: 150,
    goldReward: 75,
    condition: 'View match results',
  },
  {
    id: 'save_role',
    name: 'Marked for Greatness',
    description: 'Save a role to your quest log',
    icon: '📜',
    xpReward: 100,
    goldReward: 50,
    condition: 'Save a role',
  },
  {
    id: 'create_roadmap',
    name: 'Path Forged',
    description: 'Create your first career roadmap',
    icon: '🗺️',
    xpReward: 500,
    goldReward: 200,
    condition: 'Generate a roadmap',
  },
  {
    id: 'complete_milestone',
    name: 'Milestone Conquered',
    description: 'Complete a roadmap milestone',
    icon: '⚔️',
    xpReward: 300,
    goldReward: 150,
    condition: 'Mark milestone complete',
  },
  {
    id: 'level_5',
    name: 'Apprentice',
    description: 'Reach level 5',
    icon: '🌟',
    xpReward: 0,
    goldReward: 500,
    condition: 'Reach level 5',
  },
  {
    id: 'level_10',
    name: 'Journeyman',
    description: 'Reach level 10',
    icon: '✨',
    xpReward: 0,
    goldReward: 1000,
    condition: 'Reach level 10',
  },
  {
    id: 'level_20',
    name: 'Expert',
    description: 'Reach level 20',
    icon: '💫',
    xpReward: 0,
    goldReward: 2500,
    condition: 'Reach level 20',
  },
  {
    id: 'skill_master',
    name: 'Skill Master',
    description: 'Complete 5 skills in your roadmap',
    icon: '🎯',
    xpReward: 400,
    goldReward: 200,
    condition: 'Complete 5 skills',
  },
  {
    id: 'daily_login_3',
    name: 'Dedicated Adventurer',
    description: 'Log in 3 days in a row',
    icon: '🔥',
    xpReward: 200,
    goldReward: 100,
    condition: '3-day streak',
  },
  {
    id: 'daily_login_7',
    name: 'Steadfast Hero',
    description: 'Log in 7 days in a row',
    icon: '🔥',
    xpReward: 500,
    goldReward: 300,
    condition: '7-day streak',
  },
  {
    id: 'mini_game_master',
    name: 'Game Champion',
    description: 'Win a mini-game',
    icon: '🎮',
    xpReward: 150,
    goldReward: 100,
    condition: 'Win mini-game',
  },
  {
    id: 'profile_complete',
    name: 'Identity Forged',
    description: 'Complete your profile information',
    icon: '🛡️',
    xpReward: 200,
    goldReward: 100,
    condition: 'Complete profile',
  },
  {
    id: 'explorer',
    name: 'Realm Explorer',
    description: 'Visit all sections of the platform',
    icon: '🧭',
    xpReward: 150,
    goldReward: 75,
    condition: 'Visit all pages',
  },
];

// XP required for each level (exponential curve)
function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Calculate level from total XP
function levelFromXP(totalXP: number): { level: number; currentXP: number; xpToNext: number } {
  let level = 1;
  let xpRemaining = totalXP;

  while (xpRemaining >= xpForLevel(level)) {
    xpRemaining -= xpForLevel(level);
    level++;
  }

  return {
    level,
    currentXP: xpRemaining,
    xpToNext: xpForLevel(level),
  };
}

// Get title based on level
function getTitleForLevel(level: number): string {
  if (level < 5) return 'Novice';
  if (level < 10) return 'Apprentice';
  if (level < 15) return 'Journeyman';
  if (level < 20) return 'Adept';
  if (level < 25) return 'Expert';
  if (level < 30) return 'Master';
  if (level < 40) return 'Grandmaster';
  return 'Legend';
}

interface AdventureModeState {
  // Core state
  enabled: boolean;
  totalXP: number;
  gold: number;
  unlockedAchievements: string[];
  loginStreak: number;
  lastLoginDate: string | null;
  completedSkillsCount: number;
  visitedPages: string[];

  // Computed
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  title: string;

  // Recent events (for notifications)
  recentXPGain: number | null;
  recentGoldGain: number | null;
  recentAchievement: Achievement | null;
  levelUpPending: boolean;
  newLevel: number | null;
}

interface AdventureModeContextType {
  state: AdventureModeState;

  // Actions
  toggleAdventureMode: () => void;
  enableAdventureMode: () => void;
  disableAdventureMode: () => void;

  // Progression
  addXP: (amount: number, source?: string) => void;
  addGold: (amount: number, source?: string) => void;
  spendGold: (amount: number) => boolean;

  // Achievements
  unlockAchievement: (achievementId: string) => void;
  getAchievements: () => Achievement[];
  isAchievementUnlocked: (achievementId: string) => boolean;

  // Progress tracking
  incrementSkillsCompleted: () => void;
  trackPageVisit: (page: string) => void;

  // Notifications
  clearRecentXP: () => void;
  clearRecentGold: () => void;
  clearRecentAchievement: () => void;
  clearLevelUp: () => void;

  // Mini-game
  completeMiniGame: (won: boolean, goldEarned: number) => void;
}

const AdventureModeContext = createContext<AdventureModeContextType | undefined>(undefined);

const STORAGE_KEY = 'springais-adventure-mode';

function loadState(): Partial<AdventureModeState> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load adventure mode state:', e);
  }
  return {};
}

function saveState(state: Partial<AdventureModeState>) {
  try {
    const toSave = {
      enabled: state.enabled,
      totalXP: state.totalXP,
      gold: state.gold,
      unlockedAchievements: state.unlockedAchievements,
      loginStreak: state.loginStreak,
      lastLoginDate: state.lastLoginDate,
      completedSkillsCount: state.completedSkillsCount,
      visitedPages: state.visitedPages,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Failed to save adventure mode state:', e);
  }
}

export function AdventureModeProvider({ children }: { children: ReactNode }) {
  const savedState = loadState();

  const [enabled, setEnabled] = useState(savedState.enabled ?? false);
  const [totalXP, setTotalXP] = useState(savedState.totalXP ?? 0);
  const [gold, setGold] = useState(savedState.gold ?? 100); // Start with 100 gold
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(
    savedState.unlockedAchievements ?? []
  );
  const [loginStreak, setLoginStreak] = useState(savedState.loginStreak ?? 0);
  const [lastLoginDate, setLastLoginDate] = useState<string | null>(
    savedState.lastLoginDate ?? null
  );
  const [completedSkillsCount, setCompletedSkillsCount] = useState(
    savedState.completedSkillsCount ?? 0
  );
  const [visitedPages, setVisitedPages] = useState<string[]>(
    savedState.visitedPages ?? []
  );

  // Notification state (not persisted)
  const [recentXPGain, setRecentXPGain] = useState<number | null>(null);
  const [recentGoldGain, setRecentGoldGain] = useState<number | null>(null);
  const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null);
  const [levelUpPending, setLevelUpPending] = useState(false);
  const [newLevel, setNewLevel] = useState<number | null>(null);

  // Calculate level info
  const { level, currentXP, xpToNext } = levelFromXP(totalXP);
  const title = getTitleForLevel(level);

  // Unlock achievement helper - defined before useEffects that use it
  const unlockAchievementInternal = useCallback((achievementId: string, skipRewards = false) => {
    if (unlockedAchievements.includes(achievementId)) return;

    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return;

    setUnlockedAchievements(prev => [...prev, achievementId]);
    setRecentAchievement(achievement);

    // Grant rewards (unless skipped to prevent loops)
    if (!skipRewards) {
      if (achievement.xpReward > 0) {
        setTotalXP(prev => prev + achievement.xpReward);
        setRecentXPGain(prev => (prev || 0) + achievement.xpReward);
      }
      if (achievement.goldReward > 0) {
        setGold(prev => prev + achievement.goldReward);
        setRecentGoldGain(prev => (prev || 0) + achievement.goldReward);
      }
    }

    // Auto-clear notification after 5 seconds
    setTimeout(() => setRecentAchievement(null), 5000);
  }, [unlockedAchievements]);

  // Check login streak on mount
  useEffect(() => {
    const today = new Date().toDateString();
    if (lastLoginDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastLoginDate === yesterday.toDateString()) {
        // Consecutive day
        setLoginStreak(prev => prev + 1);
      } else if (lastLoginDate !== null) {
        // Streak broken
        setLoginStreak(1);
      } else {
        // First login ever
        setLoginStreak(1);
      }
      setLastLoginDate(today);
    }
  }, [lastLoginDate]);

  // Persist state changes
  useEffect(() => {
    saveState({
      enabled,
      totalXP,
      gold,
      unlockedAchievements,
      loginStreak,
      lastLoginDate,
      completedSkillsCount,
      visitedPages,
    });
  }, [enabled, totalXP, gold, unlockedAchievements, loginStreak, lastLoginDate, completedSkillsCount, visitedPages]);

  // Check for level-based achievements
  useEffect(() => {
    if (level >= 5 && !unlockedAchievements.includes('level_5')) {
      unlockAchievementInternal('level_5', true);
    }
    if (level >= 10 && !unlockedAchievements.includes('level_10')) {
      unlockAchievementInternal('level_10', true);
    }
    if (level >= 20 && !unlockedAchievements.includes('level_20')) {
      unlockAchievementInternal('level_20', true);
    }
  }, [level, unlockedAchievements, unlockAchievementInternal]);

  // Check for login streak achievements
  useEffect(() => {
    if (loginStreak >= 3 && !unlockedAchievements.includes('daily_login_3')) {
      unlockAchievementInternal('daily_login_3');
    }
    if (loginStreak >= 7 && !unlockedAchievements.includes('daily_login_7')) {
      unlockAchievementInternal('daily_login_7');
    }
  }, [loginStreak, unlockedAchievements, unlockAchievementInternal]);

  // Check for skills completed achievement
  useEffect(() => {
    if (completedSkillsCount >= 5 && !unlockedAchievements.includes('skill_master')) {
      unlockAchievementInternal('skill_master');
    }
  }, [completedSkillsCount, unlockedAchievements, unlockAchievementInternal]);

  // Check for explorer achievement
  useEffect(() => {
    const requiredPages = ['/matches', '/profile', '/saved', '/roadmap'];
    const hasVisitedAll = requiredPages.every(page => visitedPages.includes(page));
    if (hasVisitedAll && !unlockedAchievements.includes('explorer')) {
      unlockAchievementInternal('explorer');
    }
  }, [visitedPages, unlockedAchievements, unlockAchievementInternal]);

  // Grant first login achievement
  useEffect(() => {
    if (enabled && !unlockedAchievements.includes('first_login')) {
      unlockAchievementInternal('first_login');
    }
  }, [enabled, unlockedAchievements, unlockAchievementInternal]);

  const toggleAdventureMode = useCallback(() => {
    setEnabled(prev => !prev);
  }, []);

  const enableAdventureMode = useCallback(() => {
    setEnabled(true);
  }, []);

  const disableAdventureMode = useCallback(() => {
    setEnabled(false);
  }, []);

  const addXP = useCallback((amount: number, _source?: string) => {
    const prevLevel = levelFromXP(totalXP).level;
    const newTotalXP = totalXP + amount;
    setTotalXP(newTotalXP);
    setRecentXPGain(amount);

    // Check for level up
    const newLevelInfo = levelFromXP(newTotalXP);
    if (newLevelInfo.level > prevLevel) {
      setLevelUpPending(true);
      setNewLevel(newLevelInfo.level);
      // Grant bonus gold on level up
      const levelUpGold = newLevelInfo.level * 25;
      setGold(prev => prev + levelUpGold);
    }

    // Auto-clear notification after 3 seconds
    setTimeout(() => setRecentXPGain(null), 3000);
  }, [totalXP]);

  const addGold = useCallback((amount: number, _source?: string) => {
    setGold(prev => prev + amount);
    setRecentGoldGain(amount);

    // Auto-clear notification after 3 seconds
    setTimeout(() => setRecentGoldGain(null), 3000);
  }, []);

  const spendGold = useCallback((amount: number): boolean => {
    if (gold >= amount) {
      setGold(prev => prev - amount);
      return true;
    }
    return false;
  }, [gold]);

  const unlockAchievement = useCallback((achievementId: string) => {
    unlockAchievementInternal(achievementId);
  }, [unlockAchievementInternal]);

  const getAchievements = useCallback(() => ACHIEVEMENTS, []);

  const isAchievementUnlocked = useCallback(
    (achievementId: string) => unlockedAchievements.includes(achievementId),
    [unlockedAchievements]
  );

  const incrementSkillsCompleted = useCallback(() => {
    setCompletedSkillsCount(prev => prev + 1);
    // Grant XP for completing a skill
    addXP(75, 'Skill completed');
    addGold(25, 'Skill completed');
  }, [addXP, addGold]);

  const trackPageVisit = useCallback((page: string) => {
    if (!visitedPages.includes(page)) {
      setVisitedPages(prev => [...prev, page]);
    }
  }, [visitedPages]);

  const clearRecentXP = useCallback(() => setRecentXPGain(null), []);
  const clearRecentGold = useCallback(() => setRecentGoldGain(null), []);
  const clearRecentAchievement = useCallback(() => setRecentAchievement(null), []);
  const clearLevelUp = useCallback(() => {
    setLevelUpPending(false);
    setNewLevel(null);
  }, []);

  const completeMiniGame = useCallback((won: boolean, goldEarned: number) => {
    if (won) {
      addGold(goldEarned, 'Mini-game');
      addXP(50, 'Mini-game victory');
      if (!unlockedAchievements.includes('mini_game_master')) {
        unlockAchievement('mini_game_master');
      }
    } else {
      addXP(25, 'Mini-game participation');
    }
  }, [addGold, addXP, unlockedAchievements, unlockAchievement]);

  const state: AdventureModeState = {
    enabled,
    totalXP,
    gold,
    unlockedAchievements,
    loginStreak,
    lastLoginDate,
    completedSkillsCount,
    visitedPages,
    level,
    currentXP,
    xpToNextLevel: xpToNext,
    title,
    recentXPGain,
    recentGoldGain,
    recentAchievement,
    levelUpPending,
    newLevel,
  };

  return (
    <AdventureModeContext.Provider
      value={{
        state,
        toggleAdventureMode,
        enableAdventureMode,
        disableAdventureMode,
        addXP,
        addGold,
        spendGold,
        unlockAchievement,
        getAchievements,
        isAchievementUnlocked,
        incrementSkillsCompleted,
        trackPageVisit,
        clearRecentXP,
        clearRecentGold,
        clearRecentAchievement,
        clearLevelUp,
        completeMiniGame,
      }}
    >
      {children}
    </AdventureModeContext.Provider>
  );
}

export function useAdventureMode() {
  const context = useContext(AdventureModeContext);
  if (!context) {
    throw new Error('useAdventureMode must be used within AdventureModeProvider');
  }
  return context;
}

// Fantasy text mappings for adventure mode
export const fantasyText: Record<string, string> = {
  // Navigation
  'Match Results': 'Quest Board',
  'My Profile': 'Hero Sheet',
  'Saved Roles': 'Quest Log',
  'Career Roadmap': 'Adventure Path',

  // Page titles
  'Role Matches': 'Available Quests',
  'Profile': 'Character Stats',

  // Actions
  'Save': 'Mark Quest',
  'Save Role': 'Mark Quest',
  'Generate': 'Forge Path',
  'Generate Roadmap': 'Forge Your Path',
  'Complete': 'Conquer',
  'View Details': 'Inspect Quest',
  'View': 'Inspect',

  // Status
  'In Progress': 'Active Quest',
  'Completed': 'Victory!',
  'Pending': 'Awaiting Hero',
  'Not Started': 'Uncharted',

  // Metrics
  'Match Score': 'Destiny Alignment',
  'Skills': 'Abilities',
  'Experience': 'Battle Wisdom',
  'Progress': 'Journey Progress',
  'Skill Gap': 'Abilities to Master',
  'Required Skills': 'Required Abilities',

  // Roles
  'Current Role': 'Current Class',
  'Target Role': 'Destiny Class',
  'Recommended': 'Fate-Chosen',

  // Misc
  'Dashboard': 'Command Center',
  'Settings': 'Preferences',
  'Logout': 'Rest at Camp',
  'Search': 'Seek',
  'Filter': 'Refine Search',
};

export function getFantasyText(text: string, adventureMode: boolean): string {
  if (!adventureMode) return text;
  return fantasyText[text] || text;
}

// Export Achievement type for use in components
export type { Achievement };
