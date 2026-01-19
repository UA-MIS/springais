// Main container component for Skills Dashboard
// This will render inside MainLayout from Block H (when available)

import { useSkills } from '../../hooks/useSkills';
import SkillSearchBar from './SkillSearchBar';
import SkillsPortfolio from './SkillsPortfolio';
import SkillDetailModal from './SkillDetailModal';
import AddSkillModal from './AddSkillModal';
import { THEME, PROGRESS_COLORS } from './ThemeSwitcher';
import { useState } from 'react';

export default function SkillsDashboard() {
  const {
    skills,
    selectedSkill,
    setSelectedSkill,
    filterTab,
    setFilterTab,
    searchQuery,
    setSearchQuery,
    updateSkill,
    addSkill,
  } = useSkills();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const theme = THEME;

  const handleSkillClick = (skill) => {
    setSelectedSkill(skill);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedSkill(null);
  };

  const handleUpdateSkill = (updatedSkill) => {
    updateSkill(updatedSkill);
    handleCloseDetailModal();
  };

  // Calculate overall stats for header
  const totalSkills = skills.length;
  const completedSkills = skills.filter(s => s.status === 'complete').length;
  const avgProgress = skills.length > 0 
    ? Math.round(skills.reduce((sum, s) => sum + s.proficiency, 0) / skills.length)
    : 0;

  return (
    <div 
      className="min-h-screen p-4 md:p-6 transition-colors duration-300"
      style={{ backgroundColor: theme.pageBg }}
    >
      {/* Professional Header */}
      <div 
        className="mb-6 rounded-2xl shadow-xl overflow-hidden"
        style={{ background: theme.headerBg }}
      >
        {/* Decorative top accent bar */}
        <div 
          className="h-1"
          style={{ 
            background: `linear-gradient(90deg, ${theme.primaryBtn.bg} 0%, transparent 50%, ${theme.primaryBtn.bg} 100%)`,
            opacity: 0.6 
          }}
        />
        
        <div className="p-6 lg:p-8">
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
            {/* Left: Title, Subtitle & Progress Ring */}
            <div className="flex items-start gap-6">
              {/* Overall Progress Ring */}
              <div className="hidden sm:flex flex-col items-center">
                <div className="relative">
                  <svg viewBox="0 0 80 80" className="w-20 h-20">
                    {/* Background ring */}
                    <circle 
                      cx="40" cy="40" r="34"
                      fill="none" 
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="6"
                    />
                    {/* Progress ring */}
                    <circle 
                      cx="40" cy="40" r="34"
                      fill="none" 
                      stroke={theme.primaryBtn.bg}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${(avgProgress / 100) * 213.6} 213.6`}
                      transform="rotate(-90 40 40)"
                      style={{ transition: 'stroke-dasharray 0.5s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span 
                      className="text-lg font-bold"
                      style={{ color: theme.headerText }}
                    >
                      {avgProgress}%
                    </span>
                  </div>
                </div>
                <span 
                  className="text-xs mt-1 uppercase tracking-wider font-medium"
                  style={{ color: theme.headerSubtext }}
                >
                  Overall
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 
                    className="text-2xl lg:text-3xl font-bold tracking-tight"
                    style={{ color: theme.headerText }}
                  >
                    Skills Portfolio
                  </h1>
                  <span 
                    className="px-2.5 py-0.5 text-xs font-semibold rounded-full"
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      color: theme.headerText 
                    }}
                  >
                    {totalSkills} skills
                  </span>
                </div>
                <p 
                  className="text-sm lg:text-base max-w-md"
                  style={{ color: theme.headerSubtext }}
                >
                  Track your professional development, certifications, and career growth
                </p>
              </div>
            </div>

            {/* Right: Stat Cards & Action Button */}
            <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full xl:w-auto">
              {/* Stat Cards */}
              <div className="flex gap-3">
                {/* Active Skills Card */}
                <div 
                  className="flex-1 sm:flex-none px-4 py-3 rounded-xl flex items-center gap-3 min-w-[120px]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke={theme.headerText} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p 
                      className="text-xl font-bold leading-none"
                      style={{ color: theme.headerText }}
                    >
                      {skills.filter(s => s.status === 'active').length}
                    </p>
                    <p 
                      className="text-xs uppercase tracking-wide mt-0.5"
                      style={{ color: theme.headerSubtext }}
                    >
                      Active
                    </p>
                  </div>
                </div>

                {/* Completed Card */}
                <div 
                  className="flex-1 sm:flex-none px-4 py-3 rounded-xl flex items-center gap-3 min-w-[120px]"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="#22c55e" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p 
                      className="text-xl font-bold leading-none"
                      style={{ color: theme.headerText }}
                    >
                      {completedSkills}
                    </p>
                    <p 
                      className="text-xs uppercase tracking-wide mt-0.5"
                      style={{ color: theme.headerSubtext }}
                    >
                      Completed
                    </p>
                  </div>
                </div>
              </div>

              {/* Add Skill Button */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 group"
                style={{ 
                  backgroundColor: theme.primaryBtn.bg, 
                  color: theme.primaryBtn.text,
                  border: `2px solid ${theme.primaryBtn.border}`,
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = theme.primaryBtn.hover}
                onMouseLeave={(e) => e.target.style.backgroundColor = theme.primaryBtn.bg}
              >
                <svg className="w-5 h-5 transition-transform group-hover:rotate-90 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Skill</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <SkillSearchBar
        filterTab={filterTab}
        onFilterChange={setFilterTab}
        onSearchChange={setSearchQuery}
        theme={theme}
      />

      {/* Skills Portfolio */}
      <SkillsPortfolio
        skills={skills}
        filterTab={filterTab}
        searchQuery={searchQuery}
        onSkillClick={handleSkillClick}
        theme={theme}
        progressColors={PROGRESS_COLORS}
      />

      {/* Modals */}
      {isDetailModalOpen && selectedSkill && (
        <SkillDetailModal
          skill={selectedSkill}
          onClose={handleCloseDetailModal}
          onUpdate={handleUpdateSkill}
          theme={theme}
        />
      )}

      {isAddModalOpen && (
        <AddSkillModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={(newSkill) => {
            addSkill(newSkill);
            setIsAddModalOpen(false);
          }}
          theme={theme}
        />
      )}
    </div>
  );
}
