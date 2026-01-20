import { Outlet } from 'react-router-dom';
import Header from './Header';
import { useTheme, themeColors } from '../../context/ThemeContext';

export default function MainLayout() {
  const { isDark } = useTheme();
  const colors = isDark ? themeColors.dark : themeColors.light;

  return (
    <div className="relative min-h-screen transition-colors duration-200" style={{ backgroundColor: colors.pageBg }}>
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

      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />
        <main
          className="flex-1 p-6 transition-colors duration-200"
          style={{ backgroundColor: isDark ? 'transparent' : colors.pageBg }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
