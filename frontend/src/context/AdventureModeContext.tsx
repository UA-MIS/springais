import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { progressionApi, ProgressionState, QUERY_KEYS, ActionResult } from '../services/progressionService';

// Achievement definitions (kept for backward compatibility until Epic 4 replaces with server achievements)
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  goldReward: number;
  condition: string;
}

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

interface AdventureModeState {
  // Core state (from server)
  enabled: boolean;
  totalXP: number;
  gold: number;
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  title: string;
  loginStreak: number;
  lastLoginDate: string | null;

  // Loading state
  loading: boolean;

  // Server-provided counts
  unlockedAchievementsCount: number;

  // Legacy fields (kept for backward compatibility, will be removed in later epics)
  unlockedAchievements: string[];
  completedSkillsCount: number;
  visitedPages: string[];

  // Recent events (for notifications -- client-side only)
  recentXPGain: number | null;
  recentGoldGain: number | null;
  recentAchievement: Achievement | null;
  levelUpPending: boolean;
  newLevel: number | null;
  newTitle: string | null;
  levelUpCoinBonus: number | null;
  unlockedFeatures: string[];

  // Quest completion notification
  recentQuestComplete: {
    questName: string;
    xpReward: number;
    goldReward: number;
    cosmeticReward?: string;
  } | null;
}

interface AdventureModeContextType {
  state: AdventureModeState;

  // Actions
  toggleAdventureMode: () => void;
  enableAdventureMode: () => void;
  disableAdventureMode: () => void;

  // Progression (optimistic client-side updates; server mutations added in Story 8.3)
  addXP: (amount: number, source?: string) => void;
  addGold: (amount: number, source?: string) => void;
  spendGold: (amount: number) => boolean;

  // Achievements (legacy client-side, replaced by server in Epic 4)
  unlockAchievement: (achievementId: string) => void;
  getAchievements: () => Achievement[];
  isAchievementUnlocked: (achievementId: string) => boolean;

  // Progress tracking
  incrementSkillsCompleted: () => void;
  trackPageVisit: (page: string) => void;

  // Server mutations (Story 8.3)
  recordLogin: () => void;
  recordVisit: (page: string) => void;

  // Notifications
  clearRecentXP: () => void;
  clearRecentGold: () => void;
  clearRecentAchievement: () => void;
  clearLevelUp: () => void;
  clearQuestComplete: () => void;
}

const AdventureModeContext = createContext<AdventureModeContextType | undefined>(
  undefined
);

