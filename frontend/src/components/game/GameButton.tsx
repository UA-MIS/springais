import { ReactNode } from 'react';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { motion } from 'framer-motion';

interface GameButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
}

export default function GameButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
  fullWidth = false,
}: GameButtonProps) {
  const { theme, isGame } = useTheme();
  const colors = themeColors[theme];

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const getVariantStyles = () => {
    if (variant === 'primary') {
      return {
        background: isGame
          ? 'linear-gradient(135deg, #FFE600 0%, #8B5A2B 100%)'
          : colors.accent,
        color: '#1a1510',
        border: isGame ? '2px solid #FFE600' : 'none',
        boxShadow: isGame ? '0 0 15px rgba(255, 230, 0, 0.3)' : 'none',
      };
    }
    if (variant === 'secondary') {
      return {
        background: isGame ? 'rgba(139, 90, 43, 0.3)' : 'rgba(255, 255, 255, 0.1)',
        color: colors.textPrimary,
        border: `1px solid ${isGame ? 'rgba(139, 90, 43, 0.5)' : colors.cardBorder}`,
        boxShadow: 'none',
      };
    }
    if (variant === 'danger') {
      return {
        background: 'rgba(220, 38, 38, 0.2)',
        color: '#ef4444',
        border: '1px solid rgba(220, 38, 38, 0.5)',
        boxShadow: 'none',
      };
    }
    // ghost
    return {
      background: 'transparent',
      color: colors.textSecondary,
      border: 'none',
      boxShadow: 'none',
    };
  };

  const styles = getVariantStyles();

  return (
    <motion.button
      type={type}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl font-semibold transition-all ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{
        ...styles,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: isGame ? "'Cinzel', serif" : 'inherit',
      }}
    >
      {children}
    </motion.button>
  );
}
