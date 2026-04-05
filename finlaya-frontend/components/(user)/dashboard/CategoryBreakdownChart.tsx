'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { Target, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface CategoryData {
  name: string;
  spent: number;
  limit: number;
  overBudget: boolean;
}

const CustomTooltip = ({
  active, payload, label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const spent = payload.find((p) => p.name === 'spent')?.value ?? 0;
  const limit = payload.find((p) => p.name === 'limit')?.value ?? 0;
  const pct = limit > 0 ? Math.round((spent / limit) * 100) : null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-4 py-3 text-sm min-w-[180px]">
      <p className="font-semibold text-gray-800 dark:text-gray-100 mb-2 truncate">{label}</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            Spent
          </span>
          <span className="font-semibold text-orange-600 dark:text-orange-400">
            NRs {spent.toLocaleString('en-IN')}
          </span>
        </div>
        {limit > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-300" />
              Budget
            </span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              NRs {limit.toLocaleString('en-IN')}
            </span>
          </div>
        )}
        {pct !== null && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
            <span className={`text-xs font-semibold flex items-center gap-1 ${pct > 100 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
              {pct > 100 ? <AlertCircle size={12} /> : <TrendingUp size={12} />}
              {pct > 100 ? `${pct - 100}% over budget` : `${100 - pct}% remaining`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

function truncateName(name: string, max = 10): string {
  return name.length > max ? name.slice(0, max) + '…' : name;
}

export default function CategoryBreakdownChart() {
  const { user } = useAuth();
  const [data, setData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [catResult, expResult, userResult] = await Promise.all([
      supabase.from('budget_categories')
        .select('category_id, category_name, budget_limit, allocation_percentage')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),
      supabase.from('expenses')
        .select('amount, category_id')
        .eq('user_id', user.id)
        .gte('expense_date', monthStart)
        .lte('expense_date', monthEnd),
      supabase.from('users')
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

    const chartData: CategoryData[] = categories
      .map((cat) => {
        const spent = spentMap[cat.category_id] || 0;
        const limit =
          cat.budget_limit && Number(cat.budget_limit) > 0
            ? Number(cat.budget_limit)
            : monthlySalary * (Number(cat.allocation_percentage) / 100);
        return {
          name: cat.category_name,
          spent: Math.round(spent),
          limit: Math.round(limit),
          overBudget: spent > limit && limit > 0,
        };
      })
      .filter((d) => d.limit > 0 || d.spent > 0);

    setData(chartData);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const id = setInterval(fetchData, 10000);
    return () => clearInterval(id);
  }, [fetchData]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchData();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchData]);

  const formatValue = (value: number) => {
    if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return String(value);
  };

  if (!isLoading && data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <Target size={16} className="text-amber-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Category Breakdown</h2>
        </div>
        <div className="h-[180px] flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Target size={20} className="text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No categories yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Set up budgets to see your breakdown</p>
        </div>
      </div>
    );
  }

  const chartHeight = Math.max(280, data.length * 36);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 flex items-center justify-center">
            <Target size={16} className="text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Category Breakdown</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">This month&apos;s spending vs budget</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Spent</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Budget</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-[280px] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            barCategoryGap="35%"
            barGap={4}
          >
            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#9ca3af"
              style={{ fontSize: '11px' }}
              tick={{ fill: '#6b7280' }}
              tickFormatter={(v) => truncateName(v)}
              tickMargin={8}
            />
            <YAxis
              tickFormatter={formatValue}
              stroke="#9ca3af"
              style={{ fontSize: '11px' }}
              width={42}
              tickMargin={4}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(251, 146, 60, 0.05)' }} />

            <Bar dataKey="limit" name="limit" fill="#bbf7d0" radius={[6, 6, 0, 0]} opacity={0.6} />

            <Bar dataKey="spent" name="spent" radius={[6, 6, 0, 0]} animationDuration={500}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.overBudget ? '#ef4444' : '#f97316'}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}