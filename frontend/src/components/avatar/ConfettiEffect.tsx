import { motion, AnimatePresence } from 'framer-motion';
import { confettiParticleVariants } from './cedricAnimations';

interface ConfettiEffectProps {
  active: boolean;
}

// 8 particles with gold and blue colors
const PARTICLES = [
  { x: -30, y: -50, color: '#FFE600' },
  { x: 30, y: -55, color: '#60C0FF' },
  { x: -20, y: -60, color: '#FFE600' },
  { x: 25, y: -45, color: '#60C0FF' },
  { x: -35, y: -40, color: '#60C0FF' },
  { x: 15, y: -65, color: '#FFE600' },
  { x: -10, y: -55, color: '#FFE600' },
  { x: 35, y: -50, color: '#60C0FF' },
];

/**
 * Confetti burst effect for CelebrateLevelUp animation.
 * 8 particles in gold and blue that burst outward and fade.
 */
export default function ConfettiEffect({ active }: ConfettiEffectProps) {
  return (
    <AnimatePresence>
      {active && (
        <div
          data-testid="confetti-effect"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            pointerEvents: 'none',
            zIndex: 15,
          }}
        >
          {PARTICLES.map((particle, i) => (
            <motion.div
              key={i}
              custom={particle}
              variants={confettiParticleVariants}
              initial="initial"
              animate="animate"
              data-testid="confetti-particle"
              style={{
                position: 'absolute',
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: particle.color,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
