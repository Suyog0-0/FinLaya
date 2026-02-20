'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface Category {
  category_id: number;
  category_name: string;
}

interface Transaction {
  expense_id: number;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  category_name: string | null;
  category_id?: number | null;
  type: 'expense' | 'income';
}

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction: Transaction | null;
}

const expensePaymentMethods = ['Cash', 'Mobile Payment (eSewa/Khalti)'];
const incomePaymentMethods = ['Bank Transfer', 'Cash', 'Mobile Payment (eSewa/Khalti)', 'Cheque'];
const incomeCategories = ['Salary', 'Freelance', 'Business', 'Investment', 'Rental', 'Gift', 'Bonus', 'Other'];

export default function EditTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  transaction,
}: EditTransactionModalProps) {
  const { user } = useAuth();
  const isIncome = transaction?.type === 'income';

  // Expense-only state
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const categoryRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    amount: '',
    date: '',
    paymentMethod: 'Cash',
    incomeCategory: 'Salary',
  });

  // Pre-fill form when transaction changes
  useEffect(() => {
    if (!transaction) return;
    setForm({
      title: transaction.description || '',
      amount: String(transaction.amount),
      date: transaction.expense_date,
      paymentMethod: transaction.payment_method || 'Cash',
      incomeCategory: transaction.category_name || 'Salary',
    });
    setCategoryInput(transaction.category_name || '');
    setSelectedCategoryId(transaction.category_id ?? null);
    setError('');
  }, [transaction]);

  // Fetch expense categories for combobox (only needed for expenses)
  useEffect(() => {
    if (!user?.id || !isOpen || isIncome) return;
    supabase
      .from('budget_categories')
      .select('category_id, category_name')
      .eq('user_id', user.id)
      .then(({ data }) => setExpenseCategories(data || []));
  }, [user?.id, isOpen, isIncome]);

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

  const filteredSuggestions = expenseCategories.filter((c) =>
    c.category_name.toLowerCase().includes(categoryInput.toLowerCase())
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !transaction) return;

    setIsLoading(true);
    setError('');

    try {
      if (isIncome) {
        const { error: updateError } = await supabase
          .from('income')
          .update({
            description: form.title,
            amount: parseFloat(form.amount),
            category_name: form.incomeCategory,
            income_date: form.date,
            payment_method: form.paymentMethod,
            updated_at: new Date().toISOString(),
          })
          .eq('income_id', transaction.expense_id)
          .eq('user_id', user.id);

        if (updateError) {
          setError(`Failed to update income: ${updateError.message}`);
          setIsLoading(false);
          return;
        }
      } else {
        let categoryId = selectedCategoryId;

        if (categoryInput && !selectedCategoryId) {
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

          if (catError) {
            setError(`Failed to create category: ${catError.message}`);
            setIsLoading(false);
            return;
          }
          categoryId = newCat.category_id;
        }

        const { error: updateError } = await supabase
          .from('expenses')
          .update({
            description: form.title,
            amount: parseFloat(form.amount),
            category_id: categoryId,
            expense_date: form.date,
            payment_method: form.paymentMethod,
            updated_at: new Date().toISOString(),
          })
          .eq('expense_id', transaction.expense_id)
          .eq('user_id', user.id);

        if (updateError) {
          setError(`Failed to update expense: ${updateError.message}`);
          setIsLoading(false);
          return;
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('[EditTransactionModal] error:', err);
      setError('Unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const accentColor = isIncome ? 'from-emerald-500 to-green-500' : 'from-blue-500 to-indigo-500';
  const ringColor = isIncome ? 'focus:ring-green-400' : 'focus:ring-blue-400';
  const paymentMethods = isIncome ? incomePaymentMethods : expensePaymentMethods;

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
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${accentColor} flex items-center justify-center`}>
                    <Pencil className="text-white" size={16} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Edit {isIncome ? 'Income' : 'Expense'}
                    </h2>
                    <p className="text-xs text-gray-500">Update transaction details</p>
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
                    required
                    className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 ${ringColor} focus:ring-2 focus:border-transparent outline-none text-sm`}
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
                      required
                      min="0"
                      step="0.01"
                      className={`w-full pl-14 pr-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 ${ringColor} focus:ring-2 focus:border-transparent outline-none text-sm`}
                    />
                  </div>
                </div>

                {/* Category — dropdown for income, combobox for expense */}
                <div ref={isIncome ? undefined : categoryRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  {isIncome ? (
                    <select
                      name="incomeCategory"
                      value={form.incomeCategory}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 ${ringColor} focus:ring-2 focus:border-transparent outline-none text-sm bg-white`}
                    >
                      {incomeCategories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={categoryInput}
                        onChange={(e) => {
                          setCategoryInput(e.target.value);
                          setSelectedCategoryId(null);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Select or type a category"
                        className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 ${ringColor} focus:ring-2 focus:border-transparent outline-none text-sm`}
                      />
                      {showSuggestions && filteredSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredSuggestions.map((cat) => (
                            <button
                              key={cat.category_id}
                              type="button"
                              onClick={() => {
                                setCategoryInput(cat.category_name);
                                setSelectedCategoryId(cat.category_id);
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              {cat.category_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
                    className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 ${ringColor} focus:ring-2 focus:border-transparent outline-none text-sm`}
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 ${ringColor} focus:ring-2 focus:border-transparent outline-none text-sm bg-white`}
                  >
                    {paymentMethods.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-gradient-to-r ${accentColor} text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed mt-2`}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto"
                    />
                  ) : (
                    'Save Changes'
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