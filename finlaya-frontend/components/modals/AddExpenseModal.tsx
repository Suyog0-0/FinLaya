'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingDown } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface Category {
  category_id: number;
  category_name: string;
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const paymentMethods = ['Cash', 'Mobile Payment (eSewa/Khalti)'];

export default function AddExpenseModal({ isOpen, onClose, onSuccess }: AddExpenseModalProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const categoryRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    notes: '',
  });

  // Fetch existing categories
  useEffect(() => {
    if (!user?.id || !isOpen) return;

    const fetchCategories = async () => {
      console.debug('[Modal] Fetching categories for user:', user.id);

      const { data, error } = await supabase
        .from('budget_categories')
        .select('category_id, category_name')
        .eq('user_id', user.id);

      console.debug('[Modal] Categories result:', { data, error });
      setCategories(data || []);
    };

    fetchCategories();
  }, [user?.id, isOpen]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredSuggestions = categories.filter((c) =>
    c.category_name.toLowerCase().includes(categoryInput.toLowerCase())
  );

  const handleCategorySelect = (cat: Category) => {
    setCategoryInput(cat.category_name);
    setSelectedCategoryId(cat.category_id);
    setShowSuggestions(false);
  };

  const handleCategoryType = (val: string) => {
    setCategoryInput(val);
    setSelectedCategoryId(null);
    setShowSuggestions(true);
  };

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

    console.debug('[Modal] Submitting expense, user.id:', user.id);
    console.debug('[Modal] Form:', form);
    console.debug('[Modal] Category input:', categoryInput, '| selectedCategoryId:', selectedCategoryId);

    try {
      let categoryId = selectedCategoryId;

      // If user typed a new category, create it
      if (categoryInput && !selectedCategoryId) {
        console.debug('[Modal] Creating new category:', categoryInput);

        const { data: newCat, error: catError } = await supabase
          .from('budget_categories')
          .insert({
            user_id: user.id,
            category_name: categoryInput,
            allocation_percentage: 0,
            budget_limit: 0,
            current_balance: 0,
          })
          .select('category_id')
          .single();

        console.debug('[Modal] New category result:', { newCat, catError });

        if (catError) {
          console.error('[Modal] Category insert error:', catError);
          setError(`Failed to create category: ${catError.message} (code: ${catError.code})`);
          setIsLoading(false);
          return;
        }
        categoryId = newCat.category_id;
      }

      console.debug('[Modal] Inserting expense with category_id:', categoryId);

      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          category_id: categoryId,
          amount: parseFloat(form.amount),
          description: form.title,
          expense_date: form.date,
          payment_method: form.paymentMethod,
          is_recurring: false,
        })
        .select();

      console.debug('[Modal] Expense insert result:', { expenseData, expenseError });

      if (expenseError) {
        console.error('[Modal] Expense insert error:', expenseError);
        setError(`Failed to add expense: ${expenseError.message} (code: ${expenseError.code})`);
        setIsLoading(false);
        return;
      }

      setForm({
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash',
        notes: '',
      });
      setCategoryInput('');
      setSelectedCategoryId(null);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('[Modal] Unexpected error:', err);
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
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-center">
                    <TrendingDown className="text-white" size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Add Expense</h2>
                    <p className="text-xs text-gray-500">Record a new transaction</p>
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
                    placeholder="e.g. Grocery Store"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-sm"
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
                      className="w-full pl-14 pr-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Category combobox */}
                <div ref={categoryRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={categoryInput}
                      onChange={(e) => handleCategoryType(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Select or type a new category"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-sm"
                    />
                    {showSuggestions && (filteredSuggestions.length > 0 || categoryInput) && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredSuggestions.map((cat) => (
                          <button
                            key={cat.category_id}
                            type="button"
                            onClick={() => handleCategorySelect(cat)}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            {cat.category_name}
                          </button>
                        ))}
                        {categoryInput &&
                          !filteredSuggestions.find(
                            (c) => c.category_name.toLowerCase() === categoryInput.toLowerCase()
                          ) && (
                            <button
                              type="button"
                              onClick={() => setShowSuggestions(false)}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors border-t border-gray-100"
                            >
                              + Create &ldquo;{categoryInput}&rdquo;
                            </button>
                          )}
                      </div>
                    )}
                  </div>
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
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-sm"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-sm bg-white"
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
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-sm resize-none"
                  />
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-500 to-rose-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto"
                    />
                  ) : (
                    'Add Expense'
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