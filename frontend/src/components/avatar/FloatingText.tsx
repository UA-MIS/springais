import { motion, AnimatePresence } from 'framer-motion';
import { floatingTextVariants } from './cedricAnimations';

interface FloatingTextProps {
  text: string | null;
  color?: string;
}

/**
 * Animated floating text that drifts upward and fades.
 * Used for "+50 XP" and "+200 Gold" overlays during reactions.
 */
export default function FloatingText({ text, color = '#FFE600' }: FloatingTextProps) {
  return (
    <AnimatePresence>
      {text && (
        <motion.div
          key={text}
          variants={floatingTextVariants}
          initial="initial"
          animate="animate"
          data-testid="floating-text"
          style={{
            position: 'absolute',
            top: -10,
            left: '50%',
            transform: 'translateX(-50%)',
            fontWeight: 700,
            fontSize: 14,
            color,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
            zIndex: 20,
          }}
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
