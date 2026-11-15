// Rotas do app. O sensor simulado começa ligado quando o site abre (ajuste aprovado nº 4).
import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './store/useStore';
import { sim } from './sim/liveSensors';
import { AppShell } from './components/AppShell';
import Overview from './pages/Overview';
import Isolation from './pages/Isolation';
import Environment from './pages/Environment';
import GroundControl from './pages/GroundControl';
import Radiation from './pages/Radiation';
import Gravity from './pages/Gravity';
import Distance from './pages/Distance';
import Profile from './pages/Profile';

const POLL_MS = 15000; // prazos de confirmação e status do relatório andam com o relógio

export default function App() {
  const { init, refresh, ready, error } = useStore();
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined; let cancelled = false;
    init().then(() => {
      if (cancelled) return;
      sim.start(() => { refresh().catch(() => undefined); });
      timer = setInterval(() => refresh().catch(() => undefined), POLL_MS);
    });
    return () => { cancelled = true; clearInterval(timer); sim.stop(); };
  }, []);

  if (error) return <div className="p-8 text-red-300">{error}</div>;
  if (!ready) return <div className="min-h-screen grid place-items-center text-slate-400 text-sm">Starting the onboard data service…</div>;
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/isolation" element={<Isolation />} />
          <Route path="/environment" element={<Environment />} />
          <Route path="/ground" element={<GroundControl />} />
          <Route path="/radiation" element={<Radiation />} />
          <Route path="/gravity" element={<Gravity />} />
          <Route path="/distance" element={<Distance />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
