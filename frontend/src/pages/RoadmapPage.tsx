/**
 * RoadmapPage - Career Roadmap Management
 *
 * Views:
 * - List: Shows saved roadmaps with option to create new
 * - Create: Role selection and customization for new roadmap
 * - View: Tabular viewer with progress tracking (uses RoadmapViewer)
 */

import { useState, useEffect } from 'react';
import { useTheme, themeColors } from '../context/ThemeContext';
import { useSavedRoles } from '../context/SavedRolesContext';
import { RoadmapProvider } from '../context/RoadmapContext';
import { RoadmapViewer } from '../components/roadmap';
import { useAdventureMode, getFantasyText } from '../context/AdventureModeContext';
import NarratorWrapper from '../components/avatar/NarratorWrapper';
import { ORACLE_PHASES } from '../components/avatar/cedricNarratorConfig';
import { LOADING_MESSAGES } from '../components/avatar/cedricMessages';
import {
  generateRoadmap,
  getSavedRoadmaps,
  deleteSavedRoadmap,
  RoadmapGenerateRequest,
  RoadmapEmphasis,
  TargetRole,
  SavedRoadmapSummary,
} from '../services/roadmapService';

// ============================================
// View Mode Types
// ============================================

type ViewMode = 'list' | 'create' | 'view';

// ============================================
// Saved Roadmaps List Component
// ============================================

interface SavedRoadmapsListProps {
  roadmaps: SavedRoadmapSummary[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
  colors: typeof themeColors.dark;
  isDark: boolean;
}

function SavedRoadmapsList({ roadmaps, onSelect, onDelete, onCreateNew, colors, isDark }: SavedRoadmapsListProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (roadmaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}
        >
          <span className="text-4xl">Map</span>
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
          No roadmaps yet
        </h2>
        <p className="text-center mb-6 max-w-md" style={{ color: colors.textMuted }}>
          Create your first career roadmap to get a personalized plan for reaching your target roles.
        </p>
        <button
          onClick={onCreateNew}
          className="px-6 py-3 rounded-xl font-semibold text-lg transition-all"
          style={{ backgroundColor: colors.accent, color: '#2e2e38' }}
        >
          Create Your First Roadmap
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
          Your Roadmaps
        </h2>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 rounded-lg font-medium transition-all"
          style={{ backgroundColor: colors.accent, color: '#2e2e38' }}
        >
          + New Roadmap
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roadmaps.map((roadmap) => (
          <div
            key={roadmap.id}
            className="rounded-xl p-5 cursor-pointer transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
            }}
            onClick={() => onSelect(roadmap.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold" style={{ color: colors.textPrimary }}>
                {roadmap.title}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(roadmap.id);
                }}
                className="text-sm px-2 py-1 rounded opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: '#dc2626' }}
                title="Delete roadmap"
              >
                X
              </button>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {roadmap.target_role_titles.map((title, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 230, 0, 0.15)' : 'rgba(255, 230, 0, 0.2)',
                    color: colors.textPrimary,
                  }}
                >
                  {title}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4 text-sm mb-3" style={{ color: colors.textMuted }}>
              <span>{roadmap.total_phases} phases</span>
              <span>{roadmap.total_milestones} milestones</span>
              <span>~{roadmap.total_estimated_months} mo</span>
            </div>

            {roadmap.executive_summary && (
              <p
                className="text-sm line-clamp-2 mb-3"
                style={{ color: colors.textSecondary }}
              >
                {roadmap.executive_summary}
              </p>
            )}

            <div className="text-xs" style={{ color: colors.textMuted }}>
              Created {formatDate(roadmap.created_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Role Selection Panel
// ============================================

interface RoleSelectionPanelProps {
  savedRoles: Array<{ job_id: string; job_title: string; service_line?: string }>;
  selectedRoles: TargetRole[];
  onToggleRole: (role: { job_id: string; job_title: string; service_line?: string }) => void;
  onReorderRole: (jobId: string, direction: 'up' | 'down') => void;
  autoOrder: boolean;
  onAutoOrderChange: (v: boolean) => void;
  colors: typeof themeColors.dark;
  isDark: boolean;
}

function RoleSelectionPanel({
  savedRoles,
  selectedRoles,
  onToggleRole,
  onReorderRole,
  autoOrder,
  onAutoOrderChange,
  colors,
  isDark,
}: RoleSelectionPanelProps) {
  const selectedIds = selectedRoles.map((r) => r.job_id);

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
        border: `1px solid ${colors.cardBorder}`,
      }}
    >
      <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: colors.textMuted }}>
        Select Target Roles
      </h3>
      <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
        Choose 1-5 roles from your saved roles. The AI will determine the optimal progression order by default.
      </p>

