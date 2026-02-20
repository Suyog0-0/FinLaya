'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
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

      // merge, sort by date, take top 5
      const all = [...expenses, ...income]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      setTransactions(all);
      setIsLoading(false);
    };

    fetchData();
  }, [user?.id]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
        <button
          onClick={() => router.push('/expenses')}
          className="text-orange-600 text-sm font-semibold hover:text-orange-700 transition-colors"
        >
          View All →
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded mb-1.5" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">No transactions yet</div>
      ) : (
        <div className="space-y-3">
          {transactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    t.type === 'income' ? 'bg-green-50' : 'bg-orange-50'
                  }`}
                >
                  {t.type === 'income' ? (
                    <ArrowDownLeft className="text-green-500" size={18} />
                  ) : (
                    <ArrowUpRight className="text-orange-500" size={18} />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm leading-tight">{t.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.category ?? (t.type === 'income' ? 'Income' : 'Expense')} · {formatDate(t.date)}
                  </p>
                </div>
              </div>
              <p
                className={`font-semibold text-sm ${
                  t.type === 'income' ? 'text-green-600' : 'text-gray-800'
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