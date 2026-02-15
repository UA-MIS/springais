import { NavLink } from 'react-router-dom';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { useAdventureMode, getFantasyText } from '../../context/AdventureModeContext';

const baseNavigation = [
  { name: 'Match Results', href: '/matches', tourId: 'nav-matches' },
  { name: 'Saved Roles', href: '/saved', tourId: undefined },
  { name: 'Career Roadmap', href: '/roadmap', tourId: 'nav-roadmap' },
  { name: 'Success Patterns', href: '/success-patterns', tourId: undefined },
  { name: 'My Profile', href: '/profile', tourId: 'nav-profile' },
];

export default function Sidebar() {
  const { theme, isDark, isGame } = useTheme();
  const colors = themeColors[theme];
  const { state } = useAdventureMode();
  const adventureEnabled = state.enabled;

  // Build navigation list with conditional Store and Quests links
  const navigation = [
    ...baseNavigation,
    ...(adventureEnabled ? [{ name: 'Store', href: '/store', tourId: 'nav-store' as string | undefined }] : []),
    ...(adventureEnabled && state.level >= 3 ? [{ name: 'Quests', href: '/quests', tourId: undefined as string | undefined }] : []),
  ];

  return (
    <aside
      className="w-64 min-h-screen p-4 border-r transition-colors duration-200"
      style={{
        backgroundColor: (isDark || isGame) ? colors.sidebarBg : colors.sidebarBg,
        borderColor: colors.border,
        backdropFilter: (isDark || isGame) ? 'blur(12px)' : 'none',
      }}
    >
      <nav className="space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            data-tour={item.tourId}
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
            <span>{getFantasyText(item.name, adventureEnabled)}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
