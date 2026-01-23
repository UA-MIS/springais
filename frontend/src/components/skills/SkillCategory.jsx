// Category section component
// Displays a group of skills within a category with header and progress meter

import SkillCard from './SkillCard';

export default function SkillCategory({ category, skills, onSkillClick, onMarkComplete, theme, progressColors }) {
  // Calculate category progress from skills
  const calculateCategoryProgress = () => {
    if (skills.length === 0) return 0;
    const totalProficiency = skills.reduce((sum, skill) => sum + skill.proficiency, 0);
    return Math.round(totalProficiency / skills.length);
  };

  const categoryProgress = calculateCategoryProgress();

  return (
    <div className="mb-6 last:mb-0">
      {/* Category Header */}
      <div 
        className="flex items-center justify-between mb-3 p-3 rounded-xl"
        style={{ backgroundColor: theme?.categoryBg || '#f8fafc' }}
      >
        <div className="flex items-center gap-3">
          <span 
            className="text-xl p-2 rounded-lg"
            style={{ backgroundColor: theme?.cardBg || '#ffffff' }}
          >
            {category.emoji}
          </span>
          <div>
            <h2 
              className="text-base font-semibold"
              style={{ color: theme?.categoryText || '#1e293b' }}
            >
              {category.name}
            </h2>
            <span 
              className="text-xs"
              style={{ color: theme?.headerSubtext || '#64748b' }}
            >
              {skills.length} {skills.length === 1 ? 'skill' : 'skills'}
            </span>
          </div>
        </div>
        
        {/* Category Progress Meter - GREEN */}
        <div className="flex items-center gap-3">
          {/* Meter container */}
          <div 
            className="relative w-40 h-3 rounded-full overflow-hidden"
            style={{ backgroundColor: progressColors?.bg || '#dcfce7' }}
          >
            {/* Progress fill - solid green */}
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ 
                width: `${categoryProgress}%`,
                backgroundColor: progressColors?.meter || '#22c55e',
              }}
            />
          </div>
          
          {/* Percentage label - GREEN */}
          <span 
            className="text-sm font-bold min-w-[3rem] text-right"
            style={{ color: progressColors?.text || '#16a34a' }}
          >
            {categoryProgress}%
          </span>
        </div>
      </div>

      {/* Skills Grid */}
      {skills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {skills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onClick={() => onSkillClick?.(skill)}
              onMarkComplete={onMarkComplete}
              theme={theme}
              progressColors={progressColors}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm italic py-4" style={{ color: theme?.headerSubtext || '#64748b' }}>
          No skills in this category
        </p>
      )}
    </div>
  );
}
