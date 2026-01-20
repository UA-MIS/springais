import { Routes, Route, Navigate } from 'react-router-dom';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import SuccessPatternPage from './components/successPatterns/SuccessPatternPage';
import MatchResultsPage from './components/matches/MatchResultsPage';
import { CareerPathPage } from '@/pages/CareerPathPage';
import { RoleRequirementPage } from '@/pages/RoleRequirementPage';
import SkillsDashboard from './components/skills/SkillsDashboard';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<SkillsDashboard />} />
        <Route path="/matches" element={<MatchResultsPage />} />
        <Route path="/career-path" element={<CareerPathPage />} />
        <Route path="/career-paths/:roleId" element={<RoleRequirementPage />} />
        <Route path="/success-patterns" element={<SuccessPatternPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
