import { useTheme, themeColors } from '../../context/ThemeContext';
import { motion } from 'framer-motion';

interface GameProgressBarProps {
  value: number; // 0-100
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'xp' | 'gold' | 'success' | 'warning';
  animated?: boolean;
}

export default function GameProgressBar({
  value,
  label,
  showValue = true,
  size = 'md',
  variant = 'default',
  animated = true,
}: GameProgressBarProps) {
  const { theme, isGame } = useTheme();
  const colors = themeColors[theme];

  const heights = { sm: 'h-2', md: 'h-4', lg: 'h-6' };

  const getBarGradient = () => {
    if (isGame || variant === 'xp') {
      return 'linear-gradient(90deg, #8B5A2B 0%, #FFE600 50%, #8B5A2B 100%)';
    }
    if (variant === 'gold') {
      return 'linear-gradient(90deg, #ffd700 0%, #FFE600 50%, #ffd700 100%)';
    }
    if (variant === 'success') {
      return 'linear-gradient(90deg, #166534 0%, #22c55e 50%, #166534 100%)';
    }
    if (variant === 'warning') {
      return 'linear-gradient(90deg, #b45309 0%, #f59e0b 50%, #b45309 100%)';
    }
    return colors.accent;
  };

  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div>
      {(label || showValue) && (
        <div
          className="flex justify-between text-sm mb-1"
          style={{ color: colors.textMuted }}
        >
          {label && <span>{label}</span>}
          {showValue && <span>{Math.round(clampedValue)}%</span>}
        </div>
      )}
      <div
        className={`rounded-full overflow-hidden ${heights[size]}`}
        style={{
          backgroundColor: isGame ? 'rgba(139, 90, 43, 0.3)' : 'rgba(255, 255, 255, 0.1)',
          border: isGame ? '1px solid rgba(139, 90, 43, 0.5)' : 'none',
        }}
      >
        <motion.div
          className="h-full rounded-full"
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: animated ? 0.5 : 0, ease: 'easeOut' }}
          style={{
            background: getBarGradient(),
            backgroundSize: '200% 100%',
            animation: isGame && animated ? 'shimmer 3s ease-in-out infinite' : 'none',
            boxShadow: isGame ? '0 0 10px rgba(255, 230, 0, 0.3)' : 'none',
          }}
        />
      </div>
    </div>
  );
}
