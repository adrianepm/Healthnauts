import React from 'react';
import { motion } from 'framer-motion';
import { MoodCheckin } from '../components/MoodCheckin';
import { WellbeingRing } from '../components/WellbeingRing';
import { SleepBars } from '../components/SleepBars';
import { CircadianRing } from '../components/CircadianRing';
import { SocialBars } from '../components/SocialBars';
import { SupportToolList } from '../components/SupportToolList';

export const Isolamento: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* Top: Mood 20-Sec Check-in & WHO-5 Wellbeing Ring */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <MoodCheckin />
        </div>
        <div className="lg:col-span-5">
          <WellbeingRing />
        </div>
      </div>

      {/* Middle: 14-Day Sleep Bars & 24h Circadian Donut Ring */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <SleepBars />
        </div>
        <div className="lg:col-span-6">
          <CircadianRing />
        </div>
      </div>

      {/* Base: Social Contact Crew vs Earth & Support Tools List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <SocialBars />
        </div>
        <div className="lg:col-span-6">
          <SupportToolList />
        </div>
      </div>
    </motion.div>
  );
};
