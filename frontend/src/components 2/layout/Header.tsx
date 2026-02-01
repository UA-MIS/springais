import { NavLink } from 'react-router-dom';
import LogoutButton from '../auth/LogoutButton';
import { useAuth } from '../../context/AuthContext';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { useAdventureMode, getFantasyText } from '../../context/AdventureModeContext';
import { ThemeSwitcher } from '../game';

// Navigation items - Role-centric workflow
const navigation = [
  { name: 'Match Results', href: '/matches' },
  { name: 'My Profile', href: '/profile' },
  { name: 'Saved Roles', href: '/saved' },
  { name: 'Career Roadmap', href: '/roadmap' },
];

export default function Header() {
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
          {adventureState.enabled && (
            <span
              className="ml-3 text-xs px-2 py-1 rounded-full"
              style={{
                backgroundColor: 'rgba(255, 230, 0, 0.15)',
                color: colors.accent,
                border: '1px solid rgba(255, 230, 0, 0.3)',
              }}
            >
              Adventure Mode
            </span>
          )}
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
              {adventureState.enabled && '🛡️ '}
              {user.name} ({user.role})
            </span>
          )}
          <LogoutButton />
        </div>
      </div>

      {/* Navigation tabs row */}
      <nav className="px-6">
        <div className="flex items-center gap-1">
          {navigation.map((item) => (
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
              {getFantasyText(item.name, adventureState.enabled)}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
