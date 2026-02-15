import { motion } from 'framer-motion';

interface ModernGuideIconProps {
  onClick: () => void;
  size?: number;
}

/**
 * Modern (non-adventure) variant of Cedric: a 32x32 compass icon
 * with hover pulse and click-to-open behavior.
 */
export default function ModernGuideIcon({ onClick, size = 32 }: ModernGuideIconProps) {
  return (
    <motion.button
      data-testid="modern-guide-icon"
      onClick={onClick}
      title="Click to open guide"
      aria-label="Click to open guide"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        border: '2px solid rgba(100, 100, 120, 0.8)',
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <img
        src="/assets/cedric/modern/compass-icon.png"
        alt="Guide"
        style={{
          width: `${size - 8}px`,
          height: `${size - 8}px`,
        }}
      />
    </motion.button>
  );
}
