'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Save, AlertCircle } from 'lucide-react';

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
  const hasInput = salaryInput.trim() !== '';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Label Section */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 flex items-center gap-2">
            Monthly Salary
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              Optional
            </span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Enter your monthly income to auto-calculate budgets
          </p>
        </div>

        {/* Input + Action Section */}
        <div className="flex items-center gap-3">
          {/* Salary Input */}
          <label className="relative flex items-center">
            <span className="absolute left-4 text-sm text-gray-400 font-medium pointer-events-none">
              NRs
            </span>
            <input
              type="number"
              value={salaryInput}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSave()}
              placeholder="0"
              min="0"
              aria-label="Monthly salary in Nepalese Rupees"
              className="w-36 pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 font-semibold placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 focus:bg-white transition-all"
            />
          </label>

          {/* Save Button / Saved State */}
          <AnimatePresence mode="wait">
            {isSaved ? (
              <motion.div
                key="saved"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <Check size={14} strokeWidth={3} />
                </motion.div>
                Saved
              </motion.div>
            ) : (
              <motion.button
                key="btn"
                onClick={onSave}
                disabled={isSaving || !salaryChanged || !hasInput}
                title={!hasInput ? 'Enter a salary to save' : !salaryChanged ? 'No changes to save' : ''}
                className="group relative inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold shadow-sm shadow-amber-200/40 hover:shadow-amber-300/50 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:hover:from-amber-500 disabled:hover:to-orange-500 transition-all duration-200"
              >
                {isSaving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/90 border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Save size={14} className="text-white/90 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                    <span>Save</span>
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-xs text-red-600 mt-3 font-medium"
          >
            <AlertCircle size={12} strokeWidth={2.5} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}