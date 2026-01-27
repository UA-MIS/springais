import { motion, AnimatePresence } from 'framer-motion';
import { useAdventureMode } from '../../context/AdventureModeContext';
import { useTheme, themeColors } from '../../context/ThemeContext';

export default function NotificationToasts() {
  const { state, clearRecentXP, clearRecentGold, clearRecentAchievement, clearLevelUp } = useAdventureMode();
  const { theme } = useTheme();
  const colors = themeColors[theme];

  if (!state.enabled) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {/* XP Gain Toast */}
        {state.recentXPGain && (
          <motion.div
            key="xp-toast"
            initial={{ x: 100, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 100, opacity: 0, scale: 0.8 }}
            className="px-6 py-4 rounded-xl flex items-center gap-3 cursor-pointer pointer-events-auto"
            onClick={clearRecentXP}
            style={{
              background: theme === 'game'
                ? 'linear-gradient(135deg, rgba(139, 90, 43, 0.95) 0%, rgba(60, 50, 40, 0.95) 100%)'
                : 'rgba(30, 30, 30, 0.95)',
              border: `2px solid ${theme === 'game' ? '#FFE600' : '#22c55e'}`,
              boxShadow: '0 0 30px rgba(255, 230, 0, 0.3)',
            }}
          >
            <motion.span
              className="text-3xl"
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              ⚡
            </motion.span>
            <div>
              <div className="text-sm" style={{ color: colors.textMuted }}>Experience Gained!</div>
              <div
                className="text-2xl font-bold"
                style={{
                  color: '#FFE600',
                  fontFamily: theme === 'game' ? "'Cinzel', serif" : 'inherit',
                }}
              >
                +{state.recentXPGain} XP
              </div>
            </div>
          </motion.div>
        )}

        {/* Gold Gain Toast */}
        {state.recentGoldGain && (
          <motion.div
            key="gold-toast"
            initial={{ x: 100, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 100, opacity: 0, scale: 0.8 }}
            className="px-6 py-4 rounded-xl flex items-center gap-3 cursor-pointer pointer-events-auto"
            onClick={clearRecentGold}
            style={{
              background: theme === 'game'
                ? 'linear-gradient(135deg, rgba(139, 90, 43, 0.95) 0%, rgba(60, 50, 40, 0.95) 100%)'
                : 'rgba(30, 30, 30, 0.95)',
              border: '2px solid #FFE600',
              boxShadow: '0 0 30px rgba(255, 230, 0, 0.4)',
            }}
          >
            <motion.span
              className="text-3xl"
              animate={{ y: [0, -5, 0], rotate: [0, 15, -15, 0] }}
              transition={{ duration: 0.6 }}
            >
              🪙
            </motion.span>
            <div>
              <div className="text-sm" style={{ color: colors.textMuted }}>Gold Earned!</div>
              <div
                className="text-2xl font-bold"
                style={{
                  color: '#FFE600',
                  fontFamily: theme === 'game' ? "'Cinzel', serif" : 'inherit',
                }}
              >
                +{state.recentGoldGain} Gold
              </div>
            </div>
          </motion.div>
        )}

        {/* Achievement Toast */}
        {state.recentAchievement && (
          <motion.div
            key="achievement-toast"
            initial={{ x: 100, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 100, opacity: 0, scale: 0.8 }}
            className="px-6 py-5 rounded-xl cursor-pointer pointer-events-auto"
            onClick={clearRecentAchievement}
            style={{
              background: 'linear-gradient(135deg, rgba(26, 21, 16, 0.98) 0%, rgba(60, 50, 40, 0.98) 100%)',
              border: '3px solid #FFE600',
              boxShadow: '0 0 40px rgba(255, 230, 0, 0.5), inset 0 0 20px rgba(255, 230, 0, 0.1)',
            }}
          >
            <div className="flex items-center gap-4">
              <motion.span
                className="text-5xl"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, -10, 10, 0],
                }}
                transition={{
                  duration: 0.5,
                  repeat: 2,
                }}
              >
                {state.recentAchievement.icon}
              </motion.span>
              <div>
                <div
                  className="text-xs uppercase tracking-widest mb-1"
                  style={{ color: '#FFE600' }}
                >
                  Achievement Unlocked!
                </div>
                <div
                  className="text-xl font-bold mb-1"
                  style={{
                    color: '#e8dcc4',
                    fontFamily: "'Cinzel', serif",
                  }}
                >
                  {state.recentAchievement.name}
                </div>
                <div className="text-sm" style={{ color: '#c4b998' }}>
                  {state.recentAchievement.description}
                </div>
                {(state.recentAchievement.xpReward > 0 || state.recentAchievement.goldReward > 0) && (
                  <div className="flex gap-3 mt-2 text-sm">
                    {state.recentAchievement.xpReward > 0 && (
                      <span style={{ color: '#22c55e' }}>+{state.recentAchievement.xpReward} XP</span>
                    )}
                    {state.recentAchievement.goldReward > 0 && (
                      <span style={{ color: '#FFE600' }}>+{state.recentAchievement.goldReward} Gold</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Level Up Toast */}
        {state.levelUpPending && (
          <motion.div
            key="levelup-toast"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="px-8 py-6 rounded-2xl cursor-pointer text-center pointer-events-auto"
            onClick={clearLevelUp}
            style={{
              background: 'linear-gradient(135deg, #1a1510 0%, #2a2520 50%, #1a1510 100%)',
              border: '4px solid #FFE600',
              boxShadow: '0 0 60px rgba(255, 230, 0, 0.6), inset 0 0 30px rgba(255, 230, 0, 0.15)',
            }}
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            >
              <div className="text-6xl mb-2">⬆️</div>
            </motion.div>
            <div
              className="text-sm uppercase tracking-widest mb-2"
              style={{ color: '#FFE600' }}
            >
              Level Up!
            </div>
            <div
              className="text-4xl font-bold"
              style={{
                color: '#e8dcc4',
                fontFamily: "'Cinzel', serif",
                textShadow: '0 0 20px rgba(255, 230, 0, 0.5)',
              }}
            >
              Level {state.newLevel || state.level}
            </div>
            <div className="text-sm mt-2" style={{ color: '#c4b998' }}>
              +{(state.newLevel || state.level) * 25} bonus gold!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
