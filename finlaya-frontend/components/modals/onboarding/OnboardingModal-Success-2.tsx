'use client';

import { motion } from 'framer-motion';

interface DoneProps {
  salary: string;
  enabledCount: number;
  onComplete: () => void;
}

export default function OnboardingModalSuccess2({ salary, enabledCount, onComplete }: DoneProps) {
  return (
    <div className="p-6 flex flex-col items-center text-center gap-5">

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
        className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center mt-2"
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center gap-1.5"
      >
        <h3 className="text-xl font-bold text-gray-900">You're all set!</h3>
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
          Your salary and {enabledCount} budget {enabledCount === 1 ? 'category has' : 'categories have'} been saved.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 w-full max-w-xs"
      >
        <div className="flex justify-between items-center text-sm mb-2.5 pb-2.5 border-b border-gray-200">
          <span className="text-gray-500">Monthly salary</span>
          <span className="font-bold text-gray-900">
            NRs {parseFloat(salary).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">Categories</span>
          <span className="font-bold text-orange-500">{enabledCount} set up</span>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onComplete}
        className="w-full max-w-xs bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
      >
        Go to Dashboard
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </motion.button>

    </div>
  );
}