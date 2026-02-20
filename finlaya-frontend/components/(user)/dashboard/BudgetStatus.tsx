'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface BudgetItem {
  category: string;
  spent: number;
  budget: number;
  color: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Housing: 'bg-orange-400',
  Food: 'bg-amber-400',
  Transportation: 'bg-blue-400',
  Transport: 'bg-blue-400',
  Utilities: 'bg-gray-400',
  Health: 'bg-teal-400',
  Entertainment: 'bg-purple-400',
  Savings: 'bg-green-400',
  Others: 'bg-gray-300',
  Other: 'bg-gray-300',
};

const DEFAULT_COLOR = 'bg-indigo-400';

export default function BudgetStatus() {
  const { user } = useAuth();
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      setIsLoading(true);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      const [catResult, expResult, userResult] = await Promise.all([
        supabase
          .from('budget_categories')
          .select('category_id, category_name, budget_limit, allocation_percentage')
          .eq('user_id', user.id),

        supabase
          .from('expenses')
          .select('amount, category_id')
          .eq('user_id', user.id)
          .gte('expense_date', monthStart)
          .lte('expense_date', monthEnd),

        supabase
          .from('users')
          .select('monthly_salary')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      const monthlySalary = userResult.data ? Number(userResult.data.monthly_salary) : 0;
      const categories = catResult.data || [];
      const expenses = expResult.data || [];

      // Sum expenses per category
      const spentMap: Record<number, number> = {};
      expenses.forEach((e) => {
        if (e.category_id) {
          spentMap[e.category_id] = (spentMap[e.category_id] || 0) + Number(e.amount);
        }
      });

      const budgetItems: BudgetItem[] = categories
        .map((cat) => {
          const spent = spentMap[cat.category_id] || 0;
          const budget =
            cat.budget_limit && Number(cat.budget_limit) > 0
              ? Number(cat.budget_limit)
              : monthlySalary * (Number(cat.allocation_percentage) / 100);

          return {
            category: cat.category_name,
            spent: Math.round(spent),
            budget: Math.round(budget),
            color: CATEGORY_COLORS[cat.category_name] || DEFAULT_COLOR,
          };
        })
        .filter((item) => item.budget > 0) // only show categories with a budget
        .sort((a, b) => b.spent / (b.budget || 1) - a.spent / (a.budget || 1)); // sort by usage %

      setItems(budgetItems);
      setIsLoading(false);
    };

    fetchData();
  }, [user?.id]);

  const getPercentage = (spent: number, budget: number) => {
    if (budget === 0) return 0;
    return Math.min((spent / budget) * 100, 100);
  };

  const getBarColor = (spent: number, budget: number, defaultColor: string) => {
    const pct = budget > 0 ? (spent / budget) * 100 : 0;
    if (pct >= 100) return 'bg-red-500';
    if (pct >= 80) return 'bg-amber-500';
    return defaultColor;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-6" />
        <div className="space-y-5">
          {[...Array(5)].map((_, i) => (
            <div key={i}>
              <div className="flex justify-between mb-2">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Budget Status</h2>
        <p className="text-sm text-gray-400 text-center py-8">No budget categories set up yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Budget Status</h2>
        <span className="text-xs text-gray-400">This month</span>
      </div>

      <div className="space-y-5">
        {items.map((item, index) => {
          const pct = getPercentage(item.spent, item.budget);
          const barColor = getBarColor(item.spent, item.budget, item.color);
          const isOver = item.spent > item.budget;

          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{item.category}</span>
                  {isOver && (
                    <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                      Over
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  NRs {item.spent.toLocaleString('en-IN')} / NRs {item.budget.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-end mt-0.5">
                <span className={`text-xs ${isOver ? 'text-red-500' : 'text-gray-400'}`}>
                  {isOver
                    ? `${Math.round(((item.spent - item.budget) / item.budget) * 100)}% over`
                    : `${Math.round(100 - pct)}% left`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}