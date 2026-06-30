import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { AuthProvider }    from './contexts/AuthContext';
import { ToastProvider }   from './components/ToastProvider';
import { ErrorBoundary }   from './components/ErrorBoundary';
import ProtectedRoute      from './components/ProtectedRoute';
import { initializePipelineDownstreamHandlers } from './services/pipelineDownstreamHandlers';
import { useMilestoneUnlocks } from './hooks/useMilestoneUnlocks';
import LandingPage         from './pages/LandingPage';
import LoginPage           from './pages/LoginPage';
import DashboardPage       from './pages/DashboardPage';
import GoalPage            from './pages/GoalPage';
import AnalysisPage        from './pages/AnalysisPage';
import RoadmapPage         from './pages/RoadmapPage';
import DailyMissionPage    from './pages/DailyMissionPage';
import FutureYouPage       from './pages/FutureYouPage';
import NotFoundPage        from './pages/NotFoundPage';
import { GamificationDashboard } from './components/gamification';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/"      element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes — require authentication */}
        <Route path="/dashboard"      element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/goal"           element={<ProtectedRoute><GoalPage /></ProtectedRoute>} />
        <Route path="/analysis"       element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
        <Route path="/roadmap"        element={<ProtectedRoute><RoadmapPage /></ProtectedRoute>} />
        <Route path="/daily-mission"  element={<ProtectedRoute><DailyMissionPage /></ProtectedRoute>} />
        <Route path="/future-you"     element={<ProtectedRoute><FutureYouPage /></ProtectedRoute>} />
        <Route path="/gamification"   element={<ProtectedRoute><GamificationDashboard /></ProtectedRoute>} />
        
        {/* 404 - Keep this last */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  // Initialize execution pipeline downstream handlers once on app startup
  useEffect(() => {
    initializePipelineDownstreamHandlers();
  }, []);

  // Initialize milestone unlock handlers
  useMilestoneUnlocks();

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
