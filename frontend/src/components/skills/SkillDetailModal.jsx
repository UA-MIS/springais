// Skill detail and edit modal
// Shows full skill information with edit capabilities, proficiency management, and learning content

import { useState, useEffect, useRef, useMemo } from 'react';
import SkillProgressRing from './SkillProgressRing';
import { SKILL_CATEGORIES, generateDefaultLearningResources } from '../../mocks/mockSkills';
import {
  completeModule,
  updateModuleProgress,
  completeSkill,
  updateProficiency,
  completeModuleWithProof,
  uploadModuleProof,
  generateModuleContent,
  toggleModuleTask,
  PROFICIENCY_LABELS
} from '../../services/skillProgressService';

export default function SkillDetailModal({ skill, onClose, onUpdate, onRefresh, onMarkComplete }) {
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedSkill, setEditedSkill] = useState(skill);
  const [moduleLoading, setModuleLoading] = useState(null);
  const [completingSkill, setCompletingSkill] = useState(false);
  const [proficiencyUpdating, setProficiencyUpdating] = useState(false);

  // Learning content state
  const [expandedModule, setExpandedModule] = useState(null);
  const [generatingContent, setGeneratingContent] = useState(null);
  const [moduleContent, setModuleContent] = useState({});

  // FIX: Sync editedSkill when skill prop changes (e.g., after refresh or modal reopen)
  // This ensures proficiency changes from API persist when modal reopens
  useEffect(() => {
    setEditedSkill(skill);
  }, [skill]);

  // FIX: Pre-load learning content from module data when modal opens
  // This ensures cached content persists across page navigation
  useEffect(() => {
    const initialContent = {};
    const mods = skill?.modules || [];

    // Debug: Log what modules we receive
    console.log('[SkillDetailModal] Checking modules for learning content:',
      mods.map(m => ({
        id: m.id,
        title: m.title,
        hasContent: !!m.learning_content,
        contentPreview: m.learning_content?.substring(0, 50)
      }))
    );

    mods.forEach(module => {
      if (module.learning_content) {
        initialContent[module.id] = {
          learning_guide: module.learning_content,
          external_resources: module.external_resources || [],
          ey_resources: module.ey_resources || [],
        };
      }
    });

    if (Object.keys(initialContent).length > 0) {
      console.log('[SkillDetailModal] Pre-loading content for modules:', Object.keys(initialContent));
      setModuleContent(prev => ({ ...prev, ...initialContent }));
    }
  }, [skill]);

  // Proof submission state
  const [showProofForm, setShowProofForm] = useState(null);
  const [proofData, setProofData] = useState({
    completion_type: 'self_reported',
    proof_description: '',
    proof_link: '',
    request_ai_review: false
  });
  const [proofFile, setProofFile] = useState(null);
  const [submittingProof, setSubmittingProof] = useState(false);

  // Task tracking state (tracks completed task indices per module)
  const [moduleTasks, setModuleTasks] = useState({});
  const [togglingTask, setTogglingTask] = useState(null);

  // Use real modules from skill prop (from API) or empty array
  // FIX: Sort modules by number to maintain consistent order
  const modules = useMemo(() => {
    const mods = skill?.modules || [];
    return [...mods].sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [skill?.modules]);

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

  const handleSave = async () => {
    // Check if proficiency changed and update via API
    const originalProficiency = skill.proficiency_level ?? Math.round((skill.proficiency || 0) / 20);
    const newProficiency = editedSkill.proficiency_level ?? originalProficiency;

    if (newProficiency !== originalProficiency) {
      try {
        await updateProficiency(skill.name, newProficiency);
      } catch (error) {
        console.error('Failed to update proficiency:', error);
      }
    }

    onUpdate?.(editedSkill);
    onRefresh?.();
    setIsEditMode(false);
  };

  const handleCancel = () => {
    setEditedSkill(skill);
    setIsEditMode(false);
  };

  const updateField = (field, value) => {
    setEditedSkill({ ...editedSkill, [field]: value });
  };

  // Handle proficiency change (1-5 scale)
  const handleProficiencyChange = async (newLevel) => {
    setProficiencyUpdating(true);
    try {
      const result = await updateProficiency(skill.name, newLevel);
      // FIX: Update local state immediately for instant visual feedback
      setEditedSkill(prev => ({
        ...prev,
        proficiency_level: result.proficiency_level,
        proficiency_label: PROFICIENCY_LABELS[result.proficiency_level],
        counts_for_matching: result.counts_for_matching,
      }));
      // Also refresh parent data
      onRefresh?.();
    } catch (error) {
      console.error('Failed to update proficiency:', error);
    } finally {
      setProficiencyUpdating(false);
    }
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

  // Handle completing a module (simple)
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

  // Handle completing module with proof
  const handleCompleteWithProof = async (moduleId) => {
    setSubmittingProof(true);
    try {
      // First upload file if present
      if (proofFile) {
        await uploadModuleProof(skill.name, moduleId, proofFile);
      }

      // Then complete with proof details
      const payload = {
        completion_type: proofData.proof_description || proofData.proof_link || proofFile
          ? 'with_proof'
          : 'self_reported',
        ...(proofData.proof_description && { proof_description: proofData.proof_description }),
        ...(proofData.proof_link && { proof_link: proofData.proof_link }),
        request_ai_review: proofData.request_ai_review
      };

      const result = await completeModuleWithProof(skill.name, moduleId, payload);

      // Show AI feedback if provided
      if (result.ai_feedback) {
        alert(`AI Feedback: ${result.ai_feedback}`);
      }

      setShowProofForm(null);
      setProofData({
        completion_type: 'self_reported',
        proof_description: '',
        proof_link: '',
        request_ai_review: false
      });
      setProofFile(null);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to complete module with proof:', error);
      alert('Failed to submit proof. Please try again.');
    } finally {
      setSubmittingProof(false);
    }
  };

  // Generate learning content for a module
  const handleGenerateContent = async (moduleId) => {
    setGeneratingContent(moduleId);
    try {
      const content = await generateModuleContent(skill.name, moduleId);
      setModuleContent(prev => ({ ...prev, [moduleId]: content }));
      setExpandedModule(moduleId);
    } catch (error) {
      console.error('Failed to generate content:', error);
      alert('Failed to generate learning content. Please try again.');
    } finally {
      setGeneratingContent(null);
    }
  };

  // Toggle task completion within a module
  const handleToggleTask = async (moduleId, taskIndex) => {
    const currentTasks = moduleTasks[moduleId] || [];
    const isCompleted = currentTasks.includes(taskIndex);

    // Optimistic update
    setModuleTasks(prev => ({
      ...prev,
      [moduleId]: isCompleted
        ? prev[moduleId].filter(i => i !== taskIndex)
        : [...(prev[moduleId] || []), taskIndex]
    }));

    setTogglingTask(`${moduleId}-${taskIndex}`);
    try {
      const result = await toggleModuleTask(skill.name, moduleId, taskIndex, !isCompleted);
      // Update with server response
      setModuleTasks(prev => ({ ...prev, [moduleId]: result.tasks_completed }));
    } catch (error) {
      console.error('Failed to toggle task:', error);
      // Revert optimistic update on error
      setModuleTasks(prev => ({
        ...prev,
        [moduleId]: currentTasks
      }));
    } finally {
      setTogglingTask(null);
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

  // Get resource type icon
  const getResourceIcon = (type) => {
    switch (type) {
      case 'course':
      case 'video':
        return (
          <svg className="w-5 h-5 text-ey-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'certification':
      case 'badge':
        return (
          <svg className="w-5 h-5 text-ey-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      case 'practice':
      case 'hands-on':
        return (
          <svg className="w-5 h-5 text-ey-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case 'ey_badge':
      case 'ey_course':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-ey-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
    }
  };

  const categoryName = SKILL_CATEGORIES.find(c => c.id === skill.category)?.name || skill.category;

  // Calculate predicted proficiency after completing a module
  const getPredictedProficiency = (completingModuleId) => {
    const totalModules = modules.length;
    if (totalModules === 0) return proficiencyLevel;

    // Count how many would be completed after this one
    const wouldBeCompleted = modules.filter(
      m => m.status === 'completed' || m.id === completingModuleId
    ).length;

    const percentage = (wouldBeCompleted / totalModules) * 100;

    // Same logic as backend _update_skill_proficiency
    if (percentage >= 80) return 5;
    if (percentage >= 60) return 4;
    if (percentage >= 40) return 3;
    if (percentage >= 20) return 2;
    if (percentage > 0) return 1;
    return proficiencyLevel;
  };

  // Learning resources (fallback to generated if not provided)
  const learningResources = useMemo(() => {
    return skill.learningResources || generateDefaultLearningResources(skill);
  }, [skill]);

  // Proficiency level (from editedSkill for instant updates, then API fields, then fallback)
  // FIX: Use editedSkill state so changes are reflected immediately
  const proficiencyLevel = editedSkill.proficiency_level ?? skill.proficiency_level ?? Math.round((skill.proficiency || 0) / 20);
  const proficiencyLabel = editedSkill.proficiency_label || skill.proficiency_label || PROFICIENCY_LABELS[proficiencyLevel] || 'None';
  const countsForMatching = editedSkill.counts_for_matching ?? skill.counts_for_matching ?? (proficiencyLevel >= 3);
  const needsUpdate = skill.needs_update ?? false;

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
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-ey-confident-black">
              {isEditMode ? 'Edit Skill' : skill.name}
            </h2>
            {/* Skill decay warning */}
            {needsUpdate && !isEditMode && (
              <span
                className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full flex items-center gap-1"
                title="This skill hasn't been updated in 6+ months"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Needs Update
              </span>
            )}
            {/* Matching badge */}
            {countsForMatching && !isEditMode && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                Counts for Matching
              </span>
            )}
          </div>
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

              {/* Proficiency (1-5 scale) */}
              <div>
                <label className="block text-sm font-medium text-ey-confident-black mb-2">
                  Proficiency Level: {proficiencyLevel} - {PROFICIENCY_LABELS[editedSkill.proficiency_level ?? proficiencyLevel]}
                </label>
                <div className="flex items-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => updateField('proficiency_level', level)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        (editedSkill.proficiency_level ?? proficiencyLevel) === level
                          ? 'bg-ey-yellow text-ey-confident-black shadow-md'
                          : 'bg-ey-off-white text-ey-gray hover:bg-ey-gray-light'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-1 text-xs text-ey-gray px-1">
                  <span>None</span>
                  <span>Expert</span>
                </div>
                <p className="text-xs text-ey-gray mt-2">
                  Level 3+ (Intermediate) counts toward job matching
                </p>
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
              {/* Proficiency Selector (read mode) */}
              <div>
                <label className="text-xs font-medium text-ey-gray uppercase mb-3 block">
                  Proficiency Level
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {[0, 1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => handleProficiencyChange(level)}
                      disabled={proficiencyUpdating}
                      className={`flex-1 py-3 px-2 rounded-lg text-sm font-medium transition-all ${
                        proficiencyLevel === level
                          ? 'bg-ey-yellow text-ey-confident-black shadow-md scale-105'
                          : level < proficiencyLevel
                            ? 'bg-ey-yellow/30 text-ey-confident-black'
                            : 'bg-ey-off-white text-ey-gray hover:bg-ey-gray-light'
                      } ${proficiencyUpdating ? 'opacity-50 cursor-wait' : ''}`}
                      title={PROFICIENCY_LABELS[level]}
                    >
                      <div className="text-lg font-bold">{level}</div>
                      <div className="text-[10px] leading-tight truncate">{PROFICIENCY_LABELS[level]}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-ey-gray text-center">
                  {proficiencyLevel >= 3
                    ? '✓ This skill counts toward job matching'
                    : 'Reach level 3+ to include in job matching'
                  }
                </p>
              </div>

              {/* Progress Ring */}
              <div className="flex justify-center">
                <SkillProgressRing percentage={skill.progress?.percentage ?? (proficiencyLevel * 20)} size="large" />
              </div>

              {/* Skill Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-ey-gray uppercase">Category</label>
                  <p className="text-base text-ey-confident-black mt-1">{categoryName}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-ey-gray uppercase">Source</label>
                  <p className="text-base text-ey-confident-black mt-1 capitalize">
                    {skill.source === 'resume' ? 'Extracted from Resume'
                      : skill.source === 'job_gap' ? 'Added from Job Gap'
                      : skill.source === 'roadmap' ? 'From Learning Roadmap'
                      : skill.source || 'Manual'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-ey-gray uppercase">Progress</label>
                  <p className="text-base text-ey-confident-black mt-1">
                    {/* Always use actual modules array length for accurate count */}
                    {modules.length > 0
                      ? `${modules.filter(m => m.status === 'completed').length} of ${modules.length} modules completed`
                      : skill.progress?.total > 0
                        ? `${skill.progress.current || 0} of ${skill.progress.total} ${skill.progress.unit}`
                        : 'No modules yet'
                    }
                  </p>
                </div>

                {skill.last_updated_at && (
                  <div>
                    <label className="text-xs font-medium text-ey-gray uppercase">Last Updated</label>
                    <p className="text-base text-ey-confident-black mt-1">
                      {new Date(skill.last_updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                {skill.completed_at && (
                  <div>
                    <label className="text-xs font-medium text-ey-gray uppercase">Completed</label>
                    <p className="text-base text-ey-confident-black mt-1">
                      {new Date(skill.completed_at).toLocaleDateString('en-US', {
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

              {/* Modules Section - Real module tracking with learning content */}
              {modules && modules.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-ey-gray uppercase mb-3 block">
                    Learning Modules ({modules.filter(m => m.status === 'completed').length} of {modules.length} completed)
                  </label>
                  <div className="space-y-3">
                    {modules.map((module) => {
                      const statusStyle = getModuleStatusStyle(module.status);
                      const isLoading = moduleLoading === module.id;
                      const isExpanded = expandedModule === module.id;
                      const isGenerating = generatingContent === module.id;
                      const content = moduleContent[module.id] || (module.learning_content ? { learning_guide: module.learning_content, external_resources: module.external_resources, ey_resources: module.ey_resources } : null);
                      const showingProofForm = showProofForm === module.id;

                      return (
                        <div
                          key={module.id}
                          className="border border-ey-gray-light rounded-lg hover:border-ey-yellow/50 transition-colors overflow-hidden"
                        >
                          {/* Module Header */}
                          <div className="p-4">
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
                              <div className="flex-shrink-0 flex items-center gap-2">
                                {module.status !== 'completed' && (
                                  <button
                                    onClick={() => setExpandedModule(isExpanded ? null : module.id)}
                                    className="p-1.5 text-ey-gray hover:text-ey-confident-black hover:bg-ey-off-white rounded transition-colors"
                                    title={isExpanded ? 'Collapse' : 'Expand learning content'}
                                  >
                                    <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                )}
                                {module.status === 'not_started' && (
                                  <div className="flex flex-col items-end gap-1">
                                    <button
                                      onClick={() => handleStartModule(module.id)}
                                      disabled={isLoading}
                                      className="px-3 py-1.5 text-xs font-medium bg-ey-yellow text-ey-confident-black rounded-lg hover:bg-ey-yellow-dark transition-colors disabled:opacity-50"
                                    >
                                      {isLoading ? 'Starting...' : 'Start'}
                                    </button>
                                  </div>
                                )}
                                {module.status === 'in_progress' && (
                                  <div className="flex flex-col items-end gap-1">
                                    <button
                                      onClick={() => setShowProofForm(showingProofForm ? null : module.id)}
                                      disabled={isLoading}
                                      className="px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                                      title={`Completing will increase proficiency to Level ${getPredictedProficiency(module.id)}`}
                                    >
                                      {isLoading ? 'Completing...' : 'Complete'}
                                    </button>
                                    {/* Proficiency prediction */}
                                    {getPredictedProficiency(module.id) > proficiencyLevel && (
                                      <span className="text-[10px] text-green-600">
                                        → Level {getPredictedProficiency(module.id)} ({PROFICIENCY_LABELS[getPredictedProficiency(module.id)]})
                                      </span>
                                    )}
                                  </div>
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

                          {/* Proof Submission Form */}
                          {showingProofForm && (
                            <div className="p-4 bg-ey-off-white border-t border-ey-gray-light">
                              <h5 className="text-sm font-semibold text-ey-confident-black mb-3">
                                Complete Module (Optional Proof)
                              </h5>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-ey-gray mb-1">
                                    Description (optional)
                                  </label>
                                  <textarea
                                    value={proofData.proof_description}
                                    onChange={(e) => setProofData({ ...proofData, proof_description: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 text-sm border border-ey-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-ey-yellow"
                                    placeholder="Describe what you learned or accomplished..."
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-ey-gray mb-1">
                                    Proof Link (optional)
                                  </label>
                                  <input
                                    type="url"
                                    value={proofData.proof_link}
                                    onChange={(e) => setProofData({ ...proofData, proof_link: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border border-ey-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-ey-yellow"
                                    placeholder="https://..."
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-ey-gray mb-1">
                                    Upload File (optional)
                                  </label>
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                    className="w-full text-sm text-ey-gray file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-ey-yellow file:text-ey-confident-black hover:file:bg-ey-yellow-dark"
                                  />
                                  {proofFile && (
                                    <p className="mt-1 text-xs text-ey-gray">
                                      Selected: {proofFile.name}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`ai-review-${module.id}`}
                                    checked={proofData.request_ai_review}
                                    onChange={(e) => setProofData({ ...proofData, request_ai_review: e.target.checked })}
                                    className="rounded border-ey-gray-light text-ey-yellow focus:ring-ey-yellow"
                                  />
                                  <label htmlFor={`ai-review-${module.id}`} className="text-xs text-ey-gray">
                                    Request AI feedback on my proof
                                  </label>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleCompleteWithProof(module.id)}
                                    disabled={submittingProof}
                                    className="flex-1 py-2 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                                  >
                                    {submittingProof ? 'Submitting...' : 'Mark Complete'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowProofForm(null);
                                      setProofData({
                                        completion_type: 'self_reported',
                                        proof_description: '',
                                        proof_link: '',
                                        request_ai_review: false
                                      });
                                      setProofFile(null);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-ey-gray border border-ey-gray-light rounded-lg hover:bg-white transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Learning Content Section (Expanded) */}
                          {isExpanded && module.status !== 'completed' && (
                            <div className="p-4 bg-ey-off-white border-t border-ey-gray-light">
                              {!content && (
                                <button
                                  onClick={() => handleGenerateContent(module.id)}
                                  disabled={isGenerating}
                                  className="w-full py-3 text-sm font-medium bg-ey-yellow text-ey-confident-black rounded-lg hover:bg-ey-yellow-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                  {isGenerating ? (
                                    <>
                                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                      </svg>
                                      Generating Learning Content...
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                      </svg>
                                      Generate AI Learning Guide
                                    </>
                                  )}
                                </button>
                              )}

                              {content && (
                                <div className="space-y-4">
                                  {/* Learning Guide */}
                                  {content.learning_guide && (
                                    <div>
                                      <h5 className="text-xs font-semibold text-ey-gray uppercase mb-2">Learning Guide</h5>
                                      <div className="prose prose-sm max-w-none text-ey-confident-black text-sm whitespace-pre-wrap bg-white p-3 rounded-lg border border-ey-gray-light">
                                        {content.learning_guide}
                                      </div>
                                    </div>
                                  )}

                                  {/* EY Resources */}
                                  {content.ey_resources && content.ey_resources.length > 0 && (
                                    <div>
                                      <h5 className="text-xs font-semibold text-purple-600 uppercase mb-2 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                        </svg>
                                        EY Learning Resources
                                      </h5>
                                      <div className="space-y-2">
                                        {content.ey_resources.map((resource, idx) => (
                                          <a
                                            key={idx}
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-white border border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors group"
                                          >
                                            {getResourceIcon('ey_badge')}
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium text-ey-confident-black group-hover:text-purple-700 truncate">
                                                {resource.title}
                                              </p>
                                              <p className="text-xs text-ey-gray">{resource.type}</p>
                                              {resource.badge_available && (
                                                <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 rounded">
                                                  Badge Available
                                                </span>
                                              )}
                                            </div>
                                            <svg className="w-4 h-4 text-ey-gray group-hover:text-purple-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* External Resources */}
                                  {content.external_resources && content.external_resources.length > 0 && (
                                    <div>
                                      <h5 className="text-xs font-semibold text-ey-gray uppercase mb-2">External Resources</h5>
                                      <div className="space-y-2">
                                        {content.external_resources.map((resource, idx) => (
                                          <a
                                            key={idx}
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-white border border-ey-gray-light rounded-lg hover:border-ey-yellow hover:bg-ey-yellow/5 transition-colors group"
                                          >
                                            {getResourceIcon(resource.type)}
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium text-ey-confident-black group-hover:text-ey-yellow truncate">
                                                {resource.title}
                                              </p>
                                              <p className="text-xs text-ey-gray">
                                                {resource.provider} • {resource.estimated_time}
                                              </p>
                                            </div>
                                            <svg className="w-4 h-4 text-ey-gray group-hover:text-ey-yellow transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Practice Exercises with Task Tracking */}
                                  {content.practice_exercises && content.practice_exercises.length > 0 && (
                                    <div>
                                      <h5 className="text-xs font-semibold text-ey-gray uppercase mb-2">
                                        Practice Exercises ({(moduleTasks[module.id] || []).length}/{content.practice_exercises.length} completed)
                                      </h5>
                                      <ul className="space-y-2">
                                        {content.practice_exercises.map((exercise, idx) => {
                                          const isTaskCompleted = (moduleTasks[module.id] || []).includes(idx);
                                          const isToggling = togglingTask === `${module.id}-${idx}`;

                                          return (
                                            <li key={idx}>
                                              <label
                                                className={`flex items-start gap-3 cursor-pointer p-2 rounded-lg transition-colors ${
                                                  isTaskCompleted ? 'bg-green-50' : 'hover:bg-ey-off-white'
                                                }`}
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={isTaskCompleted}
                                                  onChange={() => handleToggleTask(module.id, idx)}
                                                  disabled={isToggling}
                                                  className="mt-1 rounded border-ey-gray-light text-green-500 focus:ring-green-500"
                                                />
                                                <span className={`text-sm ${
                                                  isTaskCompleted
                                                    ? 'text-ey-gray line-through'
                                                    : 'text-ey-confident-black'
                                                }`}>
                                                  {exercise}
                                                </span>
                                                {isToggling && (
                                                  <svg className="w-4 h-4 animate-spin text-ey-gray ml-auto" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                  </svg>
                                                )}
                                              </label>
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Success Criteria */}
                                  {content.success_criteria && content.success_criteria.length > 0 && (
                                    <div>
                                      <h5 className="text-xs font-semibold text-ey-gray uppercase mb-2">Success Criteria</h5>
                                      <ul className="space-y-1">
                                        {content.success_criteria.map((criteria, idx) => (
                                          <li key={idx} className="flex items-start gap-2 text-sm text-ey-confident-black">
                                            <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            {criteria}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
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
                        {getResourceIcon(resource.type)}
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
