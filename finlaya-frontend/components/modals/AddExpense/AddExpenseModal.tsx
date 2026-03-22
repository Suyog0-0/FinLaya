'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingDown, Info, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useNotifications } from '@/lib/contexts/NotificationContext';

interface Category {
  category_id:   number;
  category_name: string;
  budget_limit:  number;
  already_spent: number;
}

interface AddExpenseModalProps {
  isOpen:    boolean;
  onClose:   () => void;
  onSuccess: () => void;
}

const paymentMethods = ['Cash', 'Mobile Payment (eSewa/Khalti)'];

export default function AddExpenseModal({ isOpen, onClose, onSuccess }: AddExpenseModalProps) {
  const { user } = useAuth();
  const { refresh } = useNotifications();

  const [categories,       setCategories]       = useState<Category[]>([]);
  const [categoryInput,    setCategoryInput]     = useState('');
  const [showSuggestions,  setShowSuggestions]   = useState(false);
  const [selectedCategory, setSelectedCategory]  = useState<Category | null>(null);
  const [isLoading,        setIsLoading]         = useState(false);
  const [error,            setError]             = useState('');
  const [netBalance,       setNetBalance]        = useState<number | null>(null);
  const [emiExceedsSalary, setEmiExceedsSalary]  = useState(false);

  const categoryRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    title:         '',
    amount:        '',
    date:          new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    notes:         '',
  });

  useEffect(() => {
    if (!user?.id || !isOpen) return;

    const fetchData = async () => {
      const [catRes, userRes, expRes, incRes, emiRes] = await Promise.all([
        supabase.from('budget_categories').select('category_id, category_name, budget_limit').eq('user_id', user.id),
        supabase.from('users').select('monthly_salary').eq('user_id', user.id).maybeSingle(),
        supabase.from('expenses').select('amount, category_id').eq('user_id', user.id),
        supabase.from('income').select('amount').eq('user_id', user.id),
        supabase.from('emi_payments').select('emi_amount').eq('user_id', user.id).eq('is_active', true),
      ]);

      const spentMap: Record<number, number> = {};
      for (const exp of expRes.data || []) {
        if (exp.category_id)
          spentMap[exp.category_id] = (spentMap[exp.category_id] || 0) + Number(exp.amount);
      }

      setCategories((catRes.data || []).map((c) => ({
        category_id:   c.category_id,
        category_name: c.category_name,
        budget_limit:  Number(c.budget_limit),
        already_spent: spentMap[c.category_id] || 0,
      })));

      const salary   = Number(userRes.data?.monthly_salary ?? 0);
      const totalInc = (incRes.data  || []).reduce((s, i) => s + Number(i.amount), 0);
      const totalExp = (expRes.data  || []).reduce((s, e) => s + Number(e.amount), 0);
      const totalEMI = (emiRes.data  || []).reduce((s, e) => s + Number(e.emi_amount), 0);

      setNetBalance(salary + totalInc - totalExp - totalEMI);
      setEmiExceedsSalary(totalEMI > salary + totalInc);
    };

    fetchData();
  }, [user?.id, isOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node))
        setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredSuggestions = categories.filter((c) =>
    c.category_name.toLowerCase().includes(categoryInput.toLowerCase())
  );

  const handleCategorySelect = (cat: Category) => {
    setCategoryInput(cat.category_name);
    setSelectedCategory(cat);
    setShowSuggestions(false);
  };

  const handleCategoryType = (val: string) => {
    setCategoryInput(val);
    setSelectedCategory(null);
    setShowSuggestions(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'amount') setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    const expenseAmount = parseFloat(form.amount);
    if (!expenseAmount || expenseAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let categoryId = selectedCategory?.category_id ?? null;

      if (categoryInput && !selectedCategory) {
        const { data: newCat, error: catError } = await supabase
          .from('budget_categories')
          .insert({
            user_id:               user.id,
            category_name:         categoryInput,
            allocation_percentage: 0,
            budget_limit:          0,
            current_balance:       0,
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

      const { error: expenseError } = await supabase.from('expenses').insert({
        user_id:        user.id,
        category_id:    categoryId,
        amount:         expenseAmount,
        description:    form.title,
        expense_date:   form.date,
        payment_method: form.paymentMethod,
        is_recurring:   false,
      });

      if (expenseError) {
        setError(`Failed to add expense: ${expenseError.message}`);
        setIsLoading(false);
        return;
      }

      // Reset form
      setForm({
        title: '', amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash', notes: '',
      });
      setCategoryInput('');
      setSelectedCategory(null);

      onSuccess();
      onClose();

      // refresh() now handles BOTH bell icon update AND backend email check
      await refresh();

    } catch (err) {
      console.error('[AddExpenseModal]', err);
      setError('Unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const enteredAmount     = parseFloat(form.amount) || 0;
  const isOverBalance     = netBalance !== null && enteredAmount > 0 && enteredAmount > netBalance;
  const balanceIsNegative = netBalance !== null && netBalance < 0;

  const categoryBudgetWarning = (() => {
    if (!selectedCategory || enteredAmount <= 0) return null;
    const { budget_limit, already_spent, category_name } = selectedCategory;
    if (budget_limit <= 0) return null;
    const projected = already_spent + enteredAmount;
    if (projected > budget_limit) {
      const over = projected - budget_limit;
      return `This will exceed your ${category_name} budget by NRs ${over.toLocaleString('en-IN')} (budget: NRs ${budget_limit.toLocaleString('en-IN')}, spent so far: NRs ${already_spent.toLocaleString('en-IN')}).`;
    }
    return null;
  })();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                    <TrendingDown className="text-white" size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Add Expense</h2>
                    {netBalance !== null && (
                      <p className="text-xs text-gray-400">
                        Balance:{' '}
                        <span className={`font-semibold ${balanceIsNegative ? 'text-red-500' : 'text-emerald-600'}`}>
                          NRs {netBalance.toLocaleString('en-IN')}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">

                {emiExceedsSalary && (
                  <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertTriangle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700 font-medium leading-relaxed">
                      Your monthly EMI obligations exceed your income. You are in a deficit.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                  <input
                    type="text" name="title" value={form.title} onChange={handleChange}
                    placeholder="e.g. Grocery Store" required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">NRs</span>
                    <input
                      type="number" name="amount" value={form.amount} onChange={handleChange}
                      placeholder="0.00" required min="0.01" step="0.01"
                      className={`w-full pl-14 pr-4 py-2.5 rounded-lg border text-gray-800 placeholder-gray-400 focus:ring-2 focus:border-transparent outline-none text-sm transition-colors ${
                        isOverBalance ? 'border-amber-300 focus:ring-amber-200 bg-amber-50/30' : 'border-gray-300 focus:ring-red-400'
                      }`}
                    />
                  </div>
                  {isOverBalance && netBalance !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1.5 mt-1.5"
                    >
                      <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />
                      <p className="text-xs text-amber-600 font-medium">
                        {balanceIsNegative
                          ? `Already NRs ${Math.abs(netBalance).toLocaleString('en-IN')} over budget`
                          : `Exceeds available balance of NRs ${netBalance.toLocaleString('en-IN')}`
                        } - expense will still be recorded.
                      </p>
                    </motion.div>
                  )}
                </div>

                <div ref={categoryRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <div className="relative">
                    <input
                      type="text" value={categoryInput}
                      onChange={(e) => handleCategoryType(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Select or type a new category"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-sm"
                    />
                    {showSuggestions && (filteredSuggestions.length > 0 || categoryInput) && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredSuggestions.map((cat) => (
                          <button key={cat.category_id} type="button"
                            onClick={() => handleCategorySelect(cat)}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <span>{cat.category_name}</span>
                            {cat.budget_limit > 0 && (
                              <span className="ml-2 text-xs text-gray-400">
                                NRs {cat.already_spent.toLocaleString('en-IN')} / {cat.budget_limit.toLocaleString('en-IN')}
                              </span>
                            )}
                          </button>
                        ))}
                        {categoryInput && !filteredSuggestions.find(
                          (c) => c.category_name.toLowerCase() === categoryInput.toLowerCase()
                        ) && (
                          <button type="button" onClick={() => setShowSuggestions(false)}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors border-t border-gray-100"
                          >
                            + Create &ldquo;{categoryInput}&rdquo;
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {categoryBudgetWarning && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 mt-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg"
                    >
                      <Info size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-700 font-medium leading-relaxed">{categoryBudgetWarning}</p>
                    </motion.div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                  <input type="date" name="date" value={form.date} onChange={handleChange} required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
                  <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-sm bg-white"
                  >
                    {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Notes <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea name="notes" value={form.notes} onChange={handleChange}
                    placeholder="Any additional details..." rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none text-sm resize-none"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit" disabled={isLoading}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {isLoading ? (
                    <motion.div animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto"
                    />
                  ) : 'Add Expense'}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}