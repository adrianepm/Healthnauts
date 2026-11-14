import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ClipboardList, HeartPulse, Wind, Activity } from 'lucide-react';
import { DesignArea } from './pages/DesignAreas';
import { Geral } from './pages/Geral';
import { DesignShell, DesignFooter } from './components/DesignShell';
import { DesignDialog } from './components/DesignDialog';
import { EntryDialog } from './components/EntryDialog';
import { PvtSessionModal } from './components/PvtSessionModal';
import { ScenarioPicker } from './components/ScenarioPicker';
import { useStore } from './store/useStore';
import { areas } from './config/presentation';
import type { EntryKind } from './config/entryForms';

function QuickEntry({ close }: { close: () => void }) {
  const [kind, setKind] = useState<EntryKind>();
  if (kind) return <EntryDialog kind={kind} close={close} />;
  const actions = [
    ['checkin','Daily check-in',ClipboardList], ['vitals','Vital signs',HeartPulse],
    ['atmosphere','Cabin air',Wind], ['symptoms','Symptoms',Activity],
  ] as const;
  return <DesignDialog title="Add a record" description="Choose what you want to record." close={close}>
    <div className="form-grid">{actions.map(([id, name, Icon]) =>
      <button className="design-button" key={id} onClick={() => setKind(id)}><Icon size={19} /> {name}</button>)}</div>
    <p className="muted">For sleep or reaction testing, open <Link to="/isolamento" onClick={close}>Isolation & Confinement</Link>.</p>
  </DesignDialog>;
}

function Dashboard() {
  const location = useLocation();
  const { isNewLogModalOpen, setIsNewLogModalOpen, isScenarioModalOpen, setIsScenarioModalOpen } = useStore();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById('main-content')?.focus({ preventScroll:true });
  }, [location.pathname]);
  return <>
    <DesignShell />
    <main className="design-wrap design-main" id="main-content" tabIndex={-1}>
      <Routes>
        <Route path="/" element={<Geral />} />
        {areas.map(area => <Route key={area.id} path={area.path} element={<DesignArea key={area.id} config={area} />} />)}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
    <DesignFooter />
    {isNewLogModalOpen && <QuickEntry close={() => setIsNewLogModalOpen(false)} />}
    {isScenarioModalOpen && <ScenarioPicker close={() => setIsScenarioModalOpen(false)} />}
    <PvtSessionModal />
  </>;
}

export function App() { return <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Dashboard /></BrowserRouter>; }
export default App;
