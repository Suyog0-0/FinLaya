'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const paymentMethods = ['Bank Transfer', 'Cash', 'Mobile Payment (eSewa/Khalti)', 'Cheque'];

const incomeCategories = [
  'Salary',
  'Freelance',
  'Business',
  'Investment',
  'Rental',
  'Gift',
  'Bonus',
  'Other',
];

export default function AddIncomeModal({ isOpen, onClose, onSuccess }: AddIncomeModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'Salary',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase.from('income').insert({
        user_id: user.id,
        amount: parseFloat(form.amount),
        description: form.title,
        category_name: form.category,
        income_date: form.date,
        payment_method: form.paymentMethod,
      });

      if (insertError) {
        setError(`Failed to add income: ${insertError.message}`);
        setIsLoading(false);
        return;
      }

      setForm({
        title: '',
        amount: '',
        category: 'Salary',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Bank Transfer',
        notes: '',
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('[AddIncomeModal] Unexpected error:', err);
      setError('Unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">
                    <TrendingUp className="text-white" size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Add Income</h2>
                    <p className="text-xs text-gray-500">Record a new income entry</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={22} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Monthly Salary"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none text-sm"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                      NRs
                    </span>
                    <input
                      type="number"
                      name="amount"
                      value={form.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                      min="0"
                      step="0.01"
                      className="w-full pl-14 pr-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none text-sm bg-white"
                  >
                    {incomeCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none text-sm"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none text-sm bg-white"
                  >
                    {paymentMethods.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Notes <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Any additional details..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none text-sm resize-none"
                  />
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto"
                    />
                  ) : (
                    'Add Income'
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}