import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme, themeColors } from '../context/ThemeContext';
import { useAdventureMode, getFantasyText } from '../context/AdventureModeContext';
import api from '../services/api';
import { QUERY_KEYS } from '../services/progressionService';

interface QuestRequirement {
  type: string;
  count: number;
  description: string;
  current_count: number;
  completed: boolean;
}

interface Quest {
  id: string;
  name: string;
  description: string;
  level_required: number;
  xp_reward: number;
  coin_reward: number;
  cosmetic_reward: string | null;
  requirements: QuestRequirement[];
  status: string;
  started_at: string | null;
  completed_at: string | null;
}

interface QuestCatalogResponse {
  quests: Quest[];
}

const questsApi = {
  getCatalog: () =>
    api.get<QuestCatalogResponse>('/quests/catalog').then((r) => r.data),
  getActive: () =>
    api.get<QuestCatalogResponse>('/quests/active').then((r) => r.data),
  getCompleted: () =>
    api.get<QuestCatalogResponse>('/quests/completed').then((r) => r.data),
  startQuest: (questId: string) =>
    api.post(`/quests/${questId}/start`).then((r) => r.data),
};

export default function QuestsPage() {
  const { isDark, isGame } = useTheme();
  const colors = themeColors[isGame ? 'game' : isDark ? 'dark' : 'light'];
  const { state } = useAdventureMode();
  const adventureEnabled = state.enabled;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('available');

  const { data: catalogData, isLoading: catalogLoading } = useQuery({
    queryKey: QUERY_KEYS.questsCatalog,
    queryFn: questsApi.getCatalog,
    staleTime: 30000,
  });

  const { data: activeData, isLoading: activeLoading } = useQuery({
    queryKey: QUERY_KEYS.questsActive,
    queryFn: questsApi.getActive,
    staleTime: 30000,
  });

  const { data: completedData, isLoading: completedLoading } = useQuery({
    queryKey: ['quests', 'completed'],
    queryFn: questsApi.getCompleted,
    staleTime: 30000,
  });

  const startMutation = useMutation({
    mutationFn: (questId: string) => questsApi.startQuest(questId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.progression });
    },
  });

  const currentData =
    activeTab === 'available' ? catalogData
    : activeTab === 'active' ? activeData
    : completedData;

  const isLoading =
    activeTab === 'available' ? catalogLoading
    : activeTab === 'active' ? activeLoading
    : completedLoading;

  const quests = currentData?.quests ?? [];

  // For the available tab, filter to only show quests not yet started
  const displayedQuests =
    activeTab === 'available'
      ? quests.filter((q) => q.status === 'available')
      : quests;

  return (
    <div className="max-w-7xl mx-auto py-6 px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
          {getFantasyText('Quests', adventureEnabled)}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['available', 'active', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-md font-semibold transition-colors capitalize"
            style={{
              backgroundColor: activeTab === tab ? colors.accent : 'transparent',
              color: activeTab === tab ? '#2E2E38' : colors.textPrimary,
              border: `1px solid ${colors.accent}`,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
        </div>
      )}

      {!isLoading && displayedQuests.length === 0 && (
        <div className="text-center py-12" style={{ color: colors.textMuted }}>
          {activeTab === 'available'
            ? 'No quests available at your level.'
            : activeTab === 'active'
            ? 'No active quests. Start one from the Available tab!'
            : 'No completed quests yet.'}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedQuests.map((quest) => (
          <div
            key={quest.id}
            className="p-4 rounded-lg"
            style={{
              backgroundColor: (isDark || isGame) ? 'rgba(255,255,255,0.07)' : colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold uppercase" style={{ color: colors.textMuted }}>
                Level {quest.level_required}+
              </span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded capitalize"
                style={{
                  backgroundColor:
                    quest.status === 'completed'
                      ? 'rgba(34,197,94,0.2)'
                      : quest.status === 'in_progress'
                      ? 'rgba(59,130,246,0.2)'
                      : 'rgba(156,163,175,0.2)',
                  color:
                    quest.status === 'completed'
                      ? '#22c55e'
                      : quest.status === 'in_progress'
                      ? '#3b82f6'
                      : colors.textMuted,
                }}
              >
                {quest.status.replace('_', ' ')}
              </span>
            </div>

            <h3 className="font-semibold mb-1" style={{ color: colors.textPrimary }}>
              {quest.name}
            </h3>
            <p className="text-sm mb-3 line-clamp-2" style={{ color: colors.textMuted }}>
              {quest.description}
            </p>

            {/* Requirements */}
            {quest.requirements.length > 0 && (
              <div className="mb-3 space-y-1">
                {quest.requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span style={{ color: req.completed ? '#22c55e' : colors.textMuted }}>
                      {req.completed ? '[x]' : '[ ]'}
                    </span>
                    <span style={{ color: colors.textSecondary }}>
                      {req.description} ({req.current_count}/{req.count})
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Rewards */}
            <div className="flex gap-3 mb-3 text-sm">
              {quest.xp_reward > 0 && (
                <span style={{ color: '#a855f7' }}>+{quest.xp_reward} XP</span>
              )}
              {quest.coin_reward > 0 && (
                <span style={{ color: '#FFE600' }}>+{quest.coin_reward} Gold</span>
              )}
            </div>

            {/* Start Button */}
            {quest.status === 'available' && (
              <button
                onClick={() => startMutation.mutate(quest.id)}
                disabled={startMutation.isPending}
                className="w-full px-4 py-2 rounded-md font-semibold transition-colors"
                style={{
                  backgroundColor: colors.accent,
                  color: '#2E2E38',
                  opacity: startMutation.isPending ? 0.7 : 1,
                }}
              >
                {startMutation.isPending
                  ? 'Starting...'
                  : getFantasyText('Start Quest', adventureEnabled)}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
