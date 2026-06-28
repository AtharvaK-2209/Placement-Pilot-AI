import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage       from './pages/LandingPage';
import GoalPage          from './pages/GoalPage';
import AnalysisPage      from './pages/AnalysisPage';
import RoadmapPage       from './pages/RoadmapPage';
import DailyMissionPage  from './pages/DailyMissionPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<LandingPage />} />
        <Route path="/goal"          element={<GoalPage />} />
        <Route path="/analysis"      element={<AnalysisPage />} />
        <Route path="/roadmap"       element={<RoadmapPage />} />
        <Route path="/daily-mission" element={<DailyMissionPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
