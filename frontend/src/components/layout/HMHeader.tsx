import { NavLink } from 'react-router-dom';
import LogoutButton from '../auth/LogoutButton';
import { useAuth } from '../../context/AuthContext';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { useAdventureMode } from '../../context/AdventureModeContext';
import { ThemeSwitcher } from '../game';

// HM-specific navigation - only hiring manager features
const hmNavigation = [
  { name: 'Browse Jobs', href: '/hm/browse' },
  { name: 'My Jobs', href: '/hm/my-jobs' },
];

export default function HMHeader() {
  const { user } = useAuth();
  const { theme, isGame } = useTheme();
  const { state: adventureState } = useAdventureMode();
  const colors = themeColors[theme];

  return (
    <header
      className="sticky top-0 z-50 w-full border-b transition-colors duration-200"
      style={{
        backgroundColor: colors.headerBg,
        borderColor: colors.border,
        backdropFilter: theme !== 'light' ? 'blur(12px)' : 'none',
        fontFamily: isGame ? "'Cinzel', serif" : 'inherit',
      }}
    >
      {/* Top row: Logo and user actions */}
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <h1
            className="text-2xl font-bold"
            style={{
              color: colors.accent,
              textShadow: isGame ? '0 0 20px rgba(255, 230, 0, 0.3)' : 'none',
            }}
          >
            {adventureState.enabled ? '⚔️ SpringAIS' : 'SpringAIS'}
          </h1>
          <span
            className="ml-3 text-xs px-2 py-1 rounded-full"
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#93c5fd',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            Hiring Manager
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeSwitcher />

          {user && (
            <span
              style={{
                color: theme !== 'light' ? colors.textSecondary : '#ffffff',
                fontFamily: isGame ? "'Spectral', serif" : 'inherit',
              }}
              className="text-sm hidden sm:inline"
            >
              {user.name}
            </span>
          )}
          <LogoutButton />
        </div>
      </div>

      {/* HM Navigation tabs row */}
      <nav className="px-6">
        <div className="flex items-center gap-1">
          {hmNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                  isActive
                    ? 'border-current'
                    : 'border-transparent hover:border-current/30'
                }`
              }
              style={({ isActive }) => ({
                color: isActive
                  ? colors.accent
                  : theme !== 'light'
                    ? colors.textSecondary
                    : 'rgba(255, 255, 255, 0.75)',
                fontFamily: isGame ? "'Cinzel', serif" : 'inherit',
                textShadow: isActive && isGame ? '0 0 10px rgba(255, 230, 0, 0.4)' : 'none',
              })}
            >
              {item.name}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
