import { useAdventureMode } from '../../context/AdventureModeContext';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import GameButton from './GameButton';

interface AchievementsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AchievementsPanel({ isOpen, onClose }: AchievementsPanelProps) {
  const { state, getAchievements, isAchievementUnlocked } = useAdventureMode();
  const { theme, isGame } = useTheme();
  const colors = themeColors[theme];
  const achievements = getAchievements();

  if (!isOpen) return null;

  const unlockedCount = state.unlockedAchievements.length;
  const totalCount = achievements.length;
  const progressPercent = (unlockedCount / totalCount) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: isGame
            ? 'linear-gradient(135deg, rgba(42, 37, 32, 0.98) 0%, rgba(26, 21, 16, 0.98) 100%)'
            : 'rgba(30, 30, 30, 0.98)',
          border: `2px solid ${isGame ? 'rgba(139, 90, 43, 0.6)' : 'rgba(255, 255, 255, 0.1)'}`,
          boxShadow: isGame
            ? '0 0 40px rgba(255, 230, 0, 0.2)'
            : '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: colors.border }}>
          <h2
            className="text-2xl font-bold mb-2"
            style={{
              color: colors.accent,
              fontFamily: isGame ? "'Cinzel', serif" : 'inherit',
              textShadow: isGame ? '0 0 15px rgba(255, 230, 0, 0.4)' : 'none',
            }}
          >
            🏆 Achievements
          </h2>
          <div className="flex items-center gap-4">
            <div
              className="flex-1 h-3 rounded-full overflow-hidden"
              style={{
                background: isGame ? 'rgba(139, 90, 43, 0.3)' : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
                style={{
                  background: 'linear-gradient(90deg, #8B5A2B 0%, #FFE600 50%, #8B5A2B 100%)',
                }}
              />
            </div>
            <span style={{ color: colors.textSecondary }}>
              {unlockedCount} / {totalCount}
            </span>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => {
              const unlocked = isAchievementUnlocked(achievement.id);
              return (
                <motion.div
                  key={achievement.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 rounded-xl transition-all"
                  style={{
                    background: unlocked
                      ? isGame
                        ? 'rgba(255, 230, 0, 0.1)'
                        : 'rgba(34, 197, 94, 0.1)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${unlocked
                      ? isGame
                        ? 'rgba(255, 230, 0, 0.3)'
                        : 'rgba(34, 197, 94, 0.3)'
                      : 'rgba(255, 255, 255, 0.1)'}`,
                    opacity: unlocked ? 1 : 0.6,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="text-3xl"
                      style={{
                        filter: unlocked ? 'none' : 'grayscale(1)',
                      }}
                    >
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <div
                        className="font-semibold mb-1"
                        style={{
                          color: unlocked ? colors.textPrimary : colors.textMuted,
                          fontFamily: isGame ? "'Cinzel', serif" : 'inherit',
                        }}
                      >
                        {achievement.name}
                        {unlocked && (
                          <span className="ml-2 text-sm" style={{ color: '#22c55e' }}>✓</span>
                        )}
                      </div>
                      <div
                        className="text-sm mb-2"
                        style={{ color: colors.textMuted }}
                      >
                        {achievement.description}
                      </div>
                      <div className="flex gap-3 text-xs">
                        {achievement.xpReward > 0 && (
                          <span style={{ color: unlocked ? '#22c55e' : colors.textMuted }}>
                            +{achievement.xpReward} XP
                          </span>
                        )}
                        {achievement.goldReward > 0 && (
                          <span style={{ color: unlocked ? '#FFE600' : colors.textMuted }}>
                            +{achievement.goldReward} Gold
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end" style={{ borderColor: colors.border }}>
          <GameButton variant="secondary" onClick={onClose}>
            Close
          </GameButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
