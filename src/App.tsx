import { useEffect } from 'react';
// HashRouter, not BrowserRouter: the app is served from unpredictable base paths
// (artifact previews, static hosts, subdirectories). Path-based routes silently
// match nothing under a nested base and render a blank page.
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { QuestsPage } from './pages/QuestsPage';
import { CharacterSheetPage } from './pages/CharacterSheetPage';
import { CalendarPage } from './pages/CalendarPage';
import { RewardsPage } from './pages/RewardsPage';
import { LevelUpCelebration } from './components/common/LevelUpCelebration';
import { QuestCompleteToast } from './components/common/QuestCompleteToast';
import { CheckpointToast } from './components/common/CheckpointToast';
import { StreakCelebration, AchievementToast } from './components/common/StreakCelebration';
import { useAppStore } from './store/useAppStore';

function App() {
  const init = useAppStore((s) => s.init);
  const loading = useAppStore((s) => s.loading);

  useEffect(() => {
    init();
  }, [init]);

  if (loading) {
    return (
      <div className="grid min-h-svh place-items-center bg-bg">
        <div className="font-heading text-sm tracking-[0.3em] text-text-secondary uppercase">
          Life OS
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/character" element={<CharacterSheetPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <LevelUpCelebration />
      <QuestCompleteToast />
      <CheckpointToast />
      <StreakCelebration />
      <AchievementToast />
    </HashRouter>
  );
}

export default App;
