// Add new skill modal
// Form for manually adding skills to profile

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { SKILL_CATEGORIES } from '../../mocks/mockSkills';

export default function AddSkillModal({ onClose, onAdd }) {
  const modalRef = useRef(null);
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Handle Escape key and focus management
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    // Focus first input
    if (modalRef.current) {
      const firstInput = modalRef.current.querySelector('input');
      firstInput?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);
  const onSubmit = (data) => {
    const newSkill = {
      name: data.name,
      category: data.category,
      proficiency: parseInt(data.proficiency) || 0,
      status: 'active',
      progress: {
        current: 0,
        total: 1,
        unit: 'skill',
      },
      notes: data.notes || '',
    };

    onAdd?.(newSkill);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fadeIn"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ey-gray-light">
          <h2 className="text-xl font-bold text-ey-confident-black">
            Add New Skill
          </h2>
          <button
            onClick={onClose}
            className="text-ey-gray hover:text-ey-confident-black transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Skill Name */}
          <div>
            <label className="block text-sm font-medium text-ey-confident-black mb-2">
              Skill Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name', { required: 'Skill name is required' })}
              className="w-full px-4 py-2 border border-ey-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-ey-yellow"
              placeholder="e.g., AWS Solutions Architect"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-ey-confident-black mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="w-full px-4 py-2 border border-ey-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-ey-yellow"
            >
              <option value="">Select a category</option>
              {SKILL_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
            )}
          </div>

          {/* Proficiency Level */}
          <div>
            <label className="block text-sm font-medium text-ey-confident-black mb-2">
              Proficiency Level: <span id="proficiency-value">0</span>%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="0"
              {...register('proficiency')}
              onChange={(e) => {
                document.getElementById('proficiency-value').textContent = e.target.value;
              }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-ey-gray mt-1">
              <span>Beginner</span>
              <span>Intermediate</span>
              <span>Advanced</span>
              <span>Expert</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-ey-confident-black mb-2">
              Notes (Optional)
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-4 py-2 border border-ey-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-ey-yellow"
              placeholder="Add any notes about this skill..."
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-ey-gray-light">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-ey-gray border border-ey-gray-light rounded-lg hover:bg-ey-off-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-semibold bg-ey-yellow text-ey-confident-black rounded-lg hover:bg-ey-yellow-dark transition-colors"
            >
              Add Skill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
