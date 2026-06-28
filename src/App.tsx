import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider }    from './contexts/AuthContext';
import ProtectedRoute      from './components/ProtectedRoute';
import LandingPage         from './pages/LandingPage';
import LoginPage           from './pages/LoginPage';
import GoalPage            from './pages/GoalPage';
import AnalysisPage        from './pages/AnalysisPage';
import RoadmapPage         from './pages/RoadmapPage';
import DailyMissionPage    from './pages/DailyMissionPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/"      element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes — require authentication */}
          <Route path="/goal"          element={<ProtectedRoute><GoalPage /></ProtectedRoute>} />
          <Route path="/analysis"      element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
          <Route path="/roadmap"       element={<ProtectedRoute><RoadmapPage /></ProtectedRoute>} />
          <Route path="/daily-mission" element={<ProtectedRoute><DailyMissionPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
