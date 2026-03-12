// ContributeModal.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Plus } from 'lucide-react';

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalTitle: string;
  targetAmount: number;
  savedAmount: number;
  availableSavings: number;
  onContribute: (amount: number) => Promise<void>;
}

export default function ContributeModal({
  isOpen,
  onClose,
  goalTitle,
  targetAmount,
  savedAmount,
  availableSavings,
  onContribute,
}: ContributeModalProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const progressPercent = targetAmount > 0 ? Math.min((savedAmount / targetAmount) * 100, 100) : 0;
  const remaining = Math.max(0, targetAmount - savedAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (parsedAmount > availableSavings) {
      setError('Amount exceeds available savings.');
      return;
    }

    if (parsedAmount > remaining) {
      setError(`Amount exceeds remaining goal balance of NRs ${remaining.toLocaleString()}.`);
      return;
    }

    setError('');
    await onContribute(parsedAmount);
    setAmount('');
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none text-sm transition-all bg-slate-50 focus:bg-white";

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
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
                <h2 className="text-base font-bold text-slate-800">Contribute to "{goalTitle}"</h2>
                <p className="text-xs text-slate-400">Add funds to your goal</p>
              </div>
            </div>
            <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
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

            {/* Contribution amount input */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Contribution Amount (NRs)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">NRs</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  step="any"
                  className={inputClass}
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Available to contribute: <span className="font-medium">NRs {availableSavings.toLocaleString()}</span>
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add to Goal
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}