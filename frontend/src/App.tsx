import { Routes, Route, Navigate } from 'react-router-dom';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import SuccessPatternPage from './components/successPatterns/SuccessPatternPage';
import MatchResultsPage from './components/matches/MatchResultsPage';
import RoleDetailPage from './pages/RoleDetailPage';
import ProfilePage from './pages/ProfilePage';
import SavedRolesPage from './pages/SavedRolesPage';
import { MatchesProvider } from './context/MatchesContext';

function App() {
  return (
    <MatchesProvider>
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Main navigation pages */}
        <Route path="/matches" element={<MatchResultsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/saved" element={<SavedRolesPage />} />
        <Route path="/success-patterns" element={<SuccessPatternPage />} />

        {/* Role detail page - accessed when clicking a match */}
        <Route path="/role/:roleId" element={<RoleDetailPage />} />
      </Route>

      {/* Default redirect - Match Results is the starting point */}
      <Route path="/" element={<Navigate to="/matches" replace />} />
    </Routes>
    </MatchesProvider>
  );
}

export default App;
