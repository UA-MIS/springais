import { ReactNode } from 'react';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { motion } from 'framer-motion';

interface GameCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  highlighted?: boolean;
  glow?: boolean;
  hover?: boolean;
}

export default function GameCard({
  children,
  className = '',
  onClick,
  highlighted = false,
  glow = false,
  hover = true,
}: GameCardProps) {
  const { theme, isGame } = useTheme();
  const colors = themeColors[theme];

  return (
    <motion.div
      whileHover={hover && onClick ? { scale: 1.01, y: -2 } : {}}
      whileTap={onClick ? { scale: 0.99 } : {}}
      className={`rounded-2xl p-6 transition-all duration-200 ${className}`}
      onClick={onClick}
      style={{
        backgroundColor: colors.cardBg,
        border: `1px solid ${highlighted ? colors.accent : colors.cardBorder}`,
        boxShadow: glow && isGame
          ? '0 0 20px rgba(255, 230, 0, 0.2), inset 0 1px 0 rgba(255, 230, 0, 0.1)'
          : isGame
          ? '0 4px 20px rgba(0, 0, 0, 0.3)'
          : 'none',
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: isGame ? "'Spectral', serif" : 'inherit',
      }}
    >
      {children}
    </motion.div>
  );
}
