// Portfolio grid view component
// Displays skills organized by category with filtering

import SkillCategory from './SkillCategory';
import { SKILL_CATEGORIES } from '../../mocks/mockSkills';

export default function SkillsPortfolio({ 
  skills, 
  filterTab, 
  searchQuery, 
  onSkillClick,
  theme,
  progressColors 
}) {
  // Filter skills based on active tab
  const filterByTab = (skillsList) => {
    switch (filterTab) {
      case 'active':
        return skillsList.filter(skill => skill.status === 'active');
      case 'recommended':
        return skillsList.filter(skill => skill.status === 'recommended');
      case 'all':
      default:
        return skillsList;
    }
  };

  // Filter skills based on search query
  const filterBySearch = (skillsList) => {
    if (!searchQuery.trim()) return skillsList;
    
    const query = searchQuery.toLowerCase();
    return skillsList.filter(skill => {
      const categoryName = SKILL_CATEGORIES.find(c => c.id === skill.category)?.name || '';
      return (
        skill.name.toLowerCase().includes(query) ||
        skill.category.toLowerCase().includes(query) ||
        categoryName.toLowerCase().includes(query) ||
        (skill.notes && skill.notes.toLowerCase().includes(query))
      );
    });
  };

  // Apply filters
  const filteredSkills = filterBySearch(filterByTab(skills));

  // Group skills by category
  const skillsByCategory = SKILL_CATEGORIES.map(category => ({
    ...category,
    skills: filteredSkills.filter(skill => skill.category === category.id),
  })).filter(category => category.skills.length > 0); // Only show categories with skills

  // Empty state
  if (skillsByCategory.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-ey-gray text-lg mb-2">
          {searchQuery 
            ? `No skills found matching "${searchQuery}"`
            : filterTab === 'active'
            ? 'No active skills yet'
            : filterTab === 'recommended'
            ? 'No recommended skills'
            : 'No skills yet. Upload your resume to get started!'
          }
        </p>
        {!searchQuery && filterTab === 'all' && (
          <p className="text-sm text-ey-gray-light mt-2">
            Start by uploading your resume or adding a skill manually.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {skillsByCategory.map((category) => (
        <SkillCategory
          key={category.id}
          category={category}
          skills={category.skills}
          onSkillClick={onSkillClick}
          theme={theme}
          progressColors={progressColors}
        />
      ))}
    </div>
  );
}
