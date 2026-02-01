import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // TEMP: bypass auth redirects to allow navigation without login
  const BYPASS_AUTH_FOR_TESTING = true;
  const { token, loading } = useAuth();

  if (BYPASS_AUTH_FOR_TESTING) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl" style={{ color: '#2E2E38' }}>Loading...</div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
