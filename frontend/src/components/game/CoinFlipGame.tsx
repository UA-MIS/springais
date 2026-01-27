import { useState } from 'react';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { useAdventureMode } from '../../context/AdventureModeContext';
import { motion } from 'framer-motion';
import GameButton from './GameButton';

interface CoinFlipGameProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CoinFlipGame({ isOpen, onClose }: CoinFlipGameProps) {
  const { theme, isGame } = useTheme();
  const { state, spendGold, completeMiniGame } = useAdventureMode();
  const colors = themeColors[theme];

  const [bet, setBet] = useState(10);
  const [choice, setChoice] = useState<'heads' | 'tails' | null>(null);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [gameResult, setGameResult] = useState<'won' | 'lost' | null>(null);

  const handleFlip = async () => {
    if (!choice) return;
    if (bet > state.gold) {
      return;
    }
    if (!spendGold(bet)) {
      return;
    }

    setIsFlipping(true);
    setGameResult(null);
    setResult(null);

    // Simulate flip with suspense
    await new Promise(r => setTimeout(r, 1500));

    const flipResult = Math.random() > 0.5 ? 'heads' : 'tails';
    setResult(flipResult);
    setIsFlipping(false);

    const won = flipResult === choice;
    setGameResult(won ? 'won' : 'lost');

    completeMiniGame(won, won ? bet * 2 : 0);
  };

  const resetGame = () => {
    setChoice(null);
    setResult(null);
    setGameResult(null);
  };

  const handleClose = () => {
    resetGame();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-96 max-w-[90vw] rounded-2xl p-6 text-center"
        style={{
          background: isGame
            ? 'linear-gradient(135deg, rgba(42, 37, 32, 0.98) 0%, rgba(26, 21, 16, 0.98) 100%)'
            : 'rgba(30, 30, 30, 0.98)',
          border: `2px solid ${isGame ? 'rgba(139, 90, 43, 0.6)' : 'rgba(255, 255, 255, 0.1)'}`,
          boxShadow: isGame
            ? '0 0 40px rgba(255, 230, 0, 0.2), inset 0 1px 0 rgba(255, 230, 0, 0.1)'
            : '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        <h2
          className="text-2xl font-bold mb-4"
          style={{
            color: colors.accent,
            fontFamily: isGame ? "'Cinzel', serif" : 'inherit',
            textShadow: isGame ? '0 0 15px rgba(255, 230, 0, 0.4)' : 'none',
          }}
        >
          ⚔️ Coin Flip Challenge
        </h2>

        <div className="mb-6" style={{ color: colors.textSecondary }}>
          Your Gold: <span style={{ color: '#FFE600', fontWeight: 'bold' }}>{state.gold}</span>
        </div>

        {/* Coin Display */}
        <motion.div
          className="text-8xl my-8 select-none"
          animate={isFlipping ? {
            rotateY: [0, 180, 360, 540, 720, 900, 1080],
            scale: [1, 1.2, 1, 1.2, 1, 1.2, 1],
          } : {}}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        >
          {result ? (result === 'heads' ? '👑' : '🛡️') : '🪙'}
        </motion.div>

        {!gameResult ? (
          <>
            {/* Bet Amount */}
            <div className="mb-4">
              <label className="text-sm block mb-2" style={{ color: colors.textMuted }}>
                Bet Amount
              </label>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {[10, 25, 50, 100].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setBet(amount)}
                    disabled={amount > state.gold || isFlipping}
                    className="px-4 py-2 rounded-lg transition-all disabled:opacity-40"
                    style={{
                      backgroundColor: bet === amount
                        ? 'rgba(255, 230, 0, 0.2)'
                        : 'rgba(139, 90, 43, 0.2)',
                      border: bet === amount ? '2px solid #FFE600' : '2px solid transparent',
                      color: colors.textPrimary,
                      cursor: amount > state.gold ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Choice */}
            <div className="mb-6">
              <label className="text-sm block mb-2" style={{ color: colors.textMuted }}>
                Your Choice
              </label>
              <div className="flex items-center justify-center gap-4">
                <GameButton
                  variant={choice === 'heads' ? 'primary' : 'secondary'}
                  onClick={() => setChoice('heads')}
                  disabled={isFlipping}
                >
                  👑 Heads
                </GameButton>
                <GameButton
                  variant={choice === 'tails' ? 'primary' : 'secondary'}
                  onClick={() => setChoice('tails')}
                  disabled={isFlipping}
                >
                  🛡️ Tails
                </GameButton>
              </div>
            </div>

            <GameButton
              variant="primary"
              size="lg"
              onClick={handleFlip}
              disabled={!choice || isFlipping || bet > state.gold}
              fullWidth
            >
              {isFlipping ? '✨ Flipping...' : `⚔️ Flip for ${bet} Gold`}
            </GameButton>

            <button
              onClick={handleClose}
              className="mt-4 text-sm"
              style={{ color: colors.textMuted }}
            >
              Close
            </button>
          </>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-3xl font-bold mb-4"
              style={{
                color: gameResult === 'won' ? '#22c55e' : '#dc2626',
                fontFamily: isGame ? "'Cinzel', serif" : 'inherit',
              }}
            >
              {gameResult === 'won' ? '🎉 Victory!' : '💀 Defeat!'}
            </motion.div>
            <div className="mb-6" style={{ color: colors.textSecondary }}>
              {gameResult === 'won'
                ? <span>You won <span style={{ color: '#FFE600', fontWeight: 'bold' }}>{bet * 2}</span> gold!</span>
                : <span>You lost <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{bet}</span> gold.</span>}
            </div>
            <div className="flex gap-4 justify-center">
              <GameButton variant="secondary" onClick={resetGame}>
                Play Again
              </GameButton>
              <GameButton variant="ghost" onClick={handleClose}>
                Close
              </GameButton>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
