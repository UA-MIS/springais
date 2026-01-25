// Portfolio grid view component
// Displays skills organized by category with filtering

import SkillCategory from './SkillCategory';
import { SKILL_CATEGORIES } from '../../mocks/mockSkills';
import { useSkillsContext } from '../../context/SkillsContext';

export default function SkillsPortfolio({
  skills,
  filterTab,
  searchQuery,
  onSkillClick,
  onMarkComplete,
  theme,
  progressColors
}) {
  // Get dynamic categories from context (AI-generated)
  const { skillCategories: dynamicCategories, categoriesLoading } = useSkillsContext();

  // Use dynamic categories if available, fallback to hardcoded SKILL_CATEGORIES
  const categories = dynamicCategories && dynamicCategories.length > 0
    ? dynamicCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        emoji: cat.emoji || 'star',
        skillCount: cat.skills?.length || 0,
        completionPercent: 0,
        modules: cat.modules || [],
      }))
    : SKILL_CATEGORIES;
  // Filter skills based on active tab
  const filterByTab = (skillsList) => {
    switch (filterTab) {
      case 'active':
        // Handle both 'active' and 'in_progress' statuses (backend uses 'in_progress')
        return skillsList.filter(skill => skill.status === 'active' || skill.status === 'in_progress');
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
      const categoryName = categories.find(c => c.id === skill.category)?.name || '';
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
  // If using dynamic categories, match skills by:
  // 1. categoryId from backend (set by progress tracking)
  // 2. Skill name in category.skills list
  const skillsByCategory = dynamicCategories && dynamicCategories.length > 0
    ? dynamicCategories.map(category => {
        // Match skills by categoryId (from backend) OR by name in category.skills
        const categorySkillNames = new Set((category.skills || []).map(s => s.toLowerCase()));
        const matchingSkills = filteredSkills.filter(skill =>
          skill.categoryId === category.id ||
          categorySkillNames.has(skill.name.toLowerCase())
        );
        return {
          id: category.id,
          name: category.name,
          emoji: category.emoji || 'star',
          modules: category.modules || [],
          skills: matchingSkills,
        };
      }).filter(category => category.skills.length > 0)
    : categories.map(category => ({
        ...category,
        skills: filteredSkills.filter(skill =>
          skill.category === category.id || skill.categoryId === category.id
        ),
      })).filter(category => category.skills.length > 0);

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

  // Get fetchSkillGroupings from context
  const { fetchSkillGroupings } = useSkillsContext();

  // Handle category updates
  const handleCategoryUpdated = () => {
    fetchSkillGroupings?.();
  };

  const handleCategoryDeleted = () => {
    fetchSkillGroupings?.();
  };

  return (
    <div className="space-y-6">
      {skillsByCategory.map((category) => (
        <SkillCategory
          key={category.id}
          category={category}
          skills={category.skills}
          onSkillClick={onSkillClick}
          onMarkComplete={onMarkComplete}
          theme={theme}
          progressColors={progressColors}
          onCategoryUpdated={handleCategoryUpdated}
          onCategoryDeleted={handleCategoryDeleted}
        />
      ))}
    </div>
  );
}
