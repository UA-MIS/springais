import { NavLink } from 'react-router-dom';

const navigation = [
  { name: 'Skills Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Match Results', href: '/matches', icon: '🎯' },
  { name: 'Career Path', href: '/career-path', icon: '📈' },
  { name: 'Success Patterns', href: '/success-patterns', icon: '⭐' },
];

type SidebarVariant = 'default' | 'dark';

interface SidebarProps {
  variant?: SidebarVariant;
}

export default function Sidebar({ variant = 'default' }: SidebarProps) {
  return (
    <aside
      className={
        variant === 'dark'
          ? 'w-64 min-h-screen p-4 border-r border-white/10 bg-white/4 backdrop-blur-md'
          : 'w-64 bg-gray-50 min-h-screen p-4'
      }
    >
      <nav className="space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              variant === 'dark'
                ? `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive ? 'font-semibold bg-white/10 border border-white/10' : 'text-white/75 hover:bg-white/8'
                  }`
                : `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive ? 'font-semibold' : 'text-gray-700 hover:bg-gray-200'
                  }`
            }
            style={({ isActive }) =>
              variant === 'dark'
                ? {
                    color: isActive ? '#FFE600' : undefined,
                  }
                : {
                    backgroundColor: isActive ? '#FFE600' : 'transparent',
                    color: isActive ? '#2E2E38' : '#2E2E38',
                  }
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
