'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet } from 'lucide-react';

interface SalarySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (salary: number) => void;
}

export default function SalarySetupModal({ isOpen, onClose, onSubmit }: SalarySetupModalProps) {
  const [salary, setSalary] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const salaryAmount = parseFloat(salary);
    if (salaryAmount > 0) {
      onSubmit(salaryAmount);
    }
  };

  // Calculate default budget categories
  const calculateCategories = () => {
    const amount = parseFloat(salary) || 0;
    return [
      { name: 'Housing', percentage: 30, amount: (amount * 0.30).toFixed(2) },
      { name: 'Food', percentage: 15, amount: (amount * 0.15).toFixed(2) },
      { name: 'Transportation', percentage: 10, amount: (amount * 0.10).toFixed(2) },
      { name: 'Utilities', percentage: 8, amount: (amount * 0.08).toFixed(2) },
      { name: 'Health', percentage: 7, amount: (amount * 0.07).toFixed(2) },
      { name: 'Entertainment', percentage: 5, amount: (amount * 0.05).toFixed(2) },
      { name: 'Savings', percentage: 20, amount: (amount * 0.20).toFixed(2) },
      { name: 'Others', percentage: 5, amount: (amount * 0.05).toFixed(2) },
    ];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                    <Wallet className="text-white" size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Welcome to FinLaya!</h2>
                    <p className="text-sm text-gray-500">Let&apos;s set up your budget</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6">
                {/* Salary Input */}
                <div className="mb-6">
                  <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your monthly salary
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      NRs
                    </span>
                    <input
                      type="number"
                      id="salary"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      placeholder="1400"
                      className="w-full pl-16 pr-4 py-3 rounded-lg border-2 border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-gray-900"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Default Categories Preview */}
                {salary && parseFloat(salary) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-6"
                  >
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      We&apos;ll create these default budget categories for you:
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                      {calculateCategories().map((category, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">
                            {category.name} ({category.percentage}%)
                          </span>
                          <span className="font-semibold text-gray-900">
                            NRs {category.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!salary || parseFloat(salary) <= 0}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Get Started
                </motion.button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}