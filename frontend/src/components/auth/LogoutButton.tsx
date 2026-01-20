import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

type LogoutButtonVariant = 'default' | 'dark';

interface LogoutButtonProps {
  variant?: LogoutButtonVariant;
}

export default function LogoutButton({ variant = 'default' }: LogoutButtonProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className={
        variant === 'dark'
          ? 'px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10 rounded-md transition-colors border border-white/10'
          : 'px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 rounded-md transition-colors'
      }
    >
      Logout
    </button>
  );
}
