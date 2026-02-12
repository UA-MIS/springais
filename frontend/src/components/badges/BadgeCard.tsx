/**
 * BadgeCard - Compact badge display for roadmap milestone certifications.
 *
 * Shows badge name, issuer, difficulty, cost, and a clickable link.
 * Tracks clicks via the badge interaction API.
 */

import { useTheme, themeColors } from '../../context/ThemeContext';
import { recordInteraction } from '../../services/badgeService';

export interface BadgeCardBadge {
  name: string;
  provider: string;
  url: string;
  difficulty_level?: string;
  estimated_cost_usd?: number;
  estimated_hours?: number;
  badge_id?: string;
}

interface BadgeCardProps {
  badge: BadgeCardBadge;
  source: 'skill_module' | 'roadmap' | 'search';
  compact?: boolean;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#22c55e',
  intermediate: '#3b82f6',
  advanced: '#f59e0b',
  expert: '#dc2626',
};

export default function BadgeCard({ badge, source, compact = false }: BadgeCardProps) {
  const { theme, isDark, isGame } = useTheme();
  const colors = themeColors[theme];

  const difficultyColor = badge.difficulty_level
    ? DIFFICULTY_COLORS[badge.difficulty_level] || colors.textMuted
    : colors.textMuted;

  const handleClick = () => {
    if (badge.badge_id) {
      recordInteraction(badge.badge_id, 'click', source).catch(() => {
        // Fire-and-forget: don't block user navigation on tracking failure
      });
    }
    window.open(badge.url, '_blank', 'noopener,noreferrer');
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all hover:scale-[1.02]"
        style={{
          backgroundColor: (isDark || isGame) ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.06)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
        }}
        data-testid="badge-card-compact"
      >
        {/* Badge Icon */}
        <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#f59e0b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>

        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium truncate block" style={{ color: colors.textPrimary }}>
            {badge.name}
          </span>
          <span className="text-xs" style={{ color: colors.textMuted }}>
            {badge.provider}
            {badge.estimated_cost_usd != null && ` - $${badge.estimated_cost_usd}`}
          </span>
        </div>

        {badge.difficulty_level && (
          <span
            className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ backgroundColor: `${difficultyColor}20`, color: difficultyColor }}
          >
            {badge.difficulty_level}
          </span>
        )}

        {/* External link icon */}
        <svg className="w-3 h-3 flex-shrink-0" style={{ color: colors.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </button>
    );
  }

  // Full-size card (used in BadgeSection / SkillDetailModal)
  return (
    <div
      className="rounded-xl p-4 transition-all"
      style={{
        backgroundColor: (isDark || isGame) ? 'rgba(245, 158, 11, 0.05)' : 'rgba(245, 158, 11, 0.04)',
        border: '1px solid rgba(245, 158, 11, 0.15)',
      }}
      data-testid="badge-card-full"
    >
      <div className="flex items-start gap-3">
        {/* Badge Icon */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: '#f59e0b20' }}
        >
          <svg className="w-5 h-5" style={{ color: '#f59e0b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium" style={{ color: colors.textPrimary }}>
              {badge.name}
            </span>
            {badge.difficulty_level && (
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{ backgroundColor: `${difficultyColor}20`, color: difficultyColor }}
              >
                {badge.difficulty_level}
              </span>
            )}
          </div>

          <div className="text-sm mt-1" style={{ color: colors.textMuted }}>
            {badge.provider}
            {badge.estimated_cost_usd != null && ` | ~$${badge.estimated_cost_usd}`}
            {badge.estimated_hours != null && ` | ~${badge.estimated_hours}h`}
          </div>
        </div>
      </div>

      <button
        onClick={handleClick}
        className="mt-3 w-full py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
        style={{
          backgroundColor: '#f59e0b20',
          color: '#f59e0b',
          border: '1px solid #f59e0b40',
        }}
      >
        View Badge
      </button>
    </div>
  );
}
