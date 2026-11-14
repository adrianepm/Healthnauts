import React from 'react';
import { motion } from 'framer-motion';
import { CommsLinkDiagram } from '../components/CommsLinkDiagram';
import { MedKitInventory } from '../components/MedKitInventory';
import { FlightSurgeonQueue } from '../components/FlightSurgeonQueue';
import { SymptomSearch } from '../components/SymptomSearch';
import { GuidedProtocolStepper } from '../components/GuidedProtocolStepper';

export const Distancia: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* Top: Comms Link Diagram & Medical Autonomy */}
      <div>
        <CommsLinkDiagram />
      </div>

      {/* Middle: Medical Kit Inventory & Flight Surgeon Asynchronous Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <MedKitInventory />
        </div>
        <div className="lg:col-span-6">
          <FlightSurgeonQueue />
        </div>
      </div>

      {/* Base: Guided Offline Diagnosis (Symptom Search + 5-Stage Stepper) */}
      <div className="space-y-4">
        <SymptomSearch />
        <GuidedProtocolStepper />
      </div>
    </motion.div>
  );
};
