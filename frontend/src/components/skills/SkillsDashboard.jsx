// Main container component for Skills Dashboard
// This will render inside MainLayout from Block H (when available)

import { useSkillsContext } from '../../context/SkillsContext';
import SkillSearchBar from './SkillSearchBar';
import SkillsPortfolio from './SkillsPortfolio';
import SkillDetailModal from './SkillDetailModal';
import AddSkillModal from './AddSkillModal';
import ResumeUpload from './ResumeUpload';
import { DARK_THEME, LIGHT_THEME, PROGRESS_COLORS } from './ThemeSwitcher';
import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

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
    addSkills,
    clearSkills,
    fetchSkillsWithProgress,
    markSkillComplete,
  } = useSkillsContext();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showResumeUpload, setShowResumeUpload] = useState(false);

  // FIX: Sync selectedSkill when skills array is refreshed (e.g., after proficiency change)
  // This ensures the modal shows updated data after onRefresh is called
  useEffect(() => {
    if (selectedSkill && skills.length > 0) {
      const updatedSkill = skills.find(
        s => s.id === selectedSkill.id || s.name?.toLowerCase() === selectedSkill.name?.toLowerCase()
      );
      if (updatedSkill && JSON.stringify(updatedSkill) !== JSON.stringify(selectedSkill)) {
        setSelectedSkill(updatedSkill);
      }
    }
  }, [skills, selectedSkill, setSelectedSkill]);

  // Use global theme context
  const { theme: globalTheme, isDark, isGame } = useTheme();
  // Map global theme to local theme constants
  const localTheme = (isDark || isGame) ? DARK_THEME : LIGHT_THEME;

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
  const completedSkills = skills.filter(s => s.status === 'completed').length;
  const avgProgress = skills.length > 0
    ? Math.round(skills.reduce((sum, s) => sum + (s.progress?.percentage ?? s.proficiency), 0) / skills.length)
    : 0;

  return (
    <div 
      className="min-h-screen p-4 md:p-6 transition-colors duration-300"
      style={{ backgroundColor: localTheme.pageBg }}
    >
      {/* Professional Header */}
      <div 
        className="mb-6 rounded-2xl shadow-xl overflow-hidden"
        style={{ background: localTheme.headerBg }}
      >
        {/* Decorative top accent bar */}
        <div 
          className="h-1"
          style={{ 
            background: `linear-gradient(90deg, ${localTheme.primaryBtn.bg} 0%, transparent 50%, ${localTheme.primaryBtn.bg} 100%)`,
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
                      stroke={localTheme.primaryBtn.bg}
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
                      style={{ color: localTheme.headerText }}
                    >
                      {avgProgress}%
                    </span>
                  </div>
                </div>
                <span 
                  className="text-xs mt-1 uppercase tracking-wider font-medium"
                  style={{ color: localTheme.headerSubtext }}
                >
                  Overall
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 
                    className="text-2xl lg:text-3xl font-bold tracking-tight"
                    style={{ color: localTheme.headerText }}
                  >
                    Skills Portfolio
                  </h1>
                  <span 
                    className="px-2.5 py-0.5 text-xs font-semibold rounded-full"
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      color: localTheme.headerText 
                    }}
                  >
                    {totalSkills} skills
                  </span>
                </div>
                <p 
                  className="text-sm lg:text-base max-w-md"
                  style={{ color: localTheme.headerSubtext }}
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
                    <svg className="w-5 h-5" fill="none" stroke={localTheme.headerText} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p
                      className="text-xl font-bold leading-none"
                      style={{ color: localTheme.headerText }}
                    >
                      {skills.filter(s => s.status === 'active' || s.status === 'in_progress').length}
                    </p>
                    <p
                      className="text-xs uppercase tracking-wide mt-0.5"
                      style={{ color: localTheme.headerSubtext }}
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
                      style={{ color: localTheme.headerText }}
                    >
                      {completedSkills}
                    </p>
                    <p 
                      className="text-xs uppercase tracking-wide mt-0.5"
                      style={{ color: localTheme.headerSubtext }}
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
                  backgroundColor: localTheme.primaryBtn.bg, 
                  color: localTheme.primaryBtn.text,
                  border: `2px solid ${localTheme.primaryBtn.border}`,
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = localTheme.primaryBtn.hover}
                onMouseLeave={(e) => e.target.style.backgroundColor = localTheme.primaryBtn.bg}
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

      {/* Empty State - Prompt to upload resume */}
      {skills.length === 0 && !showResumeUpload && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            backgroundColor: localTheme.cardBg,
            border: `2px dashed ${localTheme.cardBorder}`,
          }}
        >
          <div className="max-w-md mx-auto">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-50"
              fill="none"
              stroke={localTheme.categoryText}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: localTheme.categoryText }}
            >
              No Skills Yet
            </h3>
            <p
              className="mb-6"
              style={{ color: localTheme.headerSubtext }}
            >
              Upload your resume to automatically extract and track your professional skills.
            </p>
            <button
              onClick={() => setShowResumeUpload(true)}
              className="font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg"
              style={{
                backgroundColor: localTheme.primaryBtn.bg,
                color: localTheme.primaryBtn.text,
                border: `2px solid ${localTheme.primaryBtn.border}`,
              }}
            >
              Upload Resume
            </button>
          </div>
        </div>
      )}

      {/* Resume Upload Modal */}
      {showResumeUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="w-full max-w-2xl rounded-2xl p-6"
            style={{ backgroundColor: localTheme.cardBg }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2
                className="text-xl font-semibold"
                style={{ color: localTheme.categoryText }}
              >
                Upload Your Resume
              </h2>
              <button
                onClick={() => setShowResumeUpload(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg className="w-5 h-5" fill="none" stroke={localTheme.categoryText} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ResumeUpload
              onSkillsExtracted={(extractedSkills) => {
                clearSkills();
                addSkills(extractedSkills);
                setShowResumeUpload(false);
              }}
              theme={localTheme}
            />
          </div>
        </div>
      )}

      {/* Search and Filter Bar - only show if there are skills */}
      {skills.length > 0 && (
        <SkillSearchBar
          filterTab={filterTab}
          onFilterChange={setFilterTab}
          onSearchChange={setSearchQuery}
          theme={localTheme}
        />
      )}

      {/* Skills Portfolio - only show if there are skills */}
      {skills.length > 0 && (
        <SkillsPortfolio
          skills={skills}
          filterTab={filterTab}
          searchQuery={searchQuery}
          onSkillClick={handleSkillClick}
          onMarkComplete={markSkillComplete}
          theme={localTheme}
          progressColors={PROGRESS_COLORS}
        />
      )}

      {/* Modals */}
      {isDetailModalOpen && selectedSkill && (
        <SkillDetailModal
          skill={selectedSkill}
          onClose={handleCloseDetailModal}
          onUpdate={handleUpdateSkill}
          onRefresh={fetchSkillsWithProgress}
          onMarkComplete={markSkillComplete}
          theme={localTheme}
        />
      )}

      {isAddModalOpen && (
        <AddSkillModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={(newSkill) => {
            addSkill(newSkill);
            setIsAddModalOpen(false);
          }}
          theme={localTheme}
        />
      )}
    </div>
  );
}
