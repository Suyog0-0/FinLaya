'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';

export interface EMIRow {
  id: string;
  loanName: string;
  monthlyAmount: string;
  totalRemaining: string;
  dueDate: string;
}

interface EMISetupProps {
  emis: EMIRow[];
  noEMI: boolean;
  error: string;
  onAddEMI: () => void;
  onRemoveEMI: (id: string) => void;
  onUpdateEMI: (id: string, field: keyof EMIRow, value: string) => void;
  onToggleNoEMI: () => void;
  onBack: () => void;
  onNext: () => void;
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:border-orange-400 focus:ring-1 focus:ring-orange-200 outline-none bg-white transition-all';

export default function OnboardingModalEMISetup1({
  emis,
  noEMI,
  error,
  onAddEMI,
  onRemoveEMI,
  onUpdateEMI,
  onToggleNoEMI,
  onBack,
  onNext,
}: EMISetupProps) {
  const canProceed = noEMI || emis.length > 0;
  const totalMonthly = emis.reduce((sum, e) => sum + (parseFloat(e.monthlyAmount) || 0), 0);

  return (
    <>
      <div className="p-6">
        <p className="text-sm text-gray-500 mb-4">
          Add your active loan EMIs so we can account for them in your monthly budget.
        </p>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-3 py-2.5 rounded-xl text-sm mb-4">
            <AlertCircle size={14} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* No EMI toggle */}
        <button
          type="button"
          onClick={onToggleNoEMI}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all mb-4 text-left ${
            noEMI
              ? 'border-orange-400 bg-orange-50'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
              noEMI ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'
            }`}
          >
            {noEMI && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
          </div>
          <span className={`text-sm font-medium ${noEMI ? 'text-orange-700' : 'text-gray-600'}`}>
            I don't have any active EMIs
          </span>
        </button>

        {/* EMI list */}
        <AnimatePresence>
          {!noEMI && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 mb-3">
                <AnimatePresence>
                  {emis.map((emi) => (
                    <motion.div
                      key={emi.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.18 }}
                      className="bg-orange-50/50 border border-orange-100 rounded-xl p-3 space-y-2"
                    >
                      {/* Loan name + delete */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <CreditCard size={12} className="text-orange-500" />
                        </div>
                        <input
                          type="text"
                          placeholder="Loan name (e.g. Car Loan)"
                          value={emi.loanName}
                          onChange={(e) => onUpdateEMI(emi.id, 'loanName', e.target.value)}
                          className={`${inputClass} flex-1`}
                        />
                        <button
                          type="button"
                          onClick={() => onRemoveEMI(emi.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Monthly + Remaining */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 font-medium mb-1 block">Monthly EMI</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">NRs</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={emi.monthlyAmount}
                              onChange={(e) => onUpdateEMI(emi.id, 'monthlyAmount', e.target.value)}
                              className={`${inputClass} pl-9`}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 font-medium mb-1 block">Total Remaining</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">NRs</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={emi.totalRemaining}
                              onChange={(e) => onUpdateEMI(emi.id, 'totalRemaining', e.target.value)}
                              className={`${inputClass} pl-9`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Due date */}
                      <div className="w-1/2 pr-1">
                        <label className="text-xs text-gray-400 font-medium mb-1 block">Due Date (day of month)</label>
                        <input
                          type="number"
                          placeholder="e.g. 5"
                          min="1"
                          max="31"
                          value={emi.dueDate}
                          onChange={(e) => onUpdateEMI(emi.id, 'dueDate', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Add EMI button */}
              <button
                type="button"
                onClick={onAddEMI}
                className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors"
              >
                <Plus size={15} />
                Add EMI
              </button>

              {/* Total monthly summary */}
              {emis.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 flex justify-between items-center bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5"
                >
                  <span className="text-xs text-gray-500 font-medium">Total monthly EMIs</span>
                  <span className="text-sm font-bold text-orange-600">
                    NRs {totalMonthly.toLocaleString('en-IN')}
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors px-2"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>
        <motion.button
          whileHover={{ scale: canProceed ? 1.02 : 1 }}
          whileTap={{ scale: canProceed ? 0.98 : 1 }}
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Next
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </motion.button>
      </div>
    </>
  );
}