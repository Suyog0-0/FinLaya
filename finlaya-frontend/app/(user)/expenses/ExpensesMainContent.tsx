'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import AddExpenseModal from '@/components/modals/AddExpense/AddExpenseModal';
import AddIncomeModal from '@/components/modals/AddIncome/AddIncomeModal';
import EditTransactionModal from '@/components/modals/EditTransaction/EditTransactionModal';
import StatsCard from '@/components/(user)/shared/StatsCard';
import TransactionHistory from '@/components/(user)/expenses/TransactionHistory';
import SearchFilter from '@/components/(user)/expenses/SearchFilter';

export const dynamic = 'force-static';
export const revalidate = 60;

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

interface ExpenseRecord {
  expense_id: number;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  category_id: number | null;
  budget_categories: { category_name: string } | Array<{ category_name: string }> | null;
}

interface IncomeRecord {
  income_id: number;
  description: string;
  amount: number;
  income_date: string;
  payment_method: string;
  category_name: string | null;
}

const categoryColors: Record<string, string> = {
  Food: 'bg-orange-100 text-orange-700',
  Income: 'bg-green-100 text-green-700',
  Salary: 'bg-green-100 text-green-700',
  Freelance: 'bg-teal-100 text-teal-700',
  Business: 'bg-cyan-100 text-cyan-700',
  Investment: 'bg-blue-100 text-blue-700',
  Rental: 'bg-violet-100 text-violet-700',
  Bonus: 'bg-emerald-100 text-emerald-700',
  Entertainment: 'bg-purple-100 text-purple-700',
  Utilities: 'bg-gray-200 text-gray-700',
  Transport: 'bg-blue-100 text-blue-700',
  Transportation: 'bg-blue-100 text-blue-700',
  Health: 'bg-teal-100 text-teal-700',
  Housing: 'bg-yellow-100 text-yellow-700',
  Savings: 'bg-green-100 text-green-700',
  Others: 'bg-gray-100 text-gray-600',
  Gift: 'bg-pink-100 text-pink-700',
  Other: 'bg-gray-100 text-gray-600',
};

const MONTHS = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
];