export function AdventureModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch progression from server (Story 8.2)
  const { data: progression, isLoading } = useQuery<ProgressionState>({
    queryKey: QUERY_KEYS.progression,
    queryFn: progressionApi.getProgression,
    enabled: !!user,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  // Toggle adventure mode via API mutation
  const toggleMutation = useMutation({
    mutationFn: progressionApi.toggleAdventureMode,
    onSuccess: (data) => {
      queryClient.setQueryData<ProgressionState>(QUERY_KEYS.progression, (old) =>
        old
          ? { ...old, adventure_mode_enabled: data.adventure_mode_enabled }
          : old
      );
    },
  });

  // Record login mutation (Story 8.3)
  const loginMutation = useMutation({
    mutationFn: progressionApi.recordLogin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progression });
    },
  });

  // Record visit mutation (Story 8.3)
  const visitMutation = useMutation({
    mutationFn: progressionApi.recordVisit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progression });
    },
  });

  // Notification state (client-side only, not persisted)
  const [recentXPGain, setRecentXPGain] = useState<number | null>(null);
  const [recentGoldGain, setRecentGoldGain] = useState<number | null>(null);
  const [recentAchievement, setRecentAchievement] =
    useState<Achievement | null>(null);
  const [levelUpPending, setLevelUpPending] = useState(false);
  const [newLevel, setNewLevel] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState<string | null>(null);
  const [levelUpCoinBonus, setLevelUpCoinBonus] = useState<number | null>(null);
  const [unlockedFeatures, setUnlockedFeatures] = useState<string[]>([]);
  const [recentQuestComplete, setRecentQuestComplete] = useState<AdventureModeState['recentQuestComplete']>(null);

  // Legacy client-side state (kept until Epics 4/5 replace with server equivalents)
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(
    []
  );
  const [completedSkillsCount, setCompletedSkillsCount] = useState(0);
  const [visitedPages, setVisitedPages] = useState<string[]>([]);

  // Derive state from server data. When not logged in or not loaded, use defaults.
  // AC #5: On logout, state is cleared (user becomes null, so serverData is null).
  const serverData = user ? progression : undefined;
  const enabled = serverData?.adventure_mode_enabled ?? false;
  const totalXP = serverData?.xp_total ?? 0;
  const gold = serverData?.coin_balance ?? 0;
  const level = serverData?.level ?? 1;
  const title = serverData?.title ?? 'Apprentice';
  const loginStreak = serverData?.login_streak ?? 0;
  const lastLoginDate = serverData?.last_login_date ?? null;
  const currentXP = serverData?.current_level_xp ?? 0;
  const xpToNextLevel = serverData?.xp_to_next_level ?? 0;

  // Actions
  const toggleAdventureMode = useCallback(() => {
    if (user) {
      toggleMutation.mutate();
    }
  }, [user, toggleMutation]);

  const enableAdventureMode = useCallback(() => {
    if (user && !enabled) {
      toggleMutation.mutate();
    }
  }, [user, enabled, toggleMutation]);

  const disableAdventureMode = useCallback(() => {
    if (user && enabled) {
      toggleMutation.mutate();
    }
  }, [user, enabled, toggleMutation]);

  // Progression actions -- optimistic client-side updates with deferred server refetch.
  const addXP = useCallback(
    (amount: number, _source?: string) => {
      setRecentXPGain(amount);
      queryClient.setQueryData<ProgressionState>(QUERY_KEYS.progression, (old) => {
        if (!old) return old;
        return { ...old, xp_total: old.xp_total + amount };
      });
      setTimeout(() => setRecentXPGain(null), 3000);
      // Refetch real server values after a short delay so HUD shows persisted data
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progression });
      }, 1500);
    },
    [queryClient]
  );

  const addGold = useCallback(
    (amount: number, _source?: string) => {
      setRecentGoldGain(amount);
      queryClient.setQueryData<ProgressionState>(QUERY_KEYS.progression, (old) => {
        if (!old) return old;
        return { ...old, coin_balance: old.coin_balance + amount };
      });
      setTimeout(() => setRecentGoldGain(null), 3000);
      // Refetch real server values after a short delay so HUD shows persisted data
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progression });
      }, 1500);
    },
    [queryClient]
  );

  const spendGold = useCallback(
    (amount: number): boolean => {
      if (gold >= amount) {
        queryClient.setQueryData<ProgressionState>(QUERY_KEYS.progression, (old) => {
          if (!old) return old;
          return { ...old, coin_balance: old.coin_balance - amount };
        });
        return true;
      }
      return false;
    },
    [gold, queryClient]
  );

  // Map frontend achievement IDs to backend event types
  const EVENT_MAP: Record<string, string> = {
    first_match: 'first_match_view',
    save_role: 'role_saved',
    create_roadmap: 'roadmap_generated',
    first_login: 'first_login',
    complete_milestone: 'milestone_passed',
    profile_complete: 'profile_completed',
    explorer: 'explorer_completed',
  };

  // Action mutation for firing gamification events
  const actionMutation = useMutation({
    mutationFn: progressionApi.recordAction,
    onSuccess: (data: ActionResult) => {
      if (data.already_awarded) return;

      // Show achievement notification if any were unlocked
      if (data.achievements_unlocked.length > 0) {
        const first = data.achievements_unlocked[0];
        const achievement = ACHIEVEMENTS.find((a) => a.id === first.id) || {
          id: first.id,
          name: first.name,
          description: first.description,
          icon: '🏆',
          xpReward: first.xp_reward,
          goldReward: first.coin_reward,
          condition: '',
        };
        setUnlockedAchievements((prev) =>
          data.achievements_unlocked.reduce(
            (acc, a) => (acc.includes(a.id) ? acc : [...acc, a.id]),
            prev
          )
        );
        setRecentAchievement(achievement);
        setTimeout(() => setRecentAchievement(null), 5000);
      }

      // Show XP/Gold notifications
      if (data.xp_awarded > 0) {
        setRecentXPGain(data.xp_awarded);
        setTimeout(() => setRecentXPGain(null), 3000);
      }
      if (data.coins_awarded > 0) {
        setRecentGoldGain(data.coins_awarded);
        setTimeout(() => setRecentGoldGain(null), 3000);
      }

      // Handle level up
      if (data.level_up && data.new_level) {
        setLevelUpPending(true);
        setNewLevel(data.new_level);
        setNewTitle(data.new_title);
      }

      // Refetch progression to update HUD immediately
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progression });
      // Refetch achievements catalog so the panel shows updated unlock status
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.achievementsCatalog });
    },
  });

  // Achievement unlock -- fires backend event for persistence and reward
  const unlockAchievement = useCallback(
    (achievementId: string) => {
      if (unlockedAchievements.includes(achievementId)) return;
      const eventType = EVENT_MAP[achievementId] || achievementId;
      actionMutation.mutate(eventType);
    },
    [unlockedAchievements, actionMutation]
  );

  const getAchievements = useCallback(() => ACHIEVEMENTS, []);

  const isAchievementUnlocked = useCallback(
    (achievementId: string) => unlockedAchievements.includes(achievementId),
    [unlockedAchievements]
  );

  // Sync unlocked achievements from server on initial load
  // (so isAchievementUnlocked works after page refresh)
  const serverAchievementCount = serverData?.unlocked_achievements_count ?? 0;
  // We track IDs client-side; the count comes from server.
  // The HUD uses serverAchievementCount directly.

  const incrementSkillsCompleted = useCallback(() => {
    setCompletedSkillsCount((prev) => prev + 1);
  }, []);

  const trackPageVisit = useCallback(
    (page: string) => {
      if (!visitedPages.includes(page)) {
        setVisitedPages((prev) => [...prev, page]);
      }
    },
    [visitedPages]
  );

  // Server mutation wrappers (Story 8.3)
  const recordLogin = useCallback(() => {
    if (user) {
      loginMutation.mutate();
    }
  }, [user, loginMutation]);

  const recordVisit = useCallback(
    (page: string) => {
      if (user) {
        visitMutation.mutate(page);
      }
    },
    [user, visitMutation]
  );

  // Notification helpers
  const clearRecentXP = useCallback(() => setRecentXPGain(null), []);
  const clearRecentGold = useCallback(() => setRecentGoldGain(null), []);
  const clearRecentAchievement = useCallback(
    () => setRecentAchievement(null),
    []
  );
  const clearLevelUp = useCallback(() => {
    setLevelUpPending(false);
    setNewLevel(null);
    setNewTitle(null);
    setLevelUpCoinBonus(null);
    setUnlockedFeatures([]);
  }, []);

  const clearQuestComplete = useCallback(() => setRecentQuestComplete(null), []);

  const unlockedAchievementsCount = Math.max(
    serverData?.unlocked_achievements_count ?? 0,
    unlockedAchievements.length
  );

  const state: AdventureModeState = {
    enabled,
    totalXP,
    gold,
    level,
    currentXP,
    xpToNextLevel,
    title,
    loginStreak,
    lastLoginDate,
    loading: !!user && isLoading,
    unlockedAchievementsCount,
    unlockedAchievements,
    completedSkillsCount,
    visitedPages,
    recentXPGain,
    recentGoldGain,
    recentAchievement,
    levelUpPending,
    newLevel,
    newTitle,
    levelUpCoinBonus,
    unlockedFeatures,
    recentQuestComplete,
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
        recordLogin,
        recordVisit,
        clearRecentXP,
        clearRecentGold,
        clearRecentAchievement,
        clearLevelUp,
        clearQuestComplete,
      }}
    >
      {children}
    </AdventureModeContext.Provider>
  );
}

