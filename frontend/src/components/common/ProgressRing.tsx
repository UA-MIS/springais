import { useEffect, useState } from 'react';
import { useTheme, themeColors } from '../../context/ThemeContext';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function ProgressRing({
  percentage,
  size = 120,
  strokeWidth = 10,
  className = ''
}: ProgressRingProps) {
  const { isDark } = useTheme();
  const colors = isDark ? themeColors.dark : themeColors.light;
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercentage / 100) * circumference;

  useEffect(() => {
    // Animate from 0 to actual percentage
    const duration = 1000; // 1 second
    const steps = 60;
    const increment = percentage / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(percentage, increment * step);
      setAnimatedPercentage(current);

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedPercentage(percentage);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [percentage]);

  const bgStroke = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgStroke}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#FFE600"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-300 ease-out"
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
            {Math.round(animatedPercentage)}
          </span>
          <span className="text-lg font-semibold" style={{ color: colors.textPrimary }}>%</span>
        </div>
      </div>
    </div>
  );
}
