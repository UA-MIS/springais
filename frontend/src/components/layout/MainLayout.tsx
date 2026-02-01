import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { useAdventureMode } from '../../context/AdventureModeContext';
import { AdventureHUD, NotificationToasts } from '../game';

export default function MainLayout() {
  const { theme, isDark, isGame } = useTheme();
  const { state: adventureState, trackPageVisit } = useAdventureMode();
  const location = useLocation();
  const colors = themeColors[theme];

  // Track page visits for achievements
  useEffect(() => {
    if (adventureState.enabled) {
      trackPageVisit(location.pathname);
    }
  }, [location.pathname, adventureState.enabled, trackPageVisit]);

  return (
    <div
      className="relative min-h-screen transition-colors duration-200"
      style={{
        backgroundColor: colors.pageBg,
        fontFamily: isGame ? "'Spectral', serif" : 'inherit',
      }}
    >
      {/* Dark mode gradient overlay */}
      {isDark && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-zinc-950" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: colors.overlayGradient }}
          />
          <div className="pointer-events-none absolute inset-0 backdrop-blur-[1px]" />
        </>
      )}

      {/* Game mode special effects */}
      {isGame && (
        <>
          {/* Medieval background effects */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: colors.overlayGradient,
            }}
          />
          {/* Subtle star/particle effect for game theme */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(1px 1px at 10% 20%, rgba(255, 230, 150, 0.2) 0%, transparent 100%),
                radial-gradient(1px 1px at 30% 60%, rgba(255, 230, 150, 0.15) 0%, transparent 100%),
                radial-gradient(1px 1px at 50% 10%, rgba(255, 230, 150, 0.2) 0%, transparent 100%),
                radial-gradient(1px 1px at 70% 40%, rgba(255, 230, 150, 0.1) 0%, transparent 100%),
                radial-gradient(1px 1px at 90% 80%, rgba(255, 230, 150, 0.15) 0%, transparent 100%)
              `,
              backgroundSize: '200px 200px',
              animation: 'twinkle 8s ease-in-out infinite alternate',
            }}
          />
        </>
      )}

      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />

        {/* Adventure Mode HUD */}
        {adventureState.enabled && <AdventureHUD />}

        <main
          className="flex-1 p-6 transition-colors duration-200"
          style={{
            backgroundColor: theme !== 'light' ? 'transparent' : colors.pageBg,
            paddingTop: adventureState.enabled ? '70px' : undefined,
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* Notification Toasts */}
      <NotificationToasts />

      {/* Global CSS for animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @keyframes shimmer {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 100% 0%; }
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 15px rgba(255, 230, 0, 0.3); }
          50% { box-shadow: 0 0 30px rgba(255, 230, 0, 0.5); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        /* Scrollbar styling for game mode */
        .game ::-webkit-scrollbar {
          width: 8px;
        }

        .game ::-webkit-scrollbar-track {
          background: rgba(26, 21, 16, 0.5);
        }

        .game ::-webkit-scrollbar-thumb {
          background: rgba(139, 90, 43, 0.5);
          border-radius: 4px;
        }

        .game ::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 90, 43, 0.7);
        }
      `}</style>
    </div>
  );
}
