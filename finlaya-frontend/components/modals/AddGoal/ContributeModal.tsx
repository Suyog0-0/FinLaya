'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Plus, AlertTriangle } from 'lucide-react';

interface ContributeModalProps {
  isOpen:           boolean;
  onClose:          () => void;
  goalTitle:        string;
  targetAmount:     number;
  savedAmount:      number;
  availableSavings: number;
  // Tells the modal where the limit came from so we can show the right label
  savingsSource:    'category' | 'net';
  onContribute:     (amount: number) => Promise<void>;
}

export default function ContributeModal({
  isOpen, onClose, goalTitle, targetAmount, savedAmount,
  availableSavings, savingsSource, onContribute,
}: ContributeModalProps) {
  const [amount, setAmount]   = useState('');
  const [error, setError]     = useState('');
  const [saving, setSaving]   = useState(false);

  const progressPercent = targetAmount > 0 ? Math.min((savedAmount / targetAmount) * 100, 100) : 0;
  const remaining       = Math.max(0, targetAmount - savedAmount);
  const parsedAmount    = parseFloat(amount) || 0;

  // Warn if over savings limit, but do NOT hard block.
  // If the user has no Savings category, savingsSource === 'net' and the limit
  // is just the net spendable balance — still just a warning.
  const isOverSavings = parsedAmount > 0 && parsedAmount > availableSavings;
  const isOverGoal    = parsedAmount > 0 && parsedAmount > remaining;

  const savingsLabel = savingsSource === 'category'
    ? 'Savings budget'
    : 'Available balance';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (isOverGoal) {
      setError(`Amount exceeds remaining goal balance of NRs ${remaining.toLocaleString()}.`);
      return;
    }

    // No hard block on savings — user can contribute even if over savings budget.
    // They already see the amber warning below the input.

    setError('');
    setSaving(true);
    try {
      await onContribute(parsedAmount);
      setAmount('');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError('');
    setAmount('');
    onClose();
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none text-sm transition-all bg-slate-50 focus:bg-white';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white w-full max-w-lg rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                <Target size={16} className="text-orange-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Contribute to &ldquo;{goalTitle}&rdquo;</h2>
                <p className="text-xs text-slate-400">Add funds to your goal</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                ⚠️ {error}
              </div>
            )}

            {/* Progress summary */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500">Progress</span>
                <span className="font-medium">{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-orange-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-slate-500">Saved: NRs {savedAmount.toLocaleString()}</span>
                <span className="text-slate-500">Target: NRs {targetAmount.toLocaleString()}</span>
              </div>
              <div className="mt-1 text-xs text-orange-600 font-medium">
                Remaining: NRs {remaining.toLocaleString()}
              </div>
            </div>

            {/* Contribution amount */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Contribution Amount (NRs)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">NRs</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setError(''); }}
                  placeholder="Enter amount"
                  min="1" step="any"
                  className={inputClass}
                  autoFocus
                />
              </div>

              {/* Available savings info */}
              <p className="text-xs text-slate-400 mt-1.5">
                {savingsLabel}:{' '}
                <span className={`font-medium ${availableSavings <= 0 ? 'text-red-500' : 'text-slate-600'}`}>
                  NRs {availableSavings.toLocaleString()}
                </span>
                {savingsSource === 'net' && availableSavings <= 0 && (
                  <span className="text-slate-400"> (no savings budget set)</span>
                )}
              </p>

              {/* Amber warning when over savings — not a hard block */}
              {isOverSavings && (
                <motion.div
                  initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 mt-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl"
                >
                  <AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    This exceeds your {savingsLabel.toLowerCase()} of NRs {availableSavings.toLocaleString()}.
                    {savingsSource === 'net'
                      ? ' You can still contribute — consider setting up a Savings category for better tracking.'
                      : ' You can still contribute, but it will exceed your savings budget.'
                    }
                  </p>
                </motion.div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <motion.div animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <><Plus size={16} /> Add to Goal</>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}