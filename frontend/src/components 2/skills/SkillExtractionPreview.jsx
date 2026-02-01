// Preview modal for extracted skills
// Shows extracted skills before adding to profile

import { useState } from 'react';
import { SKILL_CATEGORIES } from '../../mocks/mockSkills';

export default function SkillExtractionPreview({ 
  extractedSkills, 
  onConfirm, 
  onCancel 
}) {
  const [selectedSkills, setSelectedSkills] = useState(
    extractedSkills.map(skill => ({ ...skill, selected: true }))
  );
  const [editingSkill, setEditingSkill] = useState(null);

  const toggleSkill = (index) => {
    const updated = [...selectedSkills];
    updated[index].selected = !updated[index].selected;
    setSelectedSkills(updated);
  };

  const updateSkill = (index, field, value) => {
    const updated = [...selectedSkills];
    updated[index][field] = value;
    setSelectedSkills(updated);
  };

  const handleConfirm = () => {
    const skillsToAdd = selectedSkills
      .filter(skill => skill.selected)
      .map(skill => ({
        name: skill.name,
        category: skill.category,
        proficiency: 0,
        status: 'active',
        progress: {
          current: 0,
          total: 1,
          unit: 'skill',
        },
      }));
    
    onConfirm?.(skillsToAdd);
  };

  const selectedCount = selectedSkills.filter(s => s.selected).length;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ey-gray-light">
          <div>
            <h2 className="text-xl font-bold text-ey-confident-black">
              Review Extracted Skills
            </h2>
            <p className="text-sm text-ey-gray mt-1">
              Select the skills you'd like to add to your profile
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-ey-gray hover:text-ey-confident-black transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Skills List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {selectedSkills.map((skill, index) => (
              <div
                key={index}
                className={`border-2 rounded-lg p-4 transition-all ${
                  skill.selected
                    ? 'border-ey-yellow bg-ey-yellow/5'
                    : 'border-ey-gray-light bg-ey-off-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={skill.selected}
                    onChange={() => toggleSkill(index)}
                    className="mt-1 w-4 h-4 text-ey-yellow border-ey-gray-light rounded focus:ring-ey-yellow"
                  />
                  
                  <div className="flex-1">
                    {editingSkill === index ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={skill.name}
                          onChange={(e) => updateSkill(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-ey-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-ey-yellow"
                          autoFocus
                        />
                        <select
                          value={skill.category}
                          onChange={(e) => updateSkill(index, 'category', e.target.value)}
                          className="w-full px-3 py-2 border border-ey-gray-light rounded-lg focus:outline-none focus:ring-2 focus:ring-ey-yellow"
                        >
                          {SKILL_CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingSkill(null)}
                            className="px-3 py-1 text-sm bg-ey-gray-light text-white rounded hover:bg-ey-gray transition-colors"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-ey-confident-black">
                            {skill.name}
                          </h3>
                          <button
                            onClick={() => setEditingSkill(index)}
                            className="text-xs text-ey-gray hover:text-ey-confident-black"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-ey-gray">
                          <span>
                            {SKILL_CATEGORIES.find(c => c.id === skill.category)?.name || skill.category}
                          </span>
                          <span>•</span>
                          <span>Confidence: {Math.round(skill.confidence * 100)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-ey-gray-light bg-ey-off-white">
          <p className="text-sm text-ey-gray">
            {selectedCount} of {selectedSkills.length} skills selected
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 text-sm font-medium text-ey-gray border border-ey-gray-light rounded-lg hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              className="px-6 py-2 text-sm font-semibold bg-ey-yellow text-ey-confident-black rounded-lg hover:bg-ey-yellow-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Selected Skills ({selectedCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
