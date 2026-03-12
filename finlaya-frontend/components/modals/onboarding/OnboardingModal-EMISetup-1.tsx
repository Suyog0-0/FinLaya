'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

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

function getInstallments(monthly: string, total: string): number | null {
  const m = parseFloat(monthly);
  const t = parseFloat(total);
  if (!m || !t || m <= 0 || t <= 0 || m > t) return null;
  return Math.ceil(t / m);
}

const field =
  'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-300 focus:border-orange-400 focus:ring-1 focus:ring-orange-100 outline-none transition-all';

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
    <>
      <div className="px-6 pt-5 pb-3 space-y-4">

        {/* Description */}
        <p className="text-sm text-gray-400">
          Add your active loans so we can deduct EMIs from your monthly budget.
        </p>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-xl text-xs">
            <AlertCircle size={13} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* No EMI checkbox */}
        <button
          type="button"
          onClick={onToggleNoEMI}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-left transition-all ${
            noEMI ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:border-orange-200'
          }`}
        >
          <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            noEMI ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
          }`}>
            {noEMI && <CheckCircle2 size={10} className="text-white" strokeWidth={3} />}
          </div>
          <div>
            <p className={`text-sm font-semibold leading-tight ${noEMI ? 'text-orange-700' : 'text-gray-700'}`}>
              I don't have any active EMIs
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Skip and go to categories</p>
          </div>
        </button>

        {/* EMI cards */}
        <AnimatePresence>
          {!noEMI && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 max-h-72 overflow-y-auto pb-1 pr-0.5">
                <AnimatePresence>
                  {emis.map((emi, i) => {
                    const installments = getInstallments(emi.monthlyAmount, emi.totalRemaining);
                    const monthly = parseFloat(emi.monthlyAmount) || 0;
                    const total = parseFloat(emi.totalRemaining) || 0;
                    const overError = monthly > 0 && total > 0 && monthly > total;

                    return (
                      <motion.div
                        key={emi.id}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 12, transition: { duration: 0.12 } }}
                        transition={{ duration: 0.16 }}
                        className="border border-gray-100 rounded-xl p-3.5 bg-gray-50/50 space-y-2.5"
                      >
                        {/* Row 1: Loan name + installments badge + delete */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={`Loan ${i + 1} name (e.g. Car Loan)`}
                            value={emi.loanName}
                            onChange={(e) => onUpdateEMI(emi.id, 'loanName', e.target.value)}
                            className={`${field} flex-1 font-medium`}
                          />
                          {installments && (
                            <span className="text-xs font-medium px-2 py-1 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0 whitespace-nowrap">
                              {installments} inst.
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => onRemoveEMI(emi.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Row 2: Monthly EMI + Total Remaining */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Monthly EMI</label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">NRs</span>
                              <input
                                type="number"
                                placeholder="0"
                                min="0"
                                value={emi.monthlyAmount}
                                onChange={(e) => onUpdateEMI(emi.id, 'monthlyAmount', e.target.value)}
                                className={`${field} pl-9`}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Total Remaining</label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">NRs</span>
                              <input
                                type="number"
                                placeholder="0"
                                min="0"
                                value={emi.totalRemaining}
                                onChange={(e) => onUpdateEMI(emi.id, 'totalRemaining', e.target.value)}
                                className={`${field} pl-9`}
                              />
                            </div>
                          </div>
                        </div>

                        {overError && (
                          <p className="text-xs text-red-500 flex items-center gap-1 -mt-1">
                            <AlertCircle size={11} /> Monthly EMI can't exceed total remaining
                          </p>
                        )}

                        {/* Row 3: Start date + Due day */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Start Date</label>
                            <input
                              type="date"
                              value={emi.startDate}
                              onChange={(e) => onUpdateEMI(emi.id, 'startDate', e.target.value)}
                              className={field}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Due Day (1–31)</label>
                            <input
                              type="number"
                              placeholder="e.g. 5"
                              min="1"
                              max="31"
                              value={emi.dueDate}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (e.target.value === '') {
                                  onUpdateEMI(emi.id, 'dueDate', '');
                                  return;
                                }
                                // Clamp between 1 and 31
                                const clamped = Math.min(31, Math.max(1, val));
                                onUpdateEMI(emi.id, 'dueDate', String(clamped));
                              }}
                              className={field}
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Add loan button */}
              <button
                type="button"
                onClick={onAddEMI}
                className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors mt-3"
              >
                <Plus size={14} />
                Add another loan
              </button>

              {/* Total summary */}
              <AnimatePresence>
                {emis.length > 0 && totalMonthly > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5"
                  >
                    <span className="text-xs text-gray-500 font-medium">Total monthly EMIs</span>
                    <span className="text-sm font-bold text-orange-600 tabular-nums">
                      NRs {totalMonthly.toLocaleString('en-IN')}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 pt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors px-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          Next
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </motion.button>
      </div>
    </>
  );
}