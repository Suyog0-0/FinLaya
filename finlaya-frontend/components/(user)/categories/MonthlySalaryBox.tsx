'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface MonthlySalaryBoxProps {
  salaryInput: string;
  salary: number;
  isSaving: boolean;
  isSaved: boolean;
  error: string;
  onChange: (val: string) => void;
  onSave: () => void;
}

export default function MonthlySalaryBox({
  salaryInput,
  salary,
  isSaving,
  isSaved,
  error,
  onChange,
  onSave,
}: MonthlySalaryBoxProps) {
  const salaryChanged = parseFloat(salaryInput) !== salary;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="font-semibold text-gray-900">Monthly Salary</p>
          <p className="text-sm text-gray-400 mt-0.5">
            Enter your monthly income to auto-calculate budgets
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
            <span className="text-sm text-gray-500 font-medium">NRs</span>
            <input
              type="number"
              value={salaryInput}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSave()}
              placeholder="0"
              min="0"
              className="w-32 text-sm text-gray-900 font-semibold bg-transparent outline-none"
            />
          </div>

          <AnimatePresence mode="wait">
            {isSaved ? (
              <motion.div
                key="saved"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-green-600 text-sm font-medium"
              >
                <Check size={15} /> Saved!
              </motion.div>
            ) : (
              <motion.button
                key="btn"
                onClick={onSave}
                disabled={isSaving || !salaryChanged}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  'Save'
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}