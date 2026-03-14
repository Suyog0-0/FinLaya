'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Sliders, Pencil } from 'lucide-react';

export interface RebalanceDialogProps {
  isOpen:         boolean;
  overflowAmount: number;
  newBudgetable:  number;
  isScaling:      boolean;
  onAutoScale:    () => void;
  onEditManually: () => void;
  onDismiss:      () => void;
}

export default function RebalanceDialog({
  isOpen, overflowAmount, newBudgetable, isScaling,
  onAutoScale, onEditManually, onDismiss,
}: RebalanceDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={onDismiss}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                <AlertTriangle size={20} className="text-orange-500" />
              </div>

              <h3 className="text-base font-bold text-gray-900 mb-2">
                Categories exceed new budget
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">
                Adding this loan reduced your available budget by{' '}
                <span className="font-semibold text-gray-700">
                  NRs {overflowAmount.toLocaleString('en-IN')}
                </span>
                . Your category budgets now exceed your available salary of{' '}
                <span className="font-semibold text-gray-700">
                  NRs {newBudgetable.toLocaleString('en-IN')}
                </span>
                . How would you like to fix this?
              </p>

              <div className="flex flex-col gap-2.5 mb-3">
                {/* Auto-scale */}
                <button
                  onClick={onAutoScale}
                  disabled={isScaling}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isScaling ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full flex-shrink-0"
                    />
                  ) : (
                    <Sliders size={15} className="flex-shrink-0" />
                  )}
                  <div className="text-left">
                    <p className="font-semibold text-sm">Auto-scale categories</p>
                    <p className="text-xs text-orange-100 font-normal">
                      Proportionally reduce all budgets to fit
                    </p>
                  </div>
                </button>

                {/* Edit manually */}
                <button
                  onClick={onEditManually}
                  disabled={isScaling}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <Pencil size={15} className="flex-shrink-0 text-gray-500" />
                  <div className="text-left">
                    <p className="font-semibold text-sm text-gray-800">Edit manually</p>
                    <p className="text-xs text-gray-400 font-normal">
                      Go to categories page and adjust yourself
                    </p>
                  </div>
                </button>
              </div>

              {/* Dismiss */}
              <button
                onClick={onDismiss}
                disabled={isScaling}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 font-medium py-1 transition-colors disabled:opacity-40"
              >
                Dismiss for now
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}