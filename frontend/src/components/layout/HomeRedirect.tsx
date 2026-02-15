import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Smart redirect component that sends users to the appropriate home page
 * based on their account type.
 */
export default function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  // Not logged in: send to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on account type
  if (user.account_type === 'hiring_manager') {
    return <Navigate to="/hm/my-jobs" replace />;
  }

  // Default to matches for personal accounts
  return <Navigate to="/matches" replace />;
}
