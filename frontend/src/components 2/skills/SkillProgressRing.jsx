// SVG circular progress indicator
// Displays skill proficiency as a circular progress ring with green gradient

export default function SkillProgressRing({ 
  percentage = 0, 
  size = 'medium', 
  strokeWidth = 3,
  progressColors 
}) {
  // Calculate SVG dimensions
  const radius = 15; // Inner radius of the circle
  const circumference = 2 * Math.PI * radius; // ~94.2
  const offset = circumference * (1 - percentage / 100);
  
  // Size variants for different use cases
  const sizeClasses = {
    small: 'w-12 h-12',   // 48px
    medium: 'w-16 h-16',  // 64px
    large: 'w-24 h-24',   // 96px
  };
  
  const sizeClass = sizeClasses[size] || sizeClasses.medium;

  // Get gradient colors - always green
  const gradientColors = progressColors?.ring || ['#166534', '#22c55e', '#4ade80'];

  // Generate unique ID for gradient (needed when multiple rings on page)
  const gradientId = `progress-gradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={`relative ${sizeClass}`}>
      <svg 
        viewBox="0 0 36 36" 
        className="w-full h-full transform -rotate-90"
      >
        {/* Define gradient */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientColors[0]} />
            <stop offset="50%" stopColor={gradientColors[1]} />
            <stop offset="100%" stopColor={gradientColors[2]} />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke={progressColors?.bg || '#dcfce7'}
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle with gradient */}
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {/* Percentage text in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span 
          className="text-xs font-semibold"
          style={{ color: progressColors?.text || '#16a34a' }}
        >
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}
