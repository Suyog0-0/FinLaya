'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import AddExpenseModal from '@/components/modals/AddExpense/AddExpenseModal';
import AddIncomeModal from '@/components/modals/AddIncome/AddIncomeModal';
import EditTransactionModal from '@/components/modals/EditTransaction/EditTransactionModal';
import StatsCard from '@/components/(user)/shared/StatsCard';
import TransactionHistory from '@/components/(user)/expenses/TransactionHistory';
import SearchFilter from '@/components/(user)/expenses/SearchFilter';

export const dynamic = 'force-static';
export const revalidate = 60; // rebuild every 60 seconds

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

export default function ExpensesMainContent() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [monthlySalary, setMonthlySalary] = useState(0);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    const [expResult, incResult, salaryResult, budgetCatsResult] = await Promise.all([
      supabase
        .from('expenses')
        .select(`
          expense_id,
          description,
          amount,
          expense_date,
          payment_method,
          category_id,
          budget_categories (category_name)
        `)
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false }),

      supabase
        .from('income')
        .select('income_id, description, amount, income_date, payment_method, category_name')
        .eq('user_id', user.id)
        .order('income_date', { ascending: false }),

      supabase
        .from('users')
        .select('monthly_salary')
        .eq('user_id', user.id)
        .maybeSingle(),

      // ✅ Fetch ALL budget categories the user set up (onboarding or manually added)
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
        expense_id: e.expense_id,
        description: e.description,
        amount: e.amount,
        expense_date: e.expense_date,
        payment_method: e.payment_method,
        category_id: e.category_id,
        category_name: categoryName,
        type: 'expense' as const,
      };
    });

    const income: Transaction[] = ((incResult.data as IncomeRecord[] | null) || []).map((i) => ({
      expense_id: i.income_id,
      description: i.description,
      amount: i.amount,
      expense_date: i.income_date,
      payment_method: i.payment_method,
      category_name: i.category_name,
      category_id: null,
      type: 'income' as const,
    }));

    const all = [...expenses, ...income].sort(
      (a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
    );

    // ✅ Always show all budget categories the user has set up,
    //    plus any income categories that appear in transactions.
    //    Merge + deduplicate + sort alphabetically.
    const budgetCategoryNames: string[] = (budgetCatsResult.data || []).map(
      (c: { category_name: string }) => c.category_name
    );

    const transactionCategoryNames: string[] = all
      .map((t) => t.category_name)
      .filter(Boolean) as string[];

    const mergedCategories = Array.from(
      new Set([...budgetCategoryNames, ...transactionCategoryNames])
    ).sort((a, b) => a.localeCompare(b));

    const salary = salaryResult.data ? Number(salaryResult.data.monthly_salary) : 0;
    setTransactions(all);
    setCategories(['All', ...mergedCategories]);
    setMonthlySalary(salary);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    (async () => {
      await fetchAll();
    })();
  }, [fetchAll]);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = monthlySalary + totalIncome - totalExpenses;

  const filtered = transactions.filter((t) => {
    const matchSearch = t.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      selectedCategory === 'All' || t.category_name === selectedCategory;
    return matchSearch && matchCategory;
  });

  const handleDelete = async (id: number, type: 'expense' | 'income') => {
    if (!confirm('Delete this transaction? This cannot be undone.')) return;
    const table = type === 'expense' ? 'expenses' : 'income';
    const col = type === 'expense' ? 'expense_id' : 'income_id';
    await supabase.from(table).delete().eq(col, id).eq('user_id', user?.id);
    fetchAll();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">


        {/* Header  */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              Transactions
              {filtered.length > 0 && (
                <span className="text-xs font-semibold text-gray-700 bg-gray-200 px-2.5 py-1 rounded-full border border-gray-300">
                  {filtered.length}
                </span>
              )}
            </h1>
            <p className="text-gray-500 text-sm mt-1.5">Track your income and expenses</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsIncomeModalOpen(true)}
              className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-200/40 hover:bg-emerald-600 hover:shadow-emerald-300/50 active:scale-[0.98] transition-all duration-200"
            >
              <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={13} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-white">Add Income</span>
            </button>

            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-red-500 text-white font-semibold text-sm shadow-md shadow-red-200/40 hover:bg-red-600 hover:shadow-red-300/50 active:scale-[0.98] transition-all duration-200"
            >
              <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
                <TrendingDown size={13} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-white">Add Expense</span>
            </button>
          </div>
        </div>




        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatsCard
            statId="income"
            monthlySalary={monthlySalary + totalIncome}
            isLoading={isLoading}
          />
          <StatsCard
            statId="expenses"
            monthlyExpenses={totalExpenses}
            isLoading={isLoading}
          />
          <StatsCard
            statId="balance"
            totalBalance={netBalance}
            isLoading={isLoading}
          />
        </div>

        {/* Search + Filter */}
        <SearchFilter
          search={search}
          setSearch={setSearch}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
        />

        {/* Transaction History */}
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
        onSuccess={() => {
          setEditingTransaction(null);
          fetchAll();
        }}
        transaction={editingTransaction}
      />
    </div>
  );
}