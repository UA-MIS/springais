import { NavLink } from 'react-router-dom';
import { useTheme, themeColors } from '../../context/ThemeContext';

const hmNavigation = [
  { name: 'Browse Jobs', href: '/hm/browse' },
  { name: 'My Jobs', href: '/hm/my-jobs' },
];

export default function HMSidebar() {
  const { theme, isDark, isGame } = useTheme();
  const colors = themeColors[theme];

  return (
    <aside
      className="w-64 min-h-screen p-4 border-r transition-colors duration-200"
      style={{
        backgroundColor: (isDark || isGame) ? colors.sidebarBg : colors.sidebarBg,
        borderColor: colors.border,
        backdropFilter: (isDark || isGame) ? 'blur(12px)' : 'none',
      }}
    >
      <div className="mb-4 px-4">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: colors.accent }}
        >
          Hiring Manager View
        </span>
      </div>
      <nav className="space-y-1">
        {hmNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                isActive
                  ? isDark
                    ? 'bg-white/10 border border-white/10'
                    : 'border'
                  : isDark
                    ? 'hover:bg-white/8'
                    : 'hover:bg-gray-200'
              }`
            }
            style={({ isActive }) => ({
              color: isActive
                ? colors.accent
                : isDark
                  ? colors.textSecondary
                  : colors.textPrimary,
              backgroundColor: isActive && !(isDark || isGame) ? colors.accent : undefined,
              borderColor: isActive && !(isDark || isGame) ? colors.accent : undefined,
            })}
          >
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
