import SkillTag from '../common/SkillTag';

interface ThemeColors {
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
}

interface SkillGapDisplayProps {
  matched_skills: string[];
  skill_gaps: string[];
  skill_match_score: number;
  isDark?: boolean;
  colors?: ThemeColors;
}

export default function SkillGapDisplay({
  matched_skills,
  skill_gaps,
  skill_match_score,
  isDark = true,
  colors = {
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.85)',
    textMuted: 'rgba(255, 255, 255, 0.6)',
    border: 'rgba(255, 255, 255, 0.15)',
  }
}: SkillGapDisplayProps) {
  const totalSkills = matched_skills.length + skill_gaps.length;
  const matchPercentage = Math.round(skill_match_score * 100);

  return (
    <div className="space-y-3">
      {/* Matched Skills */}
      {matched_skills.length > 0 && (
        <div>
          <div
            className="text-sm font-medium mb-2"
            style={{ color: colors.textMuted }}
          >
            Matched Skills ({matched_skills.length}/{totalSkills}):
          </div>
          <div className="flex flex-wrap gap-2">
            {matched_skills.map((skill) => (
              <SkillTag key={skill} skill={skill} variant="matched" />
            ))}
          </div>
        </div>
      )}

      {/* Skill Gaps */}
      {skill_gaps.length > 0 && (
        <div>
          <div
            className="text-sm font-medium mb-2"
            style={{ color: colors.textMuted }}
          >
            Skill Gaps ({skill_gaps.length}/{totalSkills}):
          </div>
          <div className="flex flex-wrap gap-2">
            {skill_gaps.map((skill) => (
              <SkillTag key={skill} skill={skill} variant="gap" />
            ))}
          </div>
        </div>
      )}

      {/* Match Score Summary */}
      <div
        className="pt-2"
        style={{ borderTop: `1px solid ${colors.border}` }}
      >
        <div className="text-sm" style={{ color: colors.textMuted }}>
          Skill Match Score:{' '}
          <span className="font-semibold" style={{ color: colors.textPrimary }}>
            {matchPercentage}%
          </span>
          {' '}({matched_skills.length} of {totalSkills} required skills)
        </div>
      </div>
    </div>
  );
}
