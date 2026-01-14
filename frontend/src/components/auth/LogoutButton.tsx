import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 rounded-md transition-colors"
    >
      Logout
    </button>
  );
}
