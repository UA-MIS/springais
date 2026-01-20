import { NavLink } from 'react-router-dom';
import { useTheme, themeColors } from '../../context/ThemeContext';

const navigation = [
  { name: 'Skills Dashboard', href: '/dashboard' },
  { name: 'Match Results', href: '/matches' },
  { name: 'Career Path', href: '/career-path' },
  { name: 'Success Patterns', href: '/success-patterns' },
];

export default function Sidebar() {
  const { isDark } = useTheme();
  const colors = isDark ? themeColors.dark : themeColors.light;

  return (
    <aside
      className="w-64 min-h-screen p-4 border-r transition-colors duration-200"
      style={{
        backgroundColor: isDark ? colors.sidebarBg : colors.sidebarBg,
        borderColor: colors.border,
        backdropFilter: isDark ? 'blur(12px)' : 'none',
      }}
    >
      <nav className="space-y-1">
        {navigation.map((item) => (
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
              backgroundColor: isActive && !isDark ? colors.accent : undefined,
              borderColor: isActive && !isDark ? colors.accent : undefined,
            })}
          >
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
