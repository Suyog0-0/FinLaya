'use client';

import { useEffect, useState } from 'react';
import { Target, AlertCircle, Calendar } from 'lucide-react';
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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function BudgetStatus() {
  const { user } = useAuth();
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Date filter state
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  
  // Generate last 5 years for dropdown
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      setIsLoading(true);

      const monthStart = new Date(selectedYear, selectedMonth, 1)
        .toISOString()
        .split('T')[0];
      const monthEnd = new Date(selectedYear, selectedMonth + 1, 0)
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
        .filter((item) => item.budget > 0)
        .sort((a, b) => b.spent / (b.budget || 1) - a.spent / (a.budget || 1));

      setItems(budgetItems);
      setIsLoading(false);
    };

    fetchData();
  }, [user?.id, selectedMonth, selectedYear]);

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

  const getPeriodLabel = () => {
    const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
    if (isCurrentMonth) return 'This month';
    return `${MONTHS[selectedMonth]} ${selectedYear}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-200" />
            <div className="h-5 w-28 bg-gray-200 rounded" />
          </div>
          <div className="h-8 w-32 bg-gray-200 rounded-lg" />
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="flex justify-between mb-2">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      {/* Header with Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100">
            <Target size={16} className="text-amber-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Budget Status</h2>
        </div>

        {/* Month/Year Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 cursor-pointer hover:border-gray-300 transition-colors"
          >
            {MONTHS.map((month, index) => (
              <option key={month} value={index}>
                {month}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 cursor-pointer hover:border-gray-300 transition-colors"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Period Badge */}
      <div className="mb-5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
          <Calendar size={14} className="text-amber-600" />
          <span className="text-sm font-semibold text-amber-700">
            {getPeriodLabel()}
          </span>
        </div>
      </div>

      {/* Budget Items */}
      {items.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <Target size={20} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm font-medium">No expenses this period</p>
          <p className="text-gray-400 text-xs mt-1">Start adding expenses to see your budget</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => {
            const pct = getPercentage(item.spent, item.budget);
            const barColor = getBarColor(item.spent, item.budget, item.color);
            const isOver = item.spent > item.budget;
            const isNearLimit = pct >= 80 && pct < 100;

            return (
              <div key={index} className="group">
                {/* Category Row */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    <span className="text-sm font-medium text-gray-700">{item.category}</span>
                    {isOver && (
                      <span className="flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium border border-red-100">
                        <AlertCircle size={10} />
                        Over
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 tabular-nums">
                    NRs {item.spent.toLocaleString('en-IN')} / {item.budget.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-500 ease-out ${
                      isOver ? 'animate-pulse' : ''
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Helper Text */}
                <div className="flex justify-end mt-1">
                  <span
                    className={`text-xs font-medium ${
                      isOver ? 'text-red-500' : isNearLimit ? 'text-amber-500' : 'text-gray-400'
                    }`}
                  >
                    {isOver
                      ? `⚠ ${Math.round(((item.spent - item.budget) / item.budget) * 100)}% over`
                      : isNearLimit
                      ? `⚡ ${Math.round(100 - pct)}% left`
                      : `${Math.round(100 - pct)}% remaining`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}