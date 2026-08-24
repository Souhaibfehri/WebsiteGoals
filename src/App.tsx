import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { CharacterSheetPage } from './pages/CharacterSheetPage';
import { LevelUpCelebration } from './components/common/LevelUpCelebration';
import { useAppStore } from './store/useAppStore';

function App() {
  const init = useAppStore((s) => s.init);
  const loading = useAppStore((s) => s.loading);

  useEffect(() => {
    init();
  }, [init]);

  if (loading) {
    return <div className="min-h-svh bg-bg" />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/character" element={<CharacterSheetPage />} />
        </Route>
      </Routes>
      <LevelUpCelebration />
    </BrowserRouter>
  );
}

export default App;