export default function ExpensesMainContent() {
  const { user } = useAuth();

  // ── Month / year filter — defaults to current month ──────────────────────
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  // ── Data state ────────────────────────────────────────────────────────────
  const [transactions,       setTransactions]       = useState<Transaction[]>([]);
  const [search,             setSearch]             = useState('');
  const [selectedCategory,   setSelectedCategory]   = useState('All');
  const [categories,         setCategories]         = useState<string[]>(['All']);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen,  setIsIncomeModalOpen]  = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isLoading,          setIsLoading]          = useState(true);
  const [monthlySalary,      setMonthlySalary]      = useState(0);

  // ── Fetch — scoped to selected month/year ────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    const monthStart = new Date(selectedYear, selectedMonth, 1)
      .toISOString().split('T')[0];
    const monthEnd = new Date(selectedYear, selectedMonth + 1, 0)
      .toISOString().split('T')[0];

    const [expResult, incResult, salaryResult, budgetCatsResult] = await Promise.all([
      supabase
        .from('expenses')
        .select(`
          expense_id, description, amount, expense_date,
          payment_method, category_id,
          budget_categories (category_name)
        `)
        .eq('user_id', user.id)
        .gte('expense_date', monthStart)
        .lte('expense_date', monthEnd)
        .order('expense_date', { ascending: false }),

      supabase
        .from('income')
        .select('income_id, description, amount, income_date, payment_method, category_name')
        .eq('user_id', user.id)
        .gte('income_date', monthStart)
        .lte('income_date', monthEnd)
        .order('income_date', { ascending: false }),

      supabase
        .from('users')
        .select('monthly_salary')
        .eq('user_id', user.id)
        .maybeSingle(),

      supabase
        .from('budget_categories')
        .select('category_name')
        .eq('user_id', user.id)
        .order('category_name', { ascending: true }),
    ]);

    const expenses: Transaction[] = ((expResult.data as ExpenseRecord[] | null) || []).map((e) => {
      const cat = e.budget_categories;
      const categoryName = cat
        ? Array.isArray(cat)
          ? cat[0]?.category_name ?? null
          : (cat as { category_name: string }).category_name ?? null
        : null;
      return {
        expense_id: e.expense_id, description: e.description, amount: e.amount,
        expense_date: e.expense_date, payment_method: e.payment_method,
        category_id: e.category_id, category_name: categoryName, type: 'expense' as const,
      };
    });

    const income: Transaction[] = ((incResult.data as IncomeRecord[] | null) || []).map((i) => ({
      expense_id: i.income_id, description: i.description, amount: i.amount,
      expense_date: i.income_date, payment_method: i.payment_method,
      category_name: i.category_name, category_id: null, type: 'income' as const,
    }));

    const all = [...expenses, ...income].sort(
      (a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
    );

    const budgetCategoryNames = (budgetCatsResult.data || []).map(
      (c: { category_name: string }) => c.category_name
    );
    const transactionCategoryNames = all.map((t) => t.category_name).filter(Boolean) as string[];
    const mergedCategories = Array.from(
      new Set([...budgetCategoryNames, ...transactionCategoryNames])
    ).sort((a, b) => a.localeCompare(b));

    setTransactions(all);
    setCategories(['All', ...mergedCategories]);
    setMonthlySalary(Number(salaryResult.data?.monthly_salary ?? 0));
    setIsLoading(false);
  }, [user, selectedMonth, selectedYear]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived totals — correctly scoped to selected month ──────────────────
  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = monthlySalary + totalIncome - totalExpenses;

  // ── Search + category filter (client-side) ────────────────────────────────
  const filtered = transactions.filter((t) => {
    const matchSearch   = t.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'All' || t.category_name === selectedCategory;
    return matchSearch && matchCategory;
  });

  const handleDelete = async (id: number, type: 'expense' | 'income') => {
    const table = type === 'expense' ? 'expenses' : 'income';
    const col   = type === 'expense' ? 'expense_id' : 'income_id';
    await supabase.from(table).delete().eq(col, id).eq('user_id', user?.id);
    fetchAll();
  };

  const isCurrentMonth =
    selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
  const periodLabel = isCurrentMonth
    ? 'This month'
    : `${MONTHS[selectedMonth]} ${selectedYear}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">

          {/* Title + dropdowns */}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>

              {/* Month dropdown */}
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl px-3 py-1.5 pr-7 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 cursor-pointer transition-all shadow-sm"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Year dropdown */}
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl px-3 py-1.5 pr-7 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 cursor-pointer transition-all shadow-sm"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Period badge + count */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-medium text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md">
                {periodLabel}
              </span>
              {!isLoading && (
                <span className="text-xs text-gray-400">
                  {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons — icon + short label, compact */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsIncomeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              <TrendingUp size={14} strokeWidth={2.5} />
              Income
            </button>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              <TrendingDown size={14} strokeWidth={2.5} />
              Expense
            </button>
          </div>
        </div>

        {/* ── Stats cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatsCard statId="income"   monthlySalary={monthlySalary + totalIncome} isLoading={isLoading} />
          <StatsCard statId="expenses" monthlyExpenses={totalExpenses}             isLoading={isLoading} />
          <StatsCard statId="balance"  totalBalance={netBalance}                   isLoading={isLoading} />
        </div>

        {/* ── Search + category filter ────────────────────────────────────── */}
        <SearchFilter
          search={search}
          setSearch={setSearch}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
        />

        {/* ── Transaction list ────────────────────────────────────────────── */}
        <TransactionHistory
          filtered={filtered}
          isLoading={isLoading}
          categoryColors={categoryColors}
          onEdit={(t) => setEditingTransaction(t)}
          onDelete={handleDelete}
        />
      </div>

      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={fetchAll}
      />
      <AddIncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onSuccess={fetchAll}
      />
      <EditTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSuccess={() => { setEditingTransaction(null); fetchAll(); }}
        transaction={editingTransaction}
      />
    </div>
  );
}