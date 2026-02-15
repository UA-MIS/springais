/**
 * QuestCompleteBanner -- Parchment-styled reward card (Story 2.7).
 *
 * Slides in from the top when "The Squire's Trial" is completed.
 * Shows reward summary and a dismiss button.
 *
 * Architecture Section 8: Scene 10 -- "The Squire's Triumph".
 */

import { motion, AnimatePresence } from 'framer-motion';

export interface QuestCompleteBannerProps {
  isVisible: boolean;
  questName: string;
  xpReward: number;
  goldReward: number;
  cosmeticReward?: string;
  onDismiss: () => void;
}

export default function QuestCompleteBanner({
  isVisible,
  questName,
  xpReward,
  goldReward,
  cosmeticReward,
  onDismiss,
}: QuestCompleteBannerProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          data-testid="quest-complete-banner"
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 14 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[360px]"
        >
          <div className="bg-amber-50 border-2 border-amber-600 rounded-lg shadow-xl p-5 text-center">
            {/* Quest title */}
            <div className="text-xs uppercase tracking-widest text-amber-700 mb-1">
              Quest Complete
            </div>
            <h2 className="text-lg font-bold text-amber-900 mb-3">
              {questName}
            </h2>

            {/* Reward summary */}
            <div className="flex justify-center gap-6 mb-4">
              {xpReward > 0 && (
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-700">+{xpReward}</div>
                  <div className="text-xs text-gray-600">XP</div>
                </div>
              )}
              {goldReward > 0 && (
                <div className="text-center">
                  <div className="text-xl font-bold text-amber-600">+{goldReward}</div>
                  <div className="text-xs text-gray-600">Gold</div>
                </div>
              )}
            </div>

            {/* Cosmetic reward */}
            {cosmeticReward && (
              <div className="text-sm text-amber-800 mb-3">
                Earned: <span className="font-semibold">{cosmeticReward}</span>
              </div>
            )}

            {/* Dismiss */}
            <button
              onClick={onDismiss}
              className="px-4 py-1.5 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors text-sm font-medium"
              data-testid="quest-complete-dismiss"
            >
              Continue
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
