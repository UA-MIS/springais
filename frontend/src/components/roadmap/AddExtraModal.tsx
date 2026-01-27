/**
 * AddExtraModal - Modal for adding extra achievements
 *
 * Fields:
 * - Title
 * - Description (optional)
 * - Category dropdown
 */

import { useState } from 'react';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { useRoadmap } from '../../hooks/useRoadmap';

interface AddExtraModalProps {
  phaseId: string;
  onClose: () => void;
}

const CATEGORIES = [
  { value: 'certification', label: 'Certification', description: 'A certification you earned' },
  { value: 'skill', label: 'Skill', description: 'A skill you developed' },
  { value: 'project', label: 'Project', description: 'A project you completed' },
  { value: 'achievement', label: 'Achievement', description: 'Other achievement or recognition' },
];

export default function AddExtraModal({ phaseId, onClose }: AddExtraModalProps) {
  const { isDark } = useTheme();
  const colors = isDark ? themeColors.dark : themeColors.light;

  const { addExtra } = useRoadmap();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('achievement');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await addExtra(phaseId, title.trim(), description.trim() || null, category);
      onClose();
    } catch (error) {
      console.error('Failed to add extra:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl p-6"
        style={{
          backgroundColor: isDark ? '#1a1a1f' : '#fff',
          border: `1px solid ${colors.cardBorder}`,
        }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: colors.textPrimary }}>
          Add Extra Achievement
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., AWS Solutions Architect Professional"
              className="w-full px-4 py-3 rounded-lg text-sm"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                color: colors.textPrimary,
                border: `1px solid ${colors.cardBorder}`,
              }}
              maxLength={255}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className="p-3 rounded-lg text-left transition-all"
                  style={{
                    backgroundColor:
                      category === cat.value
                        ? isDark
                          ? 'rgba(34, 197, 94, 0.15)'
                          : 'rgba(34, 197, 94, 0.1)'
                        : isDark
                        ? 'rgba(255,255,255,0.03)'
                        : 'rgba(0,0,0,0.02)',
                    border: category === cat.value ? '2px solid #22c55e' : '2px solid transparent',
                  }}
                >
                  <div className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                    {cat.label}
                  </div>
                  <div className="text-xs" style={{ color: colors.textMuted }}>
                    {cat.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional details..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg text-sm resize-none"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                color: colors.textPrimary,
                border: `1px solid ${colors.cardBorder}`,
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                color: colors.textPrimary,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="flex-1 py-3 rounded-lg font-medium transition-all"
              style={{
                backgroundColor: '#22c55e',
                color: 'white',
                opacity: !title.trim() || isSubmitting ? 0.5 : 1,
              }}
            >
              {isSubmitting ? 'Adding...' : 'Add Achievement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
