import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TopBar } from './components/TopBar';
import { TabsNav } from './components/TabsNav';
import { Geral } from './pages/Geral';
import { Radiacao } from './pages/Radiacao';
import { Isolamento } from './pages/Isolamento';
import { Distancia } from './pages/Distancia';
import { Gravidade } from './pages/Gravidade';
import { Ambiente } from './pages/Ambiente';

// Global Modals
import { MetricDetailModal } from './components/MetricDetailModal';
import { QuickLogModal } from './components/QuickLogModal';
import { NewSurgeonMessageModal } from './components/NewSurgeonMessageModal';
import { GuidedBreathingModal } from './components/GuidedBreathingModal';
import { MealLogModal } from './components/MealLogModal';
import { QuickTestModal } from './components/QuickTestModal';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col antialiased selection:bg-astro-cyan/30 selection:text-astro-cyan">
        {/* Navigation & Header */}
        <TopBar />
        <TabsNav />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Geral />} />
            <Route path="/radiacao" element={<Radiacao />} />
            <Route path="/isolamento" element={<Isolamento />} />
            <Route path="/distancia" element={<Distancia />} />
            <Route path="/gravidade" element={<Gravidade />} />
            <Route path="/ambiente" element={<Ambiente />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Modals & Overlays */}
        <MetricDetailModal />
        <QuickLogModal />
        <NewSurgeonMessageModal />
        <GuidedBreathingModal />
        <MealLogModal />
        <QuickTestModal />
      </div>
    </BrowserRouter>
  );
};

export default App;
