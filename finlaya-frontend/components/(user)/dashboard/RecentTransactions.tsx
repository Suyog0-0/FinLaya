'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface Transaction {
  id: string;
  title: string;
  category: string | null;
  amount: number;
  date: string;
  type: 'income' | 'expense';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RecentTransactions() {
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      setIsLoading(true);

      const [expResult, incResult] = await Promise.all([
        supabase
          .from('expenses')
          .select(`
            expense_id,
            description,
            amount,
            expense_date,
            budget_categories (category_name)
          `)
          .eq('user_id', user.id)
          .order('expense_date', { ascending: false })
          .limit(10),

        supabase
          .from('income')
          .select('income_id, description, amount, income_date, category_name')
          .eq('user_id', user.id)
          .order('income_date', { ascending: false })
          .limit(10),
      ]);

      const expenses: Transaction[] = ((expResult.data as Array<{
        expense_id: number;
        description: string;
        amount: number;
        expense_date: string;
        budget_categories: { category_name: string } | Array<{ category_name: string }> | null;
      }>) || []).map((e) => {
        const cat = e.budget_categories;
        const categoryName = cat
          ? Array.isArray(cat)
            ? cat[0]?.category_name ?? null
            : (cat as { category_name: string }).category_name ?? null
          : null;
        return {
          id: `exp-${e.expense_id}`,
          title: e.description,
          category: categoryName,
          amount: Number(e.amount),
          date: e.expense_date,
          type: 'expense' as const,
        };
      });

      const income: Transaction[] = ((incResult.data as Array<{
        income_id: number;
        description: string;
        amount: number;
        income_date: string;
        category_name: string | null;
      }>) || []).map((i) => ({
        id: `inc-${i.income_id}`,
        title: i.description,
        category: i.category_name,
        amount: Number(i.amount),
        date: i.income_date,
        type: 'income' as const,
      }));

      const all = [...expenses, ...income]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      setTransactions(all);
      setIsLoading(false);
    };

    fetchData();
  }, [user?.id]);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
        <button
          onClick={() => router.push('/expenses')}
          className="text-sm font-semibold text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-all"
        >
          View All →
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        /* Empty State */
        <div className="text-center py-10">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <Clock size={20} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm font-medium">No transactions yet</p>
          <p className="text-gray-400 text-xs mt-1">Start adding to see them here</p>
        </div>
      ) : (
        /* Transaction List */
        <div className="space-y-1">
          {transactions.map((t) => (
            <div
              key={t.id}
              className="group flex items-center justify-between py-3 px-3 rounded-xl hover:bg-gray-50 transition-colors cursor-default"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    t.type === 'income' ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  {t.type === 'expense' ? (
                    <ArrowDownLeft className="text-red-500" size={18} strokeWidth={2} />
                  ) : (
                    <ArrowUpRight className="text-green-500" size={18} strokeWidth={2} />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{t.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {/* Category Badge */}
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-medium">
                      {t.category ?? (t.type === 'income' ? 'Income' : 'Expense')}
                    </span>
                    {/* Date */}
                    <span className="text-xs text-gray-400">{formatDate(t.date)}</span>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <p
                className={`font-semibold text-sm tabular-nums flex-shrink-0 ${
                  t.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {t.type === 'income' ? '+' : '-'}NRs {t.amount.toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}