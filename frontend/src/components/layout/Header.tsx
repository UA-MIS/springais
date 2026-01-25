import { NavLink } from 'react-router-dom';
import LogoutButton from '../auth/LogoutButton';
import { useAuth } from '../../context/AuthContext';
import { useTheme, themeColors } from '../../context/ThemeContext';

// Navigation items - Role-centric workflow
const navigation = [
  { name: 'Match Results', href: '/matches' },
  { name: 'My Profile', href: '/profile' },
  { name: 'Saved Roles', href: '/saved' },
  { name: 'Career Roadmap', href: '/roadmap' },
];

// Sun icon for light mode
function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

// Moon icon for dark mode
function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function Header() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const colors = isDark ? themeColors.dark : themeColors.light;

  return (
    <header
      className="sticky top-0 z-50 w-full border-b transition-colors duration-200"
      style={{
        backgroundColor: isDark ? colors.headerBg : colors.headerBg,
        borderColor: colors.border,
        backdropFilter: isDark ? 'blur(12px)' : 'none',
      }}
    >
      {/* Top row: Logo and user actions */}
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold" style={{ color: colors.accent }}>
            SpringAIS
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors duration-200 hover:bg-white/10"
            style={{ color: isDark ? colors.textSecondary : '#ffffff' }}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {user && (
            <span style={{ color: isDark ? colors.textSecondary : '#ffffff' }} className="text-sm">
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
                  : isDark
                    ? colors.textSecondary
                    : 'rgba(255, 255, 255, 0.75)',
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
