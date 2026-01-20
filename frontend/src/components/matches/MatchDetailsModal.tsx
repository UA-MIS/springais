import { useEffect } from 'react';
import { Match } from '../../services/mockMatchData';
import ProgressRing from '../common/ProgressRing';
import SkillGapDisplay from './SkillGapDisplay';

interface MatchDetailsModalProps {
  match: Match | null;
  onClose: () => void;
  onSave: (matchId: string) => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

export default function MatchDetailsModal({ match, onClose, onSave }: MatchDetailsModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (match) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [match]);

  if (!match) return null;

  const scorePercentage = Math.round(match.overall_score * 100);
  const skillMatchPercentage = Math.round(match.skill_match_score * 100);
  const experiencePercentage = Math.round(match.experience_score * 100);
  const growthPercentage = Math.round(match.growth_potential_score * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/20 bg-zinc-900 rounded-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 bg-white/10 hover:bg-white/15 rounded-sm border border-white/10 transition-colors"
          aria-label="Close modal"
        >
          <svg
            className="w-5 h-5 text-white/85"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 pr-8">
              <h2 className="text-3xl font-bold text-white mb-3">{match.job_title}</h2>
              <div className="space-y-2 text-white/60">
                <p className="text-lg font-medium text-white/85">
                  {match.service_line} · {match.department}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span>📍 {match.location}</span>
                  {match.experience_required && (
                    <span>💼 {match.experience_required}</span>
                  )}
                  {match.salary_range && (
                    <span>💰 {match.salary_range}</span>
                  )}
                  <span>📅 Posted {formatDate(match.posted_date)}</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="text-center mb-2">
                <ProgressRing percentage={scorePercentage} size={120} strokeWidth={10} />
              </div>
              <p className="text-sm text-white/60 text-center">Overall Match</p>
            </div>
          </div>

          {/* Match Score Breakdown */}
          <div className="mb-6 p-4 bg-zinc-800/50 rounded-sm border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Match Score Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/60">Skill Match</span>
                  <span className="text-sm font-semibold text-white">{skillMatchPercentage}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#22C55E] transition-all"
                    style={{ width: `${skillMatchPercentage}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/60">Experience</span>
                  <span className="text-sm font-semibold text-white">{experiencePercentage}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FFE600] transition-all"
                    style={{ width: `${experiencePercentage}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/60">Growth Potential</span>
                  <span className="text-sm font-semibold text-white">{growthPercentage}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3B82F6] transition-all"
                    style={{ width: `${growthPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Why You Were Matched */}
          <div className="mb-6 p-5 bg-zinc-800/50 rounded-sm border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-3">Why You Were Matched</h3>
            <p className="text-white/80 leading-relaxed">{match.explanation}</p>
          </div>

          {/* Skill Gap Analysis */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Skill Analysis</h3>
            <SkillGapDisplay
              matched_skills={match.matched_skills}
              skill_gaps={match.skill_gaps}
              skill_match_score={match.skill_match_score}
            />
          </div>

          {/* Job Details Section */}
          <div className="mb-6 p-5 bg-zinc-800/50 rounded-sm border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Job Details</h3>
            <div className="space-y-3 text-white/80">
              <div>
                <span className="font-medium text-white/85">Job ID:</span>{' '}
                <span>{match.job_id}</span>
              </div>
              <div>
                <span className="font-medium text-white/85">Department:</span>{' '}
                <span>{match.department}</span>
              </div>
              <div>
                <span className="font-medium text-white/85">Service Line:</span>{' '}
                <span>{match.service_line}</span>
              </div>
              <div>
                <span className="font-medium text-white/85">Location:</span>{' '}
                <span>{match.location}</span>
              </div>
              {match.experience_required && (
                <div>
                  <span className="font-medium text-white/85">Experience Required:</span>{' '}
                  <span>{match.experience_required}</span>
                </div>
              )}
              {match.salary_range && (
                <div>
                  <span className="font-medium text-white/85">Salary Range:</span>{' '}
                  <span>{match.salary_range}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-white/85">Posted Date:</span>{' '}
                <span>{formatDate(match.posted_date)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t border-white/15">
            {/* Job Posting Link - Always visible at bottom */}
            <div className="mb-2">
              <a
                href={match.job_posting_url || `https://careers.ey.com/jobs/${match.job_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-[#FFE600] text-[#2E2E38] rounded-sm hover:bg-[#FFD700] font-semibold transition-colors text-center"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                View Full Job Posting on EY Careers
              </a>
            </div>

            {/* Secondary Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onSave(match.id);
                  onClose();
                }}
                className="flex-1 px-6 py-3 bg-white/10 text-white/85 font-semibold rounded-sm hover:bg-white/15 transition-colors border border-white/10"
              >
                Save Match
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white/10 text-white/85 font-semibold rounded-sm hover:bg-white/15 transition-colors border border-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
