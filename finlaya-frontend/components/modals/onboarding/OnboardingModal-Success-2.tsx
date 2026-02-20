'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface DoneProps {
  salary: string;
  enabledCount: number;
  onComplete: () => void;
}

export default function OnboardingModalDone2({ salary, enabledCount, onComplete }: DoneProps) {
  return (
    <>
      <div className="p-6 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-5 shadow-lg shadow-orange-200"
        >
          <Check size={36} className="text-white" strokeWidth={3} />
        </motion.div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">Budget set up!</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed">
          Your salary and {enabledCount} budget {enabledCount === 1 ? 'category has' : 'categories have'} been saved.
          Head to your dashboard to see everything in action.
        </p>

        {/* Summary pill */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-5 py-3 mb-2 w-full max-w-xs">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Monthly salary</span>
            <span className="font-bold text-gray-900">
              NRs {parseFloat(salary).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Categories set up</span>
            <span className="font-bold text-orange-600">{enabledCount}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onComplete}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold shadow-md flex items-center justify-center gap-2"
        >
          Go to Dashboard
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </motion.button>
      </div>
    </>
  );
}