import LogoutButton from '../auth/LogoutButton';
import { useAuth } from '../../context/AuthContext';

type HeaderVariant = 'default' | 'dark';

interface HeaderProps {
  variant?: HeaderVariant;
}

export default function Header({ variant = 'default' }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header
      className={
        variant === 'dark'
          ? 'sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between border-b border-white/10 bg-white/6 shadow-md backdrop-blur-md'
          : 'sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between shadow-md'
      }
      style={variant === 'dark' ? undefined : { backgroundColor: '#2E2E38' }}
    >
      <div className="flex items-center">
        <h1 className="text-2xl font-bold" style={{ color: '#FFE600' }}>
          SpringAIS
        </h1>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <span className={variant === 'dark' ? 'text-white/80 text-sm' : 'text-white text-sm'}>
            {user.name} ({user.role})
          </span>
        )}
        <LogoutButton variant={variant} />
      </div>
    </header>
  );
}
