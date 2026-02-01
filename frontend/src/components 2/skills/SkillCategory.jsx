// Category section component
// Displays a group of skills within a category with header and progress meter

import { useState } from 'react';
import SkillCard from './SkillCard';
import api from '../../services/api';

export default function SkillCategory({
  category,
  skills,
  onSkillClick,
  onMarkComplete,
  theme,
  progressColors,
  onCategoryUpdated,
  onCategoryDeleted,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [editEmoji, setEditEmoji] = useState(category.emoji || 'star');
  const [showModules, setShowModules] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    setIsLoading(true);
    try {
      await api.put(`/skills/groupings/categories/${category.id}`, {
        name: editName,
        emoji: editEmoji,
      });
      setIsEditing(false);
      onCategoryUpdated?.();
    } catch (err) {
      console.error('Failed to update category:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${category.name}" category? This cannot be undone.`)) return;
    setIsLoading(true);
    try {
      await api.delete(`/skills/groupings/categories/${category.id}`);
      onCategoryDeleted?.();
    } catch (err) {
      console.error('Failed to delete category:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddModule = async () => {
    const name = prompt('Enter module name:');
    if (!name?.trim()) return;
    setIsLoading(true);
    try {
      await api.post(`/skills/groupings/categories/${category.id}/modules`, {
        name: name.trim(),
        description: '',
      });
      onCategoryUpdated?.();
    } catch (err) {
      console.error('Failed to add module:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Delete this module?')) return;
    setIsLoading(true);
    try {
      await api.delete(`/skills/groupings/categories/${category.id}/modules/${moduleId}`);
      onCategoryUpdated?.();
    } catch (err) {
      console.error('Failed to delete module:', err);
    } finally {
      setIsLoading(false);
    }
  };
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
          {isEditing ? (
            <>
              <input
                type="text"
                value={editEmoji}
                onChange={(e) => setEditEmoji(e.target.value)}
                className="w-12 text-xl p-2 rounded-lg text-center"
                style={{ backgroundColor: theme?.cardBg || '#ffffff' }}
                maxLength={2}
              />
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="px-2 py-1 rounded text-base font-semibold"
                style={{
                  backgroundColor: theme?.cardBg || '#ffffff',
                  color: theme?.categoryText || '#1e293b',
                }}
                autoFocus
              />
            </>
          ) : (
            <>
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
                  {category.modules?.length > 0 && ` | ${category.modules.length} modules`}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Actions and Progress */}
        <div className="flex items-center gap-3">
          {/* Edit/Save/Cancel buttons */}
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={isLoading}
                className="px-3 py-1 text-xs rounded font-medium active:scale-95"
                style={{ backgroundColor: '#22c55e', color: '#fff' }}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditName(category.name);
                  setEditEmoji(category.emoji || 'star');
                }}
                className="px-3 py-1 text-xs rounded font-medium active:scale-95"
                style={{ backgroundColor: theme?.cardBg || '#e5e7eb', color: theme?.categoryText || '#374151' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={() => setShowModules(!showModules)}
                className="p-1.5 rounded hover:bg-black/5 transition-colors"
                title="Manage modules"
                style={{ color: theme?.headerSubtext || '#64748b' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded hover:bg-black/5 transition-colors"
                title="Edit category"
                style={{ color: theme?.headerSubtext || '#64748b' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="p-1.5 rounded hover:bg-red-50 transition-colors"
                title="Delete category"
                style={{ color: '#dc2626' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}

          {/* Category Progress Meter - GREEN */}
          <div
            className="relative w-40 h-3 rounded-full overflow-hidden"
            style={{ backgroundColor: progressColors?.bg || '#dcfce7' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${categoryProgress}%`,
                backgroundColor: progressColors?.meter || '#22c55e',
              }}
            />
          </div>

          <span
            className="text-sm font-bold min-w-[3rem] text-right"
            style={{ color: progressColors?.text || '#16a34a' }}
          >
            {categoryProgress}%
          </span>
        </div>
      </div>

      {/* Modules Panel (collapsible) */}
      {showModules && category.modules && (
        <div
          className="mb-3 p-3 rounded-lg"
          style={{ backgroundColor: theme?.cardBg || '#ffffff', border: `1px solid ${theme?.border || '#e5e7eb'}` }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: theme?.categoryText || '#374151' }}>
              Learning Modules
            </span>
            <button
              onClick={handleAddModule}
              disabled={isLoading}
              className="text-xs px-2 py-1 rounded font-medium active:scale-95"
              style={{ backgroundColor: '#22c55e', color: '#fff' }}
            >
              + Add Module
            </button>
          </div>
          <div className="space-y-1">
            {category.modules.map((mod, idx) => (
              <div
                key={mod.id}
                className="flex items-center justify-between p-2 rounded"
                style={{ backgroundColor: theme?.categoryBg || '#f3f4f6' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono" style={{ color: theme?.headerSubtext || '#6b7280' }}>
                    {idx + 1}.
                  </span>
                  <span className="text-sm" style={{ color: theme?.categoryText || '#374151' }}>
                    {mod.name}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteModule(mod.id)}
                  disabled={isLoading}
                  className="p-1 rounded hover:bg-red-50 transition-colors"
                  title="Delete module"
                  style={{ color: '#dc2626' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {category.modules.length === 0 && (
              <p className="text-xs italic py-2" style={{ color: theme?.headerSubtext || '#6b7280' }}>
                No modules yet. Add one to track your progress.
              </p>
            )}
          </div>
        </div>
      )}

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
