import { useState, useEffect } from 'react';
import { useTheme, themeColors } from '../context/ThemeContext';
import { useSavedRoles } from '../context/SavedRolesContext';
import {
  generateRoadmap,
  getSavedRoadmaps,
  getSavedRoadmap,
  deleteSavedRoadmap,
  RoadmapResponse,
  RoadmapGenerateRequest,
  RoadmapEmphasis,
  TargetRole,
  RoadmapMilestone,
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
  colors: any;
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
          <span className="text-4xl">🗺️</span>
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
  savedRoles: any[];
  selectedRoles: TargetRole[];
  onToggleRole: (role: any) => void;
  onReorderRole: (jobId: string, direction: 'up' | 'down') => void;
  autoOrder: boolean;
  onAutoOrderChange: (v: boolean) => void;
  colors: any;
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
  colors: any;
  isDark: boolean;
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
            backgroundColor: isDark ? '#1a1a1f' : '#fff',
            color: colors.textPrimary,
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          {timelineOptions.map((opt) => (
            <option key={opt} value={opt} style={{ backgroundColor: isDark ? '#1a1a1f' : '#fff', color: isDark ? '#fff' : '#1e293b' }}>
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
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#fff',
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
// Roadmap Display Component
// ============================================

interface RoadmapDisplayProps {
  roadmap: RoadmapResponse;
  colors: any;
  isDark: boolean;
}

function RoadmapDisplay({ roadmap, colors, isDark }: RoadmapDisplayProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set([roadmap.phases[0]?.id]));

  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Calculate overall progress
  const calculateOverallProgress = () => {
    const completedPhases = roadmap.phases.filter(p => p.status === 'completed').length;
    const inProgressPhases = roadmap.phases.filter(p => p.status === 'in_progress').length;

    const phaseProgress =
      (completedPhases * 100 + inProgressPhases * 50) /
      roadmap.phases.length;

    return Math.round(phaseProgress);
  };

  const overallProgress = calculateOverallProgress();

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const response = await fetch('/api/roadmap/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          roadmap_id: roadmap.roadmap_id,
          message: userMessage,
          context: JSON.stringify({
            phases: roadmap.phases.map(p => ({
              name: p.name,
              status: p.status,
              milestones: p.milestones.map(m => m.title)
            })),
            critical_skills: roadmap.critical_skills_to_develop,
            quick_wins: roadmap.quick_wins,
          })
        }),
      });

      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble answering. Please try again.'
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'skill': return '[S]';
      case 'experience': return '[E]';
      case 'certification': return '[C]';
      case 'leadership': return '[L]';
      case 'networking': return '[N]';
      default: return '[*]';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      default: return colors.textMuted;
    }
  };

  return (
    <div className="space-y-8">
      {/* Overall Progress Bar */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-lg" style={{ color: colors.textPrimary }}>
            Overall Progress
          </span>
          <span className="font-bold text-2xl" style={{ color: colors.accent }}>
            {overallProgress}%
          </span>
        </div>
        <div
          className="h-4 rounded-full overflow-hidden"
          style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${overallProgress}%`,
              background: `linear-gradient(90deg, ${colors.accent} 0%, #22c55e 100%)`,
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm" style={{ color: colors.textMuted }}>
          <span>{roadmap.phases.filter(p => p.status === 'completed').length} phases complete</span>
          <span>{roadmap.phases.filter(p => p.status === 'in_progress').length} in progress</span>
          <span>{roadmap.phases.filter(p => p.status === 'upcoming').length} upcoming</span>
        </div>
      </div>

      {/* Executive Summary */}
      <div
        className="rounded-2xl p-8"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <h2 className="text-2xl font-bold mb-4" style={{ color: colors.textPrimary }}>
          Your Career Roadmap
        </h2>
        <div className="flex items-center gap-6 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: colors.accent }}>{roadmap.total_estimated_months}</div>
            <div className="text-sm" style={{ color: colors.textMuted }}>months total</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: colors.accent }}>{roadmap.phases.length}</div>
            <div className="text-sm" style={{ color: colors.textMuted }}>phases</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: colors.accent }}>
              {roadmap.phases.reduce((sum, p) => sum + p.milestones.length, 0)}
            </div>
            <div className="text-sm" style={{ color: colors.textMuted }}>milestones</div>
          </div>
        </div>
        <div className="prose max-w-none" style={{ color: colors.textSecondary }}>
          {roadmap.executive_summary.split('\n\n').map((para, i) => (
            <p key={i} className="mb-4 leading-relaxed">{para}</p>
          ))}
        </div>
        {roadmap.customization_notes && (
          <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(255, 230, 0, 0.1)' : 'rgba(255, 230, 0, 0.15)' }}>
            <span className="text-sm" style={{ color: colors.textMuted }}>Personalization: {roadmap.customization_notes}</span>
          </div>
        )}
      </div>

      {/* Quick Wins */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.08)',
          border: `1px solid rgba(34, 197, 94, 0.3)`,
        }}
      >
        <h3 className="text-lg font-semibold mb-3" style={{ color: '#22c55e' }}>Quick Wins - Start This Week</h3>
        <ul className="space-y-2">
          {roadmap.quick_wins.map((win, i) => (
            <li key={i} className="flex items-start gap-2">
              <span style={{ color: '#22c55e' }}>[OK]</span>
              <span style={{ color: colors.textPrimary }}>{win}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Critical Skills */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <h3 className="text-lg font-semibold mb-3" style={{ color: colors.textPrimary }}>Critical Skills to Develop</h3>
        <div className="flex flex-wrap gap-2">
          {roadmap.critical_skills_to_develop.map((skill, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: isDark ? 'rgba(255, 230, 0, 0.15)' : 'rgba(255, 230, 0, 0.2)',
                color: colors.textPrimary,
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Development Phases</h3>
        {roadmap.phases.map((phase, phaseIndex) => (
          <div
            key={phase.id}
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
            }}
          >
            <button
              onClick={() => togglePhase(phase.id)}
              className="w-full p-6 flex items-center justify-between text-left"
              style={{
                backgroundColor:
                  phase.status === 'completed' ? 'rgba(34, 197, 94, 0.1)'
                    : phase.status === 'in_progress' ? (isDark ? 'rgba(255, 230, 0, 0.1)' : 'rgba(255, 230, 0, 0.15)')
                    : 'transparent',
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{
                    backgroundColor: phase.status === 'completed' ? '#22c55e' : phase.status === 'in_progress' ? colors.accent : colors.textMuted,
                    color: phase.status === 'upcoming' ? '#fff' : '#2e2e38',
                  }}
                >
                  {phase.status === 'completed' ? 'OK' : phaseIndex + 1}
                </div>
                <div>
                  <div className="font-semibold" style={{ color: colors.textPrimary }}>
                    {phase.name}
                    {phase.target_role && (
                      <span className="ml-2 text-sm font-normal" style={{ color: colors.accent }}>-&gt; {phase.target_role}</span>
                    )}
                  </div>
                  <div className="text-sm" style={{ color: colors.textMuted }}>
                    {phase.estimated_duration_months} months | {phase.milestones.length} milestones
                  </div>
                </div>
              </div>
              <span style={{ color: colors.textMuted }}>{expandedPhases.has(phase.id) ? '[-]' : '[+]'}</span>
            </button>

            {expandedPhases.has(phase.id) && (
              <div className="px-6 pb-6">
                <p className="mb-4 text-sm" style={{ color: colors.textSecondary }}>{phase.description}</p>
                <div className="space-y-3">
                  {phase.milestones.map((milestone) => (
                    <MilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      colors={colors}
                      isDark={isDark}
                      getCategoryIcon={getCategoryIcon}
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Potential Blockers */}
      {roadmap.potential_blockers.length > 0 && (
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: isDark ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.08)',
            border: `1px solid rgba(220, 38, 38, 0.3)`,
          }}
        >
          <h3 className="text-lg font-semibold mb-3" style={{ color: '#dc2626' }}>Potential Challenges to Prepare For</h3>
          <ul className="space-y-2">
            {roadmap.potential_blockers.map((blocker, i) => (
              <li key={i} className="flex items-start gap-2">
                <span style={{ color: '#dc2626' }}>[!]</span>
                <span style={{ color: colors.textPrimary }}>{blocker}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Chat Toggle Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed right-4 bottom-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40 transition-all active:scale-95"
        style={{
          backgroundColor: colors.accent,
          color: '#2e2e38',
        }}
        title="Chat with Roadmap Assistant"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Chat Panel */}
      {chatOpen && (
        <div
          className="fixed right-4 bottom-20 w-96 rounded-2xl overflow-hidden shadow-2xl z-50"
          style={{
            backgroundColor: isDark ? '#1a1a1f' : '#fff',
            border: `1px solid ${colors.cardBorder}`,
            maxHeight: 'calc(100vh - 120px)',
          }}
        >
          <div
            className="p-4 font-semibold flex items-center justify-between"
            style={{ backgroundColor: colors.accent, color: '#2e2e38' }}
          >
            <span>Roadmap Assistant</span>
            <button
              onClick={() => setChatOpen(false)}
              className="hover:opacity-70 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-sm" style={{ color: colors.textMuted }}>
                <p className="mb-2">Ask me anything about your career roadmap!</p>
                <p className="text-xs italic">Examples:</p>
                <ul className="text-xs mt-1 space-y-1 opacity-75">
                  <li>- "What should I focus on first?"</li>
                  <li>- "How can I work on Phase 1?"</li>
                  <li>- "What resources do you recommend?"</li>
                </ul>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'ml-8' : 'mr-4'}`}
                style={{
                  backgroundColor: msg.role === 'user'
                    ? (isDark ? 'rgba(255, 230, 0, 0.2)' : 'rgba(255, 230, 0, 0.3)')
                    : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
                  color: colors.textPrimary,
                }}
              >
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div className="text-sm animate-pulse" style={{ color: colors.textMuted }}>
                Thinking...
              </div>
            )}
          </div>

          <div className="p-3 border-t" style={{ borderColor: colors.cardBorder }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                placeholder="Ask about your roadmap..."
                className="flex-1 px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  color: colors.textPrimary,
                  border: `1px solid ${colors.cardBorder}`,
                }}
              />
              <button
                onClick={handleChatSubmit}
                disabled={chatLoading || !chatInput.trim()}
                className="px-4 py-2 rounded-lg font-medium active:scale-95 transition-all"
                style={{
                  backgroundColor: colors.accent,
                  color: '#2e2e38',
                  opacity: chatLoading || !chatInput.trim() ? 0.5 : 1,
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Milestone Card Component
// ============================================

interface MilestoneCardProps {
  milestone: RoadmapMilestone;
  colors: any;
  isDark: boolean;
  getCategoryIcon: (cat: string) => string;
  getPriorityColor: (pri: string) => string;
}

function MilestoneCard({ milestone, colors, isDark, getCategoryIcon, getPriorityColor }: MilestoneCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
        border: `1px solid ${colors.cardBorder}`,
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-sm font-mono" style={{ color: colors.textMuted }}>{getCategoryIcon(milestone.category)}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium" style={{ color: colors.textPrimary }}>{milestone.title}</span>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: `${getPriorityColor(milestone.priority)}20`, color: getPriorityColor(milestone.priority) }}
            >
              {milestone.priority}
            </span>
            <span className="text-xs" style={{ color: colors.textMuted }}>~{milestone.estimated_duration_months} mo</span>
          </div>
          <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>{milestone.description}</p>

          {expanded && (
            <div className="mt-3 space-y-3">
              {milestone.skills_to_develop.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Skills:</div>
                  <div className="flex flex-wrap gap-1">
                    {milestone.skills_to_develop.map((skill, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', color: colors.textSecondary }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {milestone.resources.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Resources/Actions:</div>
                  <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                    {milestone.resources.map((res, i) => (<li key={i}>- {res}</li>))}
                  </ul>
                </div>
              )}
              {milestone.success_indicators.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-1" style={{ color: colors.textMuted }}>Success Indicators:</div>
                  <ul className="text-sm space-y-1" style={{ color: colors.textSecondary }}>
                    {milestone.success_indicators.map((ind, i) => (<li key={i}>[OK] {ind}</li>))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <button onClick={() => setExpanded(!expanded)} className="text-xs mt-2" style={{ color: colors.accent }}>
            {expanded ? 'Show less' : 'Show details'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function RoadmapPage() {
  const { isDark } = useTheme();
  const colors = isDark ? themeColors.dark : themeColors.light;
  const savedRolesContext = useSavedRoles();
  const savedRoles = savedRolesContext?.state.savedRoles || [];

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [savedRoadmaps, setSavedRoadmaps] = useState<SavedRoadmapSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [currentRoadmap, setCurrentRoadmap] = useState<RoadmapResponse | null>(null);

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

  const handleSelectRoadmap = async (id: string) => {
    try {
      const detail = await getSavedRoadmap(id);
      setCurrentRoadmap(detail.roadmap);
      setViewMode('view');
    } catch (err) {
      console.error('Failed to load roadmap:', err);
    }
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

  const handleToggleRole = (role: any) => {
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
      setCurrentRoadmap(result);
      setViewMode('view');
      // Refresh the list
      loadSavedRoadmaps();
      // Reset form
      setSelectedRoles([]);
      setCustomInstructions('');
    } catch (err: any) {
      console.error('Roadmap generation failed:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to generate roadmap. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBackToList = () => {
    setCurrentRoadmap(null);
    setViewMode('list');
  };

  const handleStartCreate = () => {
    setViewMode('create');
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>Career Roadmap</h1>
        <p style={{ color: colors.textMuted }}>
          {viewMode === 'list' && 'View your saved roadmaps or create a new one.'}
          {viewMode === 'create' && 'Create a personalized career development plan.'}
          {viewMode === 'view' && 'Your personalized career development plan.'}
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

              {isGenerating && (
                <div className="p-4 rounded-lg text-center" style={{ backgroundColor: isDark ? 'rgba(255, 230, 0, 0.1)' : 'rgba(255, 230, 0, 0.15)', color: colors.textSecondary }}>
                  <p className="text-sm">This uses GPT-5.2 with reasoning capabilities and may take 1-2 minutes.</p>
                  <p className="text-sm mt-2">We're creating a comprehensive, personalized plan just for you.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {viewMode === 'view' && currentRoadmap && (
        <>
          <button
            onClick={handleBackToList}
            className="mb-6 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', color: colors.textPrimary }}
          >
            &lt;- Back to Roadmaps
          </button>
          <RoadmapDisplay roadmap={currentRoadmap} colors={colors} isDark={isDark} />
        </>
      )}
    </div>
  );
}
