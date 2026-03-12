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

export default function OnboardingModalSalaryInput0({
  salary,
  onSalaryChange,
  onNext,
  onSkip,
}: SalaryInputProps) {
  const salaryNum = parseFloat(salary) || 0;
  const isValid = salaryNum > 0;

  return (
    <div className="p-6 flex flex-col gap-6">

      <p className="text-sm text-gray-500 leading-relaxed">
        Enter your monthly take-home salary. We'll use this to suggest how to split your budget.
      </p>

      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Monthly Salary
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium select-none">
            NRs
          </span>
          <input
            type="number"
            value={salary}
            onChange={(e) => onSalaryChange(e.target.value)}
            placeholder="50,000"
            min="0"
            autoFocus
            className="w-full pl-14 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-gray-900 text-lg font-semibold transition-all placeholder:text-gray-300 placeholder:font-normal"
          />
        </div>
      </div>

      {/* Live split preview */}
      {isValid && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-gray-50 border border-gray-200 rounded-xl p-4"
        >
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Suggested split
          </p>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            {[
              { name: 'Housing', pct: 30 },
              { name: 'Savings', pct: 20 },
              { name: 'Food', pct: 15 },
              { name: 'Transport', pct: 10 },
              { name: 'Utilities', pct: 8 },
              { name: 'Health', pct: 7 },
              { name: 'Entertainment', pct: 5 },
              { name: 'Others', pct: 5 },
            ].map((c) => (
              <div key={c.name} className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{c.name}</span>
                <span className="text-xs font-semibold text-gray-700">
                  NRs {Math.round(salaryNum * (c.pct / 100)).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onSkip}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Skip for now
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          disabled={!isValid}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          Continue
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </motion.button>
      </div>

    </div>
  );
}