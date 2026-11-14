import React from 'react';
import { motion } from 'framer-motion';
import { DoseGauge } from '../components/DoseGauge';
import { SolarAlertBanner } from '../components/SolarAlertBanner';
import { DoseRateChart } from '../components/DoseRateChart';
import { SymptomChecklist } from '../components/SymptomChecklist';
import { ShipZoneMap } from '../components/ShipZoneMap';

export const Radiacao: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* Top Section: Dose Gauge (1/3) & Solar Alert Banner with live countdown (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4">
          <DoseGauge />
        </div>
        <div className="lg:col-span-8">
          <SolarAlertBanner />
        </div>
      </div>

      {/* Middle Section: Dose Rate 7 Days & Radiation Symptoms Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <DoseRateChart />
        </div>
        <div className="lg:col-span-5">
          <SymptomChecklist />
        </div>
      </div>

      {/* Base Section: Ship Protection Zones Map */}
      <div>
        <ShipZoneMap />
      </div>
    </motion.div>
  );
};
