'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

export interface EMIRow {
  id: string;
  loanName: string;
  monthlyAmount: string;
  totalRemaining: string;
  dueDate: string;
  startDate: string;
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
  'w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-800 placeholder-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all';

function getInstallments(monthly: string, total: string): number | null {
  const m = parseFloat(monthly);
  const t = parseFloat(total);
  if (!m || !t || m <= 0 || t <= 0 || m > t) return null;
  return Math.ceil(t / m);
}

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
  const totalMonthly = emis.reduce((s, e) => s + (parseFloat(e.monthlyAmount) || 0), 0);

  return (
    <div className="p-6 flex flex-col gap-4">

      <p className="text-sm text-gray-500 leading-relaxed">
        Add any active loans so we can deduct EMIs from your monthly budget automatically.
      </p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-500 px-3 py-2.5 rounded-xl text-xs">
          <AlertCircle size={13} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* No EMI toggle */}
      <button
        type="button"
        onClick={onToggleNoEMI}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
          noEMI ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300 bg-white'
        }`}
      >
        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
          noEMI ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
        }`}>
          {noEMI && (
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </div>
        <div>
          <p className={`text-sm font-semibold ${noEMI ? 'text-orange-700' : 'text-gray-700'}`}>
            I don't have any active EMIs
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Skip this step</p>
        </div>
      </button>

      {/* EMI list */}
      <AnimatePresence>
        {!noEMI && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden flex flex-col gap-3"
          >
            <div className="space-y-3 max-h-64 overflow-y-auto">
              <AnimatePresence>
                {emis.map((emi, i) => {
                  const installments = getInstallments(emi.monthlyAmount, emi.totalRemaining);
                  const monthly = parseFloat(emi.monthlyAmount) || 0;
                  const total = parseFloat(emi.totalRemaining) || 0;
                  const overError = monthly > 0 && total > 0 && monthly > total;

                  return (
                    <motion.div
                      key={emi.id}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 10, transition: { duration: 0.12 } }}
                      className="border border-gray-100 rounded-xl p-3.5 bg-gray-50 space-y-3"
                    >
                      {/* Loan name + delete */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Loan ${i + 1} name`}
                          value={emi.loanName}
                          onChange={(e) => onUpdateEMI(emi.id, 'loanName', e.target.value)}
                          className={`${inputClass} flex-1 font-medium`}
                        />
                        <button
                          type="button"
                          onClick={() => onRemoveEMI(emi.id)}
                          className="p-2 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Monthly + Total */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 mb-1.5 block font-medium">Monthly EMI</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs select-none">NRs</span>
                            <input
                              type="number"
                              placeholder="0"
                              min="0"
                              value={emi.monthlyAmount}
                              onChange={(e) => onUpdateEMI(emi.id, 'monthlyAmount', e.target.value)}
                              className={`${inputClass} pl-10`}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1.5 block font-medium">Total Remaining</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs select-none">NRs</span>
                            <input
                              type="number"
                              placeholder="0"
                              min="0"
                              value={emi.totalRemaining}
                              onChange={(e) => onUpdateEMI(emi.id, 'totalRemaining', e.target.value)}
                              className={`${inputClass} pl-10`}
                            />
                          </div>
                        </div>
                      </div>

                      {overError && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle size={11} />
                          Monthly EMI can't exceed total remaining
                        </p>
                      )}

                      {/* Installments — shown once both fields are filled and valid */}
                      {installments && !overError && (
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                          <span className="text-xs text-gray-400">Estimated installments</span>
                          <span className="text-sm font-bold text-orange-500 ml-auto">{installments} months</span>
                        </div>
                      )}

                      {/* Start date + Due day */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 mb-1.5 block font-medium">Start Date</label>
                          <input
                            type="date"
                            value={emi.startDate}
                            onChange={(e) => onUpdateEMI(emi.id, 'startDate', e.target.value)}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1.5 block font-medium">Due Day</label>
                          <input
                            type="number"
                            placeholder="e.g. 5"
                            min="1"
                            max="31"
                            value={emi.dueDate}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (e.target.value === '') { onUpdateEMI(emi.id, 'dueDate', ''); return; }
                              onUpdateEMI(emi.id, 'dueDate', String(Math.min(31, Math.max(1, val))));
                            }}
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={onAddEMI}
              className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors"
            >
              <Plus size={14} />
              Add a loan
            </button>

            <AnimatePresence>
              {emis.length > 0 && totalMonthly > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
                >
                  <span className="text-xs text-gray-500 font-medium">Total monthly EMIs</span>
                  <span className="text-sm font-bold text-gray-800">
                    NRs {totalMonthly.toLocaleString('en-IN')}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
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