export function useAdventureMode() {
  const context = useContext(AdventureModeContext);
  if (!context) {
    throw new Error(
      'useAdventureMode must be used within AdventureModeProvider'
    );
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
  Store: "Merchant's Armory",
  Quests: "Adventurer's Guild",
  'Success Patterns': 'Victory Scrolls',

  // Page titles
  'Role Matches': 'Available Quests',
  Profile: 'Character Stats',

  // Actions
  Save: 'Mark Quest',
  'Save Role': 'Mark Quest',
  Generate: 'Forge Path',
  'Generate Roadmap': 'Forge Your Path',
  Complete: 'Conquer',
  'View Details': 'Inspect Quest',
  View: 'Inspect',

  // Status
  'In Progress': 'Active Quest',
  Completed: 'Victory!',
  Pending: 'Awaiting Hero',
  'Not Started': 'Uncharted',

  // Metrics
  'Match Score': 'Destiny Alignment',
  Skills: 'Abilities',
  Experience: 'Battle Wisdom',
  Progress: 'Journey Progress',
  'Skill Gap': 'Abilities to Master',
  'Required Skills': 'Required Abilities',

  // Roles
  'Current Role': 'Current Class',
  'Target Role': 'Destiny Class',
  Recommended: 'Fate-Chosen',

  // Economy & Store (FR-026.1)
  Inventory: 'Treasure Chest',
  Purchase: 'Acquire',
  Equip: 'Don',
  Unequip: 'Remove',
  Coins: 'Gold',
  'Side Quest': 'Adventure',
  'Start Quest': 'Accept Quest',
  'Level Up': 'Promotion',

  // Misc
  Dashboard: 'Command Center',
  Settings: 'Preferences',
  Logout: 'Rest at Camp',
  Search: 'Seek',
  Filter: 'Refine Search',
};

export function getFantasyText(text: string, adventureMode: boolean): string {
  if (!adventureMode) return text;
  return fantasyText[text] || text;
}

// Export Achievement type for use in components
export type { Achievement };
