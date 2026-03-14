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
          className="bg-white w-full max-w-lg rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Target size={14} className="text-orange-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Contribute to &ldquo;{goalTitle}&rdquo;</h2>
                <p className="text-xs text-gray-500">Add funds to your goal</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-lg text-xs flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-red-500" />
                {error}
              </div>
            )}

            {/* Progress summary */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Progress</span>
                <span className="font-medium text-gray-700">{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                <motion.div
                  className="h-full bg-orange-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-gray-500 mb-0.5">Saved</div>
                  <div className="font-semibold text-green-600">NRs {savedAmount.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500 mb-0.5">Target</div>
                  <div className="font-semibold text-blue-600">NRs {targetAmount.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500 mb-0.5">Remaining</div>
                  <div className="font-semibold text-orange-600">NRs {remaining.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Contribution amount */}
            <div>
              <label className="text-xs text-gray-500 font-semibold block mb-1.5">
                Contribution Amount
              </label>
              <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 focus-within:border-orange-300">
                <span className="px-3 py-2 text-sm font-medium text-gray-500">NRs</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setError(''); }}
                  placeholder="0.00"
                  min="1" step="any"
                  className="w-full py-2.5 px-2 bg-transparent outline-none text-gray-800 placeholder-gray-400"
                  autoFocus
                />
              </div>

              {/* Available savings info */}
              <p className="text-xs text-gray-500 mt-2">
                {savingsLabel}: 
                <span className={`ml-1 font-medium ${availableSavings <= 0 ? 'text-red-500' : 'text-gray-700'}`}>
                  NRs {availableSavings.toLocaleString()}
                </span>
              </p>

              {/* Warning when over savings */}
              {isOverSavings && (
                <div className="flex items-start gap-1.5 mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle size={12} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    Exceeds your {savingsLabel.toLowerCase()} of NRs {availableSavings.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving || !amount}
              className={`w-full py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                saving || !amount 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {saving ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <><Plus size={14} /> Add to Goal</>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}