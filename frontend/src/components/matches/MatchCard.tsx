import { Match } from '../../services/mockMatchData';
import ProgressRing from '../common/ProgressRing';
import SkillGapDisplay from './SkillGapDisplay';
import { useTheme, themeColors } from '../../context/ThemeContext';

interface MatchCardProps {
  match: Match;
  onViewDetails: (matchId: string) => void;
  onSave: (matchId: string) => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MatchCard({ match, onViewDetails, onSave }: MatchCardProps) {
  const { theme, isDark, isGame } = useTheme();
  const colors = themeColors[theme];
  const scorePercentage = Math.round(match.overall_score * 100);

  return (
    <div
      className="p-6 rounded-sm shadow-2xl transition-all"
      style={{
        backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.07)' : colors.cardBg,
        border: `1px solid ${colors.cardBorder}`,
        backdropFilter: (isDark || isGame) ? 'blur(12px)' : 'none',
      }}
    >
      {/* Header: Title + Score */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3
            className="text-xl font-bold mb-2"
            style={{ color: colors.textPrimary }}
          >
            {match.job_title}
          </h3>
          <div className="text-sm" style={{ color: colors.textMuted }}>
            <p className="font-medium">{match.service_line} · {match.department}</p>
            <p className="mt-1">{match.location} · Posted {formatDate(match.posted_date)}</p>
            {match.experience_required && (
              <p className="mt-1">Experience: {match.experience_required}</p>
            )}
          </div>
        </div>
        <div className="ml-4">
          <ProgressRing percentage={scorePercentage} size={100} strokeWidth={8} />
        </div>
      </div>

      {/* Skill Gap Display */}
      <div className="mb-4">
        <SkillGapDisplay
          matched_skills={match.matched_skills}
          transferable_skills={match.transferable_skills}
          skill_gaps={match.skill_gaps}
          skill_match_score={match.skill_match_score}
          isDark={isDark}
          colors={colors}
        />
      </div>

      {/* Explanation */}
      <div
        className="mb-4 p-3 rounded-sm"
        style={{
          backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          border: `1px solid ${colors.border}`,
        }}
      >
        <p
          className="text-sm italic leading-relaxed"
          style={{ color: colors.textSecondary }}
        >
          "{match.explanation}"
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => onViewDetails(match.id)}
          className="flex-1 px-4 py-2 rounded-sm font-semibold transition-colors"
          style={{
            backgroundColor: colors.accent,
            color: '#2E2E38',
          }}
        >
          View Details
        </button>
        <button
          onClick={() => onSave(match.id)}
          className="px-4 py-2 font-semibold rounded-sm transition-colors"
          style={{
            backgroundColor: (isDark || isGame) ? 'rgba(255, 255, 255, 0.1)' : colors.cardBg,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
          }}
        >
          Save Match
        </button>
      </div>
    </div>
  );
}