      {/* Auto-order toggle */}
      <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)' }}>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={autoOrder}
            onChange={(e) => onAutoOrderChange(e.target.checked)}
            className="w-5 h-5 rounded"
            style={{ accentColor: colors.accent }}
          />
          <div>
            <span style={{ color: colors.textPrimary }}>Let AI determine progression order</span>
            <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
              {autoOrder ? 'AI will analyze roles and determine the best order' : 'You can manually set the order below'}
            </p>
          </div>
        </label>
      </div>

      {savedRoles.length === 0 ? (
        <div className="text-center py-8" style={{ color: colors.textMuted }}>
          <p className="mb-2">No saved roles yet.</p>
          <p className="text-sm">Save roles from Match Results to include them in your roadmap.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedRoles.map((role) => {
            const isSelected = selectedIds.includes(role.job_id);
            const selectedIndex = selectedRoles.findIndex((r) => r.job_id === role.job_id);

            return (
              <div
                key={role.job_id}
                onClick={() => onToggleRole(role)}
                className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all"
                style={{
                  backgroundColor: isSelected
                    ? isDark
                      ? 'rgba(255, 230, 0, 0.15)'
                      : 'rgba(255, 230, 0, 0.2)'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.03)'
                    : 'rgba(0, 0, 0, 0.02)',
                  border: isSelected ? `2px solid ${colors.accent}` : `2px solid transparent`,
                }}
              >
                {isSelected && !autoOrder && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderRole(role.job_id, 'up');
                      }}
                      disabled={selectedIndex === 0}
                      className="text-xs px-1 py-0.5 rounded"
                      style={{
                        backgroundColor: selectedIndex === 0 ? 'transparent' : colors.accent,
                        color: selectedIndex === 0 ? colors.textMuted : '#2e2e38',
                        opacity: selectedIndex === 0 ? 0.3 : 1,
                      }}
                    >
                      up
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderRole(role.job_id, 'down');
                      }}
                      disabled={selectedIndex === selectedRoles.length - 1}
                      className="text-xs px-1 py-0.5 rounded"
                      style={{
                        backgroundColor: selectedIndex === selectedRoles.length - 1 ? 'transparent' : colors.accent,
                        color: selectedIndex === selectedRoles.length - 1 ? colors.textMuted : '#2e2e38',
                        opacity: selectedIndex === selectedRoles.length - 1 ? 0.3 : 1,
                      }}
                    >
                      dn
                    </button>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {isSelected && !autoOrder && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{ backgroundColor: colors.accent, color: '#2e2e38' }}
                      >
                        #{selectedIndex + 1}
                      </span>
                    )}
                    <span className="font-semibold" style={{ color: colors.textPrimary }}>
                      {role.job_title}
                    </span>
                  </div>
                  <span className="text-sm" style={{ color: colors.textMuted }}>
                    {role.service_line}
                  </span>
                </div>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: isSelected ? colors.accent : 'transparent',
                    border: isSelected ? 'none' : `2px solid ${colors.textMuted}`,
                  }}
                >
                  {isSelected && <span style={{ color: '#2e2e38', fontSize: '14px' }}>OK</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// Customization Panel
// ============================================

interface CustomizationPanelProps {
  emphasis: RoadmapEmphasis;
  onEmphasisChange: (e: RoadmapEmphasis) => void;
  customInstructions: string;
  onCustomInstructionsChange: (v: string) => void;
  includeCertifications: boolean;
  onIncludeCertificationsChange: (v: boolean) => void;
  timelinePreference: string;
  onTimelinePreferenceChange: (v: string) => void;
  colors: typeof themeColors.dark;
  isDark: boolean;
  isGame: boolean;
}

function CustomizationPanel({
  emphasis,
  onEmphasisChange,
  customInstructions,
  onCustomInstructionsChange,
  includeCertifications,
  onIncludeCertificationsChange,
  timelinePreference,
  onTimelinePreferenceChange,
  colors,
  isDark,
  isGame,
}: CustomizationPanelProps) {
  const emphasisOptions: { value: RoadmapEmphasis; label: string; description: string }[] = [
    { value: 'balanced', label: 'Balanced', description: 'Mix of technical and leadership' },
    { value: 'technical', label: 'Technical Focus', description: 'Emphasize technical skills & certifications' },
    { value: 'leadership', label: 'Leadership Focus', description: 'Emphasize people management & client work' },
  ];

  const timelineOptions = ['Aggressive (faster)', 'Balanced', 'Relaxed (slower)', 'Custom'];

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
        border: `1px solid ${colors.cardBorder}`,
      }}
    >
      <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: colors.textMuted }}>
        Customize Your Roadmap
      </h3>

      {/* Emphasis */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
          Focus Area
        </label>
        <div className="grid grid-cols-3 gap-2">
          {emphasisOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onEmphasisChange(opt.value)}
              className="p-3 rounded-lg text-left transition-all"
              style={{
                backgroundColor:
                  emphasis === opt.value
                    ? isDark
                      ? 'rgba(255, 230, 0, 0.15)'
                      : 'rgba(255, 230, 0, 0.2)'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.03)'
                    : 'rgba(0, 0, 0, 0.02)',
                border: emphasis === opt.value ? `2px solid ${colors.accent}` : `2px solid transparent`,
              }}
            >
              <div className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                {opt.label}
              </div>
              <div className="text-xs mt-1" style={{ color: colors.textMuted }}>
                {opt.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
          Timeline Preference
        </label>
        <select
          value={timelinePreference}
          onChange={(e) => onTimelinePreferenceChange(e.target.value)}
          className="w-full p-3 rounded-lg text-sm"
          style={{
            backgroundColor: isDark || isGame ? '#1a1a1f' : '#fff',
            color: colors.textPrimary,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          {timelineOptions.map((opt) => (
            <option key={opt} value={opt} style={{ backgroundColor: isDark || isGame ? '#1a1a1f' : '#fff', color: isDark || isGame ? '#e8dcc4' : '#1e293b' }}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Include Certifications */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={includeCertifications}
            onChange={(e) => onIncludeCertificationsChange(e.target.checked)}
            className="w-5 h-5 rounded"
            style={{ accentColor: colors.accent }}
          />
          <span style={{ color: colors.textPrimary }}>Include certification recommendations</span>
        </label>
      </div>

      {/* Custom Instructions */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
          Custom Priorities (Optional)
        </label>
        <textarea
          value={customInstructions}
          onChange={(e) => onCustomInstructionsChange(e.target.value)}
          placeholder="E.g., 'I want to focus on cloud technologies and client-facing work. I have limited time for certifications but can dedicate weekends to learning.'"
          rows={4}
          maxLength={2000}
          className="w-full p-3 rounded-lg text-sm resize-none"
          style={{
            backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.05)' : '#fff',
            color: colors.textPrimary,
            border: `1px solid ${colors.cardBorder}`,
          }}
        />
        <div className="text-xs mt-1 text-right" style={{ color: colors.textMuted }}>
          {customInstructions.length}/2000
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function RoadmapPage() {
  const { theme, isDark, isGame } = useTheme();
  const colors = themeColors[theme];
  const savedRolesContext = useSavedRoles();
  const savedRoles = savedRolesContext?.state.savedRoles || [];
  const { state: adventureState, unlockAchievement, addXP, addGold } = useAdventureMode();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [savedRoadmaps, setSavedRoadmaps] = useState<SavedRoadmapSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);

  // Creation state
  const [selectedRoles, setSelectedRoles] = useState<TargetRole[]>([]);
  const [autoOrder, setAutoOrder] = useState(true);
  const [emphasis, setEmphasis] = useState<RoadmapEmphasis>('balanced');
  const [customInstructions, setCustomInstructions] = useState('');
  const [includeCertifications, setIncludeCertifications] = useState(true);
  const [timelinePreference, setTimelinePreference] = useState('Balanced');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved roadmaps on mount
  useEffect(() => {
    loadSavedRoadmaps();
  }, []);

  const loadSavedRoadmaps = async () => {
    try {
      setLoadingList(true);
      const response = await getSavedRoadmaps();
      setSavedRoadmaps(response.roadmaps);
    } catch (err) {
      console.error('Failed to load saved roadmaps:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const handleSelectRoadmap = (id: string) => {
    setSelectedRoadmapId(id);
    setViewMode('view');
  };

  const handleDeleteRoadmap = async (id: string) => {
    if (!confirm('Are you sure you want to delete this roadmap?')) return;
    try {
      await deleteSavedRoadmap(id);
      setSavedRoadmaps((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete roadmap:', err);
    }
  };

  const handleToggleRole = (role: { job_id: string; job_title: string; service_line?: string }) => {
    setSelectedRoles((prev) => {
      const exists = prev.find((r) => r.job_id === role.job_id);
      if (exists) return prev.filter((r) => r.job_id !== role.job_id);
      if (prev.length >= 5) return prev;
      return [...prev, { job_id: role.job_id, job_title: role.job_title, service_line: role.service_line, order: prev.length + 1 }];
    });
  };

  const handleReorderRole = (jobId: string, direction: 'up' | 'down') => {
    setSelectedRoles((prev) => {
      const index = prev.findIndex((r) => r.job_id === jobId);
      if (index === -1) return prev;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const newRoles = [...prev];
      [newRoles[index], newRoles[newIndex]] = [newRoles[newIndex], newRoles[index]];
      return newRoles.map((r, i) => ({ ...r, order: i + 1 }));
    });
  };

  const handleGenerate = async () => {
    if (selectedRoles.length === 0) {
      setError('Please select at least one target role.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const request: RoadmapGenerateRequest = {
        target_roles: selectedRoles,
        auto_order: autoOrder,
        emphasis,
        custom_instructions: customInstructions || undefined,
        include_certifications: includeCertifications,
        timeline_preference: timelinePreference,
      };
      const result = await generateRoadmap(request);
      // Refresh the list and go to the new roadmap
      await loadSavedRoadmaps();
      setSelectedRoadmapId(result.roadmap_id);
      setViewMode('view');
      // Reset form
      setSelectedRoles([]);
      setCustomInstructions('');
      // Adventure Mode: Grant XP, gold, and unlock achievement
      if (adventureState.enabled) {
        addXP(100, 'Created a roadmap');
        addGold(50, 'Created a roadmap');
        unlockAchievement('create_roadmap');
      }
    } catch (err: unknown) {
      console.error('Roadmap generation failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate roadmap. Please try again.';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBackToList = () => {
    setSelectedRoadmapId(null);
    setViewMode('list');
    loadSavedRoadmaps(); // Refresh to get any progress updates
  };

  const handleStartCreate = () => {
    setViewMode('create');
    // Refresh saved roles so newly saved matches appear immediately
    savedRolesContext?.refreshSavedRoles();
  };

  // Render the viewer wrapped in RoadmapProvider when viewing
  if (viewMode === 'view' && selectedRoadmapId) {
    return (
      <RoadmapProvider>
        <div className="max-w-7xl mx-auto py-6 px-6">
          <RoadmapViewer roadmapId={selectedRoadmapId} onBack={handleBackToList} />
        </div>
      </RoadmapProvider>
    );
  }

  return (
    <div
      className="max-w-7xl mx-auto py-6 px-6"
      style={{ fontFamily: isGame ? "'Spectral', serif" : 'inherit' }}
    >
      <div className="mb-8">
        <h1
          className="text-3xl font-bold mb-2"
          style={{
            color: colors.textPrimary,
            fontFamily: isGame ? "'Cinzel', serif" : 'inherit',
            textShadow: isGame ? '0 0 20px rgba(255, 230, 0, 0.2)' : 'none',
          }}
        >
          {getFantasyText('Career Roadmap', adventureState.enabled)}
        </h1>
        <p style={{ color: colors.textMuted }}>
          {viewMode === 'list' && (adventureState.enabled ? 'View your adventure paths or forge a new destiny.' : 'View your saved roadmaps or create a new one.')}
          {viewMode === 'create' && (adventureState.enabled ? 'Forge your personalized path to glory.' : 'Create a personalized career development plan.')}
        </p>
      </div>

      {viewMode === 'list' && (
        loadingList ? (
          <div className="text-center py-12" style={{ color: colors.textMuted }}>Loading your roadmaps...</div>
        ) : (
          <SavedRoadmapsList
            roadmaps={savedRoadmaps}
            onSelect={handleSelectRoadmap}
            onDelete={handleDeleteRoadmap}
            onCreateNew={handleStartCreate}
            colors={colors}
            isDark={isDark}
          />
        )
      )}

      {viewMode === 'create' && (
        <>
          <button
            onClick={handleBackToList}
            className="mb-6 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', color: colors.textPrimary }}
          >
            &lt;- Back to Roadmaps
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RoleSelectionPanel
              savedRoles={savedRoles}
              selectedRoles={selectedRoles}
              onToggleRole={handleToggleRole}
              onReorderRole={handleReorderRole}
              autoOrder={autoOrder}
              onAutoOrderChange={setAutoOrder}
              colors={colors}
              isDark={isDark}
            />

            <div className="space-y-6">
              <CustomizationPanel
                emphasis={emphasis}
                onEmphasisChange={setEmphasis}
                customInstructions={customInstructions}
                onCustomInstructionsChange={setCustomInstructions}
                includeCertifications={includeCertifications}
                onIncludeCertificationsChange={setIncludeCertifications}
                timelinePreference={timelinePreference}
                onTimelinePreferenceChange={setTimelinePreference}
                colors={colors}
                isDark={isDark}
                isGame={isGame}
              />

              <button
                onClick={handleGenerate}
                disabled={isGenerating || selectedRoles.length === 0}
                className="w-full py-4 rounded-xl font-semibold text-lg transition-all"
                style={{
                  backgroundColor: selectedRoles.length === 0 ? colors.textMuted : colors.accent,
                  color: '#2e2e38',
                  opacity: isGenerating ? 0.7 : 1,
                }}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-pulse">[...]</span>
                    Generating your personalized roadmap...
                  </span>
                ) : (
                  `Generate Roadmap${selectedRoles.length > 0 ? ` (${selectedRoles.length} role${selectedRoles.length > 1 ? 's' : ''})` : ''}`
                )}
              </button>

              {error && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', color: '#dc2626' }}>
                  {error}
                </div>
              )}

              <NarratorWrapper
                isLoading={isGenerating}
                phases={ORACLE_PHASES}
                completionDialogue={LOADING_MESSAGES.oraclePhases[4]}
                errorMessage={error}
                onRetry={handleGenerate}
              >
                <div className="p-4 rounded-lg text-center" style={{ backgroundColor: isDark ? 'rgba(255, 230, 0, 0.1)' : 'rgba(255, 230, 0, 0.15)', color: colors.textSecondary }}>
                  <p className="text-sm">This uses GPT-5.2 with reasoning capabilities and may take 1-2 minutes.</p>
                  <p className="text-sm mt-2">We're creating a comprehensive, personalized plan just for you.</p>
                </div>
              </NarratorWrapper>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
