import LogoutButton from '../auth/LogoutButton';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user } = useAuth();

  return (
    <header 
      className="sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between shadow-md"
      style={{ backgroundColor: '#2E2E38' }}
    >
      <div className="flex items-center">
        <h1 className="text-2xl font-bold" style={{ color: '#FFE600' }}>
          SpringAIS
        </h1>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-white text-sm">
            {user.name} ({user.role})
          </span>
        )}
        <LogoutButton />
      </div>
    </header>
  );
}
