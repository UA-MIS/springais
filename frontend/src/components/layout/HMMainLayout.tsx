import { Outlet } from 'react-router-dom';
import HMHeader from './HMHeader';
import { useTheme, themeColors } from '../../context/ThemeContext';

export default function HMMainLayout() {
  const { theme, isDark, isGame } = useTheme();
  const colors = themeColors[theme];

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
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: colors.overlayGradient,
            }}
          />
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
        <HMHeader />

        <main
          className="flex-1 p-6 transition-colors duration-200"
          style={{
            backgroundColor: theme !== 'light' ? 'transparent' : colors.pageBg,
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* Global CSS for animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
