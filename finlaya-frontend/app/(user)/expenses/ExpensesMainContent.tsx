'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import AddExpenseModal from '@/components/modals/AddExpenseModal';
import StatsCard from '@/components/(user)/shared/StatsCard';
import TransactionHistory from '@/components/(user)/expenses/TransactionHistory';

interface Transaction {
  expense_id: number;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  category_name: string | null;
}

interface ExpenseRecord {
  expense_id: number;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  budget_categories: Array<{ category_name: string }>;
}

const categoryColors: Record<string, string> = {
  Food: 'bg-orange-100 text-orange-700',
  Income: 'bg-green-100 text-green-700',
  Entertainment: 'bg-purple-100 text-purple-700',
  Utilities: 'bg-gray-200 text-gray-700',
  Transport: 'bg-blue-100 text-blue-700',
  Transportation: 'bg-blue-100 text-blue-700',
  Health: 'bg-teal-100 text-teal-700',
  Housing: 'bg-yellow-100 text-yellow-700',
  Savings: 'bg-green-100 text-green-700',
  Others: 'bg-gray-100 text-gray-600',
};

export default function ExpensesMainContent() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [categories, setCategories] = useState<string[]>(['All Categories']);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [monthlySalary, setMonthlySalary] = useState(0);

  // Fetch expenses and categories
  useEffect(() => {
    const fetchExpenses = async () => {
      if (!user?.id) return;
      setIsLoading(true);

      const { data } = await supabase
        .from('expenses')
        .select(`
          expense_id,
          description,
          amount,
          expense_date,
          payment_method,
          budget_categories (category_name)
        `)
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false });

      const mapped: Transaction[] = ((data as ExpenseRecord[] | null) || []).map((e: ExpenseRecord) => ({
        expense_id: e.expense_id,
        description: e.description,
        amount: e.amount,
        expense_date: e.expense_date,
        payment_method: e.payment_method,
        category_name: Array.isArray(e.budget_categories) && e.budget_categories.length > 0
          ? e.budget_categories[0].category_name
          : null,
      }));

      setTransactions(mapped);

      // Build category list from fetched data
      const unique = Array.from(
        new Set(mapped.map((t) => t.category_name).filter(Boolean))
      ) as string[];
      setCategories(['All Categories', ...unique]);
      setIsLoading(false);
    };

    fetchExpenses();
  }, [user?.id]);

  // Fetch monthly salary from public.users
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('users')
      .select('monthly_salary')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setMonthlySalary(Number(data.monthly_salary));
      });
  }, [user?.id]);

  const totalExpenses = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const netBalance = monthlySalary - totalExpenses;

  const filtered = transactions.filter((t) => {
    const matchSearch = t.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      selectedCategory === 'All Categories' || t.category_name === selectedCategory;
    return matchSearch && matchCategory;
  });

  const handleRefresh = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('expenses')
      .select(`
        expense_id,
        description,
        amount,
        expense_date,
        payment_method,
        budget_categories (category_name)
      `)
      .eq('user_id', user.id)
      .order('expense_date', { ascending: false });

    const mapped: Transaction[] = ((data as ExpenseRecord[] | null) || []).map((e: ExpenseRecord) => ({
      expense_id: e.expense_id,
      description: e.description,
      amount: e.amount,
      expense_date: e.expense_date,
      payment_method: e.payment_method,
      category_name: Array.isArray(e.budget_categories) && e.budget_categories.length > 0
        ? e.budget_categories[0].category_name
        : null,
    }));
    setTransactions(mapped);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
            <p className="text-gray-500 text-sm mt-0.5">Track and manage your expenses</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 rounded-lg font-semibold shadow hover:shadow-md transition-all text-sm"
          >
            <Plus size={16} />
            Add Expense
          </button>
        </div>

        {/* Summary Cards using StatsCard component */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatsCard 
            statId="income" 
            monthlySalary={monthlySalary} 
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

        {/* Transaction History Component */}
        <TransactionHistory
          transactions={transactions}
          filtered={filtered}
          search={search}
          setSearch={setSearch}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          isLoading={isLoading}
          categoryColors={categoryColors}
        />
      </div>

      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}