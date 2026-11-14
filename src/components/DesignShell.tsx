import { Activity, ArrowUpRight, FlaskConical, Home, Plus } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { areas, crewName } from '../config/presentation';
import { useStore } from '../store/useStore';

export function DesignShell() {
  const { astronautId, setAstronautId, dataset, setDataset, setIsScenarioModalOpen, setIsNewLogModalOpen } = useStore();
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="design-header">
      <div className="design-wrap header-row">
        <NavLink className="design-brand" to="/" aria-label="AstroVida overview">
          <span className="brand-symbol"><Activity size={23} /></span>
          <span><strong>AstroVida</strong><small>Black Belt's Team</small></span>
        </NavLink>
        <div className="header-controls">
          <label>Crew member<select value={astronautId} onChange={event => setAstronautId(event.target.value)}>
            {[...new Set(['astro_demo_001', 'astro_demo_002', 'astro_demo_003', astronautId])].map(id => <option key={id} value={id}>{crewName(id)}</option>)}
          </select></label>
          <label>Data source<select value={dataset} onChange={event => setDataset(event.target.value === 'real' ? 'real' : 'simulated')}>
            <option value="simulated">Simulation</option><option value="real">Crew & sensor records</option>
          </select></label>
        </div>
        <div className="design-actions header-actions">
          <button className="design-button" onClick={() => setIsScenarioModalOpen(true)}><FlaskConical size={17} /> Scenarios</button>
          <button className="design-button primary" onClick={() => setIsNewLogModalOpen(true)}><Plus size={18} /> Add record</button>
        </div>
      </div>
    </header>
    <nav className="design-nav" aria-label="Main navigation">
      <div className="design-wrap">
        <NavLink to="/" end><Home size={16} /> Overview</NavLink>
        {areas.map(({ id, icon: Icon, title, path }) => <NavLink key={id} to={path}><Icon size={16} /> {title}</NavLink>)}
      </div>
    </nav>
  </>;
}

export function DesignFooter() {
  return <footer className="design-wrap design-footer">
    <span>AstroVida supports self-monitoring. It does not diagnose health conditions.</span>
    <a href="https://www.nasa.gov/hrp/hazards/">NASA human spaceflight hazards <ArrowUpRight size={14} aria-hidden="true" /></a>
  </footer>;
}
