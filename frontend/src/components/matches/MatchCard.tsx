import { Match } from '../../services/mockMatchData';
import ProgressRing from '../common/ProgressRing';
import SkillGapDisplay from './SkillGapDisplay';

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
  const scorePercentage = Math.round(match.overall_score * 100);

  return (
    <div className="border border-white/15 bg-white/7 p-6 rounded-sm shadow-2xl backdrop-blur-md hover:bg-white/10 transition-all">
      {/* Header: Title + Score */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">{match.job_title}</h3>
          <div className="text-sm text-white/60">
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
          skill_gaps={match.skill_gaps}
          skill_match_score={match.skill_match_score}
        />
      </div>

      {/* Explanation */}
      <div className="mb-4 p-3 bg-white/5 rounded-sm border border-white/10">
        <p className="text-sm text-white/80 italic leading-relaxed">
          "{match.explanation}"
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => onViewDetails(match.id)}
          className="flex-1 px-4 py-2 bg-[#FFE600] text-[#2E2E38] rounded-sm hover:bg-[#FFD700] font-semibold transition-colors"
        >
          View Details
        </button>
        <button
          onClick={() => onSave(match.id)}
          className="px-4 py-2 bg-white/10 text-white/85 font-semibold rounded-sm hover:bg-white/15 transition-colors border border-white/10"
        >
          Save Match
        </button>
      </div>
    </div>
  );
}
