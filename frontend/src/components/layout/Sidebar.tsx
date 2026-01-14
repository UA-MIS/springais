import { NavLink } from 'react-router-dom';

const navigation = [
  { name: 'Skills Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Match Results', href: '/matches', icon: '🎯' },
  { name: 'Career Path', href: '/career-path', icon: '📈' },
  { name: 'Success Patterns', href: '/success-patterns', icon: '⭐' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-50 min-h-screen p-4">
      <nav className="space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'font-semibold'
                  : 'text-gray-700 hover:bg-gray-200'
              }`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? '#FFE600' : 'transparent',
              color: isActive ? '#2E2E38' : '#2E2E38',
            })}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
