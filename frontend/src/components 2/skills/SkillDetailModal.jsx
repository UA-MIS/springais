// Skill detail and edit modal
// Shows full skill information with edit capabilities

import { useState, useEffect, useRef, useMemo } from 'react';
import SkillProgressRing from './SkillProgressRing';
import { SKILL_CATEGORIES, generateDefaultLearningResources } from '../../mocks/mockSkills';
import { completeModule, updateModuleProgress, completeSkill } from '../../services/skillProgressService';

export default function SkillDetailModal({ skill, onClose, onUpdate, onRefresh, onMarkComplete }) {
  const modalRef = useRef(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedSkill, setEditedSkill] = useState(skill);
  const [moduleLoading, setModuleLoading] = useState(null);
  const [completingSkill, setCompletingSkill] = useState(false);

  // Use real modules from skill prop (from API) or empty array
  const modules = skill?.modules || [];

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    // Focus first input if in edit mode
    if (isEditMode && modalRef.current) {
      const firstInput = modalRef.current.querySelector('input, textarea, select');
      firstInput?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, isEditMode]);

  const handleSave = () => {
    onUpdate?.(editedSkill);
    setIsEditMode(false);
  };

  const handleCancel = () => {
    setEditedSkill(skill);
    setIsEditMode(false);
  };

  const updateField = (field, value) => {
    setEditedSkill({ ...editedSkill, [field]: value });
  };

  // Handle starting a module (set progress to start)
  const handleStartModule = async (moduleId) => {
    setModuleLoading(moduleId);
    try {
      await updateModuleProgress(skill.name, moduleId, 1);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to start module:', error);
    } finally {
      setModuleLoading(null);
    }
  };

  // Handle completing a module
  const handleCompleteModule = async (moduleId) => {
    setModuleLoading(moduleId);
    try {
      await completeModule(skill.name, moduleId);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to complete module:', error);
    } finally {
      setModuleLoading(null);
    }
  };

  // Handle marking entire skill as complete
  const handleMarkSkillComplete = async () => {
    setCompletingSkill(true);
    try {
      await completeSkill(skill.name);
      // Also update local state via callback
      if (onMarkComplete) {
        onMarkComplete(skill.id, skill.name);
      }
      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('Failed to complete skill:', error);
    } finally {
      setCompletingSkill(false);
    }
  };

  // Get status badge styling for modules
  const getModuleStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return { bg: '#d1fae5', text: '#065f46', label: 'Completed' };
      case 'in_progress':
        return { bg: '#fef3c7', text: '#92400e', label: 'In Progress' };
      case 'not_started':
      default:
        return { bg: '#f3f4f6', text: '#6b7280', label: 'Not Started' };
    }
  };

  const categoryName = SKILL_CATEGORIES.find(c => c.id === skill.category)?.name || skill.category;

  // Learning resources (fallback to generated if not provided)
  const learningResources = useMemo(() => {
    return skill.learningResources || generateDefaultLearningResources(skill);
  }, [skill]);

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ey-gray-light">
          <h2 className="text-xl font-bold text-ey-confident-black">
            {isEditMode ? 'Edit Skill' : skill.name}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditMode && skill.status !== 'completed' && (
              <button
                onClick={handleMarkSkillComplete}
                disabled={completingSkill}
                className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {completingSkill ? 'Completing...' : 'Mark Complete'}
              </button>
            )}
            {!isEditMode && (
              <button
                onClick={() => setIsEditMode(true)}
                className="px-4 py-2 text-sm font-medium text-ey-confident-black border border-ey-gray-light rounded-lg hover:bg-ey-off-white transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-ey-gray hover:text-ey-confident-black transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isEditMode ? (
            <div className="space-y-4">
              {/* Skill Name */}
              <div>
                <label className="block text-sm font-medium text-ey-confident-black mb-2">
                  Skill Name
                </label>
                <input
                  type="text"
                  value={editedSkill.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-4 py-2 border border-ey-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-ey-yellow"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-ey-confident-black mb-2">
                  Category
                </label>
                <select
                  value={editedSkill.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="w-full px-4 py-2 border border-ey-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-ey-yellow"
                >
                  {SKILL_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Proficiency */}
              <div>
                <label className="block text-sm font-medium text-ey-confident-black mb-2">
                  Proficiency: {editedSkill.proficiency}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editedSkill.proficiency}
                  onChange={(e) => updateField('proficiency', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-ey-confident-black mb-2">
                  Notes
                </label>
                <textarea
                  value={editedSkill.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-ey-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-ey-yellow"
                  placeholder="Add notes about this skill..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progress Ring */}
              <div className="flex justify-center">
                <SkillProgressRing percentage={skill.progress?.percentage ?? skill.proficiency} size="large" />
              </div>

              {/* Skill Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-ey-gray uppercase">Category</label>
                  <p className="text-base text-ey-confident-black mt-1">{categoryName}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-ey-gray uppercase">Progress</label>
                  <p className="text-base text-ey-confident-black mt-1">
                    {skill.progress 
                      ? `${skill.progress.current} of ${skill.progress.total} ${skill.progress.unit}`
                      : `${skill.proficiency}% complete`
                    }
                  </p>
                </div>

                {skill.completedDate && (
                  <div>
                    <label className="text-xs font-medium text-ey-gray uppercase">Completed</label>
                    <p className="text-base text-ey-confident-black mt-1">
                      {new Date(skill.completedDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                )}

                {skill.certifications && skill.certifications.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-ey-gray uppercase">Certifications</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {skill.certifications.map((cert, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-ey-yellow/15 text-ey-confident-black rounded-md text-sm font-medium"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {skill.notes && (
                  <div>
                    <label className="text-xs font-medium text-ey-gray uppercase">Notes</label>
                    <p className="text-base text-ey-confident-black mt-1">{skill.notes}</p>
                  </div>
                )}
              </div>

              {/* Modules Section - Real module tracking */}
              {modules && modules.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-ey-gray uppercase mb-3 block">
                    Learning Modules ({modules.filter(m => m.status === 'completed').length} of {modules.length} completed)
                  </label>
                  <div className="space-y-3">
                    {modules.map((module) => {
                      const statusStyle = getModuleStatusStyle(module.status);
                      const isLoading = moduleLoading === module.id;

                      return (
                        <div
                          key={module.id}
                          className="p-4 border border-ey-gray-light rounded-lg hover:border-ey-yellow/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-ey-gray">
                                  Module {module.number}
                                </span>
                                <span
                                  className="px-2 py-0.5 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: statusStyle.bg,
                                    color: statusStyle.text
                                  }}
                                >
                                  {statusStyle.label}
                                </span>
                              </div>
                              <h4 className="text-sm font-semibold text-ey-confident-black">
                                {module.title}
                              </h4>
                              {module.description && (
                                <p className="text-xs text-ey-gray mt-1">{module.description}</p>
                              )}
                            </div>

                            {/* Module Actions */}
                            <div className="flex-shrink-0">
                              {module.status === 'not_started' && (
                                <button
                                  onClick={() => handleStartModule(module.id)}
                                  disabled={isLoading}
                                  className="px-3 py-1.5 text-xs font-medium bg-ey-yellow text-ey-confident-black rounded-lg hover:bg-ey-yellow-dark transition-colors disabled:opacity-50"
                                >
                                  {isLoading ? 'Starting...' : 'Start'}
                                </button>
                              )}
                              {module.status === 'in_progress' && (
                                <button
                                  onClick={() => handleCompleteModule(module.id)}
                                  disabled={isLoading}
                                  className="px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                                >
                                  {isLoading ? 'Completing...' : 'Complete'}
                                </button>
                              )}
                              {module.status === 'completed' && (
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </div>
                          </div>

                          {/* Progress bar for in-progress modules */}
                          {module.status === 'in_progress' && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-ey-gray mb-1">
                                <span>Progress</span>
                                <span>{module.progress}%</span>
                              </div>
                              <div className="w-full h-2 bg-ey-gray-light rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-ey-yellow rounded-full transition-all duration-300"
                                  style={{ width: `${module.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Learning Resources */}
              {learningResources && learningResources.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-ey-gray uppercase mb-3 block">Learning Resources</label>
                  <div className="space-y-2">
                    {learningResources.map((resource, idx) => (
                      <a
                        key={idx}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 border border-ey-gray-light rounded-lg hover:border-ey-yellow hover:bg-ey-yellow/5 transition-colors group"
                      >
                        <div className="flex-shrink-0">
                          {resource.type === 'course' && (
                            <svg className="w-5 h-5 text-ey-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          )}
                          {resource.type === 'certification' && (
                            <svg className="w-5 h-5 text-ey-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                          )}
                          {resource.type === 'practice' && (
                            <svg className="w-5 h-5 text-ey-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                          )}
                          {resource.type === 'documentation' && (
                            <svg className="w-5 h-5 text-ey-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ey-confident-black group-hover:text-ey-yellow transition-colors truncate">
                            {resource.title}
                          </p>
                          <p className="text-xs text-ey-gray">{resource.provider}</p>
                        </div>
                        <svg className="w-4 h-4 text-ey-gray group-hover:text-ey-yellow transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isEditMode && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-ey-gray-light bg-ey-off-white">
            <button
              onClick={handleCancel}
              className="px-6 py-2 text-sm font-medium text-ey-gray border border-ey-gray-light rounded-lg hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 text-sm font-semibold bg-ey-yellow text-ey-confident-black rounded-lg hover:bg-ey-yellow-dark transition-colors"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
