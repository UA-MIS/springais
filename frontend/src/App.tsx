import { Routes, Route, Navigate } from 'react-router-dom';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import SuccessPatternPage from './components/successPatterns/SuccessPatternPage';

// Placeholder components for other routes (to be implemented in later blocks)
function SkillsDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Skills Dashboard</h1>
      <p className="text-gray-600">Skills dashboard content will be implemented in Block I</p>
    </div>
  );
}

function MatchResults() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Match Results</h1>
      <p className="text-gray-600">Match results content will be implemented in Block J</p>
    </div>
  );
}

function CareerVisualization() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Career Path</h1>
      <p className="text-gray-600">Career visualization content will be implemented in Block K</p>
    </div>
  );
}

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
        <Route path="/matches" element={<MatchResults />} />
        <Route path="/career-path" element={<CareerVisualization />} />
        <Route path="/success-patterns" element={<SuccessPatternPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
