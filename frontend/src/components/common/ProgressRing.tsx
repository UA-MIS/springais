import { useEffect, useState } from 'react';

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
          stroke="rgba(255, 255, 255, 0.15)"
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
          <span className="text-3xl font-bold text-white">
            {Math.round(animatedPercentage)}
          </span>
          <span className="text-lg font-semibold text-white">%</span>
        </div>
      </div>
    </div>
  );
}
