'use client';

import { motion } from 'framer-motion';

interface DefaultCategory {
  name: string;
  percentage: number;
}

interface SalaryInputProps {
  salary: string;
  onSalaryChange: (val: string) => void;
  defaultCategories: DefaultCategory[];
  onNext: () => void;
  onSkip: () => void;
}

const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: 'Housing', percentage: 30 },
  { name: 'Food', percentage: 15 },
  { name: 'Transportation', percentage: 10 },
  { name: 'Utilities', percentage: 8 },
  { name: 'Health', percentage: 7 },
  { name: 'Entertainment', percentage: 5 },
  { name: 'Savings', percentage: 20 },
  { name: 'Others', percentage: 5 },
];

export default function OnboardingModalSalaryInput0({
  salary,
  onSalaryChange,
  onNext,
  onSkip,
}: SalaryInputProps) {
  const salaryNum = parseFloat(salary) || 0;
  const isValid = salaryNum > 0;

  return (
    <>
      <div className="p-6">
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          Enter your monthly take-home salary. We&apos;ll use this to suggest budget allocations across your spending categories.
        </p>

        <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Salary</label>
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">NRs</span>
          <input
            type="number"
            value={salary}
            onChange={(e) => onSalaryChange(e.target.value)}
            placeholder="e.g. 50000"
            min="0"
            className="w-full pl-14 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-gray-900 text-base transition-all"
            autoFocus
          />
        </div>

        {salaryNum > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-2"
          >
            <p className="text-sm text-amber-800 font-medium mb-2">Default allocations preview</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              {DEFAULT_CATEGORIES.map((c) => (
                <div key={c.name} className="flex justify-between text-xs text-amber-700">
                  <span>{c.name}</span>
                  <span className="font-semibold">
                    NRs {Math.round(salaryNum * (c.percentage / 100)).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 flex items-center justify-between">
        <button
          onClick={onSkip}
          className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
        >
          Skip for now
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          disabled={!isValid}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Next: Set Categories
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </motion.button>
      </div>
    </>
  );
}