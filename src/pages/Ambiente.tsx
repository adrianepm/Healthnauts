import React from 'react';
import { motion } from 'framer-motion';
import { AirGauges } from '../components/AirGauges';
import { CabinSensorMap } from '../components/CabinSensorMap';
import { Co2Chart } from '../components/Co2Chart';
import { NutritionRings } from '../components/NutritionRings';
import { HygieneChecklist } from '../components/HygieneChecklist';

export const Ambiente: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* Top: 4 Atmospheric Air Gauges */}
      <div>
        <AirGauges />
      </div>

      {/* Middle: Cabin Sensors 2x2 Map & 24h CO2 Area Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <CabinSensorMap />
        </div>
        <div className="lg:col-span-6">
          <Co2Chart />
        </div>
      </div>

      {/* Base: Nutrition and Hydration Rings & Hygiene Routine Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <NutritionRings />
        </div>
        <div className="lg:col-span-6">
          <HygieneChecklist />
        </div>
      </div>
    </motion.div>
  );
};
