// Individual skill card component
// Displays skill with progress ring, name, metadata, and status badge

import { useState } from 'react';
import SkillProgressRing from './SkillProgressRing';

export default function SkillCard({ skill, onClick, onMarkComplete, theme, progressColors }) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMarkComplete = (e) => {
    e.stopPropagation();
    if (onMarkComplete && skill.status !== 'completed') {
      onMarkComplete(skill.id, skill.name);
    }
  };

  // Format progress metadata
  const getProgressText = () => {
    if (skill.status === 'completed') {
      return skill.completedDate 
        ? `Certified ${new Date(skill.completedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
        : 'Complete';
    }
    if (skill.progress) {
      return `${skill.progress.current} of ${skill.progress.total} ${skill.progress.unit}`;
    }
    return 'In Progress';
  };

  // Get badge styling based on status and theme
  const getBadgeStyles = () => {
    const badges = theme?.badges || {
      active: { bg: '#fef3c7', text: '#92400e' },
      complete: { bg: '#d1fae5', text: '#065f46' },
      recommended: { bg: '#dbeafe', text: '#1e40af' },
    };
    
    switch (skill.status) {
      case 'completed':
        return { backgroundColor: badges.complete.bg, color: badges.complete.text };
      case 'active':
        return { backgroundColor: badges.active.bg, color: badges.active.text };
      case 'recommended':
        return { backgroundColor: badges.recommended.bg, color: badges.recommended.text };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  // Get badge text
  const getBadgeText = () => {
    switch (skill.status) {
      case 'completed':
        return 'Complete';
      case 'active':
        return skill.proficiency < 30 ? 'Starting' : 
               skill.proficiency >= 85 ? 'Near Done' : 'Active';
      case 'recommended':
        return 'Recommended';
      default:
        return 'Active';
    }
  };

  const badgeStyles = getBadgeStyles();

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="rounded-xl p-4 transition-all duration-300 cursor-pointer"
      style={{
        backgroundColor: theme?.cardBg || '#ffffff',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: isHovered ? (theme?.cardHoverBorder || '#94a3b8') : (theme?.cardBorder || '#e2e8f0'),
        boxShadow: isHovered ? (theme?.cardShadow || '0 4px 12px rgba(0, 0, 0, 0.08)') : 'none',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <div className="flex items-start gap-4">
        {/* Progress Ring - GREEN GRADIENT */}
        <div className="flex-shrink-0">
          <SkillProgressRing
            percentage={skill.progress?.percentage ?? skill.proficiency}
            size="small"
            progressColors={progressColors}
          />
        </div>

        {/* Skill Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3
              className="text-sm font-semibold truncate"
              style={{ color: theme?.categoryText || '#1e293b' }}
            >
              {skill.name}
            </h3>
            <span
              className="px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap"
              style={badgeStyles}
            >
              {getBadgeText()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p
              className="text-xs"
              style={{ color: theme?.headerSubtext || '#64748b' }}
            >
              {getProgressText()}
            </p>
            {/* Mark Complete button - show on hover for non-completed skills */}
            {isHovered && skill.status !== 'completed' && onMarkComplete && (
              <button
                onClick={handleMarkComplete}
                className="text-xs px-2 py-0.5 rounded font-medium transition-colors"
                style={{
                  backgroundColor: '#22c55e',
                  color: '#ffffff',
                }}
              >
                Mark Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
