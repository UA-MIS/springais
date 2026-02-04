import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import HMMainLayout from './components/layout/HMMainLayout';
import HomeRedirect from './components/layout/HomeRedirect';
import { MatchesProvider } from './context/MatchesContext';
import { SavedRolesProvider } from './context/SavedRolesContext';
import { SkillsProvider } from './context/SkillsContext';
import { ToastProvider } from './context/ToastContext';
import { AdventureModeProvider } from './context/AdventureModeContext';
import { HiringManagerProvider } from './context/HiringManagerContext';

// Lazy load heavier page components for faster initial load
const MatchResultsPage = lazy(() => import('./components/matches/MatchResultsPage'));
const RoleDetailPage = lazy(() => import('./pages/RoleDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SavedRolesPage = lazy(() => import('./pages/SavedRolesPage'));
const RoadmapPage = lazy(() => import('./pages/RoadmapPage'));
const SuccessPatternPage = lazy(() => import('./components/successPatterns/SuccessPatternPage'));

// Hiring Manager pages
const HMJobBrowsePage = lazy(() => import('./pages/hm/HMJobBrowsePage'));
const HMMyJobsPage = lazy(() => import('./pages/hm/HMMyJobsPage'));
const HMCandidateInterestPage = lazy(() => import('./pages/hm/HMCandidateInterestPage'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
    </div>
  );
}

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
            <AdventureModeProvider>
              <ToastProvider>
                <MatchesProvider>
                  <SavedRolesProvider>
                    <SkillsProvider>
                      <MainLayout />
                    </SkillsProvider>
                  </SavedRolesProvider>
                </MatchesProvider>
              </ToastProvider>
            </AdventureModeProvider>
          </ProtectedRoute>
        }
      >
        {/* Main navigation pages - wrapped with Suspense for lazy loading */}
        <Route path="/matches" element={<Suspense fallback={<PageLoader />}><MatchResultsPage /></Suspense>} />
        <Route path="/profile" element={<Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>} />
        <Route path="/saved" element={<Suspense fallback={<PageLoader />}><SavedRolesPage /></Suspense>} />
        <Route path="/roadmap" element={<Suspense fallback={<PageLoader />}><RoadmapPage /></Suspense>} />
        <Route path="/success-patterns" element={<Suspense fallback={<PageLoader />}><SuccessPatternPage /></Suspense>} />

        {/* Role detail page - accessed when clicking a match */}
        <Route path="/role/:roleId" element={<Suspense fallback={<PageLoader />}><RoleDetailPage /></Suspense>} />
      </Route>

      {/* Hiring Manager routes - separate layout for HM accounts */}
      <Route
        element={
          <ProtectedRoute>
            <AdventureModeProvider>
              <ToastProvider>
                <HiringManagerProvider>
                  <HMMainLayout />
                </HiringManagerProvider>
              </ToastProvider>
            </AdventureModeProvider>
          </ProtectedRoute>
        }
      >
        <Route path="/hm/browse" element={<Suspense fallback={<PageLoader />}><HMJobBrowsePage /></Suspense>} />
        <Route path="/hm/my-jobs" element={<Suspense fallback={<PageLoader />}><HMMyJobsPage /></Suspense>} />
        <Route path="/hm/interest/:jobPostingId" element={<Suspense fallback={<PageLoader />}><HMCandidateInterestPage /></Suspense>} />
      </Route>

      {/* Default redirect - based on account type */}
      <Route path="/" element={<HomeRedirect />} />
    </Routes>
  );
}

export default App;
