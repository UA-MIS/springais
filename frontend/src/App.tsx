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
import RoadmapPage from './pages/RoadmapPage';
import { MatchesProvider } from './context/MatchesContext';
import { SavedRolesProvider } from './context/SavedRolesContext';
import { SkillsProvider } from './context/SkillsContext';
import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected routes - wrapped with providers that require auth */}
      <Route
        element={
          <ProtectedRoute>
            <ToastProvider>
              <MatchesProvider>
                <SavedRolesProvider>
                  <SkillsProvider>
                    <MainLayout />
                  </SkillsProvider>
                </SavedRolesProvider>
              </MatchesProvider>
            </ToastProvider>
          </ProtectedRoute>
        }
      >
        {/* Main navigation pages */}
        <Route path="/matches" element={<MatchResultsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/saved" element={<SavedRolesPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/success-patterns" element={<SuccessPatternPage />} />

        {/* Role detail page - accessed when clicking a match */}
        <Route path="/role/:roleId" element={<RoleDetailPage />} />
      </Route>

      {/* Default redirect - Match Results is the starting point */}
      <Route path="/" element={<Navigate to="/matches" replace />} />
    </Routes>
  );
}

export default App;
