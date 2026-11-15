// Rotas do app. O sensor simulado começa ligado quando o site abre (ajuste aprovado nº 4).
import { useEffect, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
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

/** Transição suave entre páginas (só opacidade: transform criaria contêiner para a gaveta fixa do detalhe). Desligada com prefers-reduced-motion. */
function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <motion.div key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}

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
        <PageTransition>
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
        </PageTransition>
      </AppShell>
    </HashRouter>
  );
}
