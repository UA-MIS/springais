import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme, themeColors } from '../../context/ThemeContext';

export default function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const colors = isDark ? themeColors.dark : themeColors.light;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm font-medium rounded-md transition-colors border"
      style={{
        color: isDark ? colors.textSecondary : '#ffffff',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'transparent',
        backgroundColor: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      Logout
    </button>
  );
}
