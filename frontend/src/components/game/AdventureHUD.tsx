import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdventureMode, getFantasyText } from '../../context/AdventureModeContext';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import AchievementsPanel from './AchievementsPanel';

export default function AdventureHUD() {
  const { state } = useAdventureMode();
  const { theme } = useTheme();
  const colors = themeColors[theme];
  const [showAchievements, setShowAchievements] = useState(false);

  if (!state.enabled) return null;

  const xpPercent = state.xpToNextLevel > 0
    ? (state.currentXP / (state.currentXP + state.xpToNextLevel)) * 100
    : 0;

  return (
    <>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-[108px] left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-6 py-3 rounded-b-2xl"
        style={{
          background: theme === 'game'
            ? 'linear-gradient(180deg, rgba(42, 37, 32, 0.98) 0%, rgba(26, 21, 16, 0.95) 100%)'
            : theme === 'dark'
            ? 'rgba(15, 15, 20, 0.95)'
            : 'rgba(46, 46, 56, 0.95)',
          border: `1px solid ${theme === 'game' ? 'rgba(139, 90, 43, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
          borderTop: 'none',
          boxShadow: theme === 'game'
            ? '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 230, 0, 0.1)'
            : '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Level Badge */}
        <div className="flex items-center gap-2">
          <motion.div
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #FFE600 0%, #8B5A2B 100%)',
              boxShadow: '0 0 15px rgba(255, 230, 0, 0.4)',
              color: '#1a1510',
              fontFamily: theme === 'game' ? "'Cinzel', serif" : 'inherit',
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title={`Level ${state.level} - ${state.title}`}
          >
            {state.level}
          </motion.div>
          <div className="hidden md:block">
            <div
              className="text-xs uppercase tracking-wider"
              style={{ color: colors.textMuted }}
            >
              Level
            </div>
            <div
              className="text-sm font-semibold"
              style={{
                color: colors.textPrimary,
                fontFamily: theme === 'game' ? "'Cinzel', serif" : 'inherit',
              }}
            >
              {state.title}
            </div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="w-32 md:w-48">
          <div className="flex justify-between text-xs mb-1" style={{ color: colors.textMuted }}>
            <span>XP</span>
            <span>{state.currentXP} / {state.xpToNextLevel}</span>
          </div>
          <div
            className="h-3 rounded-full overflow-hidden"
            style={{
              background: theme === 'game' ? 'rgba(139, 90, 43, 0.3)' : 'rgba(255, 255, 255, 0.1)',
              border: `1px solid ${theme === 'game' ? 'rgba(139, 90, 43, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
            }}
          >
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                background: 'linear-gradient(90deg, #8B5A2B 0%, #FFE600 50%, #8B5A2B 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s ease-in-out infinite',
              }}
            />
          </div>
        </div>

        {/* Gold Display */}
        <div className="flex items-center gap-2">
          <span className="text-xl">🪙</span>
          <div>
            <div
              className="text-xs uppercase tracking-wider hidden md:block"
              style={{ color: colors.textMuted }}
            >
              Gold
            </div>
            <div
              className="text-lg font-bold"
              style={{
                color: '#FFE600',
                textShadow: '0 0 10px rgba(255, 230, 0, 0.3)',
                fontFamily: theme === 'game' ? "'Cinzel', serif" : 'inherit',
              }}
            >
              {state.gold.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Achievements Count - Clickable */}
        <motion.div
          className="flex items-center gap-2 pl-4 border-l cursor-pointer"
          style={{ borderColor: colors.border }}
          onClick={() => setShowAchievements(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="View Achievements"
        >
          <span className="text-xl">🏆</span>
          <div>
            <div
              className="text-xs uppercase tracking-wider hidden md:block"
              style={{ color: colors.textMuted }}
            >
              Achievements
            </div>
            <div
              className="text-lg font-bold"
              style={{ color: colors.textPrimary }}
            >
              {state.unlockedAchievementsCount}
            </div>
          </div>
        </motion.div>

        {/* Login Streak */}
        {state.loginStreak > 1 && (
          <div
            className="hidden lg:flex items-center gap-2 pl-4 border-l"
            style={{ borderColor: colors.border }}
          >
            <span className="text-xl">🔥</span>
            <div>
              <div
                className="text-xs uppercase tracking-wider"
                style={{ color: colors.textMuted }}
              >
                Streak
              </div>
              <div
                className="text-lg font-bold"
                style={{ color: '#ff6b35' }}
              >
                {state.loginStreak}
              </div>
            </div>
          </div>
        )}

        {/* Quick-Access Buttons */}
        <div
          className="flex items-center gap-2 pl-4 border-l"
          style={{ borderColor: colors.border }}
        >
          <Link
            to="/store"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors hover:opacity-80"
            style={{
              background: 'linear-gradient(135deg, #8B5A2B 0%, #A0722B 100%)',
              color: '#FFE600',
              fontFamily: theme === 'game' ? "'Cinzel', serif" : 'inherit',
            }}
          >
            {getFantasyText('Store', true)}
          </Link>
          {state.level >= 3 && (
            <Link
              to="/quests"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors hover:opacity-80"
              style={{
                background: 'linear-gradient(135deg, #2B5A8B 0%, #2B72A0 100%)',
                color: '#60C0FF',
                fontFamily: theme === 'game' ? "'Cinzel', serif" : 'inherit',
              }}
            >
              {getFantasyText('Quests', true)}
            </Link>
          )}
        </div>
      </motion.div>

      {/* Achievements Panel */}
      <AnimatePresence>
        {showAchievements && (
          <AchievementsPanel isOpen={showAchievements} onClose={() => setShowAchievements(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
