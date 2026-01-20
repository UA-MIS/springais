import SkillTag from '../common/SkillTag';

interface SkillGapDisplayProps {
  matched_skills: string[];
  skill_gaps: string[];
  skill_match_score: number;
}

export default function SkillGapDisplay({ 
  matched_skills, 
  skill_gaps, 
  skill_match_score 
}: SkillGapDisplayProps) {
  const totalSkills = matched_skills.length + skill_gaps.length;
  const matchPercentage = Math.round(skill_match_score * 100);

  return (
    <div className="space-y-3">
      {/* Matched Skills */}
      {matched_skills.length > 0 && (
        <div>
          <div className="text-sm font-medium text-white/60 mb-2">
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
          <div className="text-sm font-medium text-white/60 mb-2">
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
      <div className="pt-2 border-t border-white/15">
        <div className="text-sm text-white/60">
          Skill Match Score: <span className="font-semibold text-white">{matchPercentage}%</span>
          {' '}({matched_skills.length} of {totalSkills} required skills)
        </div>
      </div>
    </div>
  );
}
