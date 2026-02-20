'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface CategoryData {
  name: string;
  spent: number;
  limit: number;
  overBudget: boolean;
}

const CustomTooltip = ({
  active,
  payload,
  label,
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
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm min-w-[160px]">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-6">
          <span className="text-gray-500">Spent</span>
          <span className="font-semibold text-orange-600">NRs {spent.toLocaleString('en-IN')}</span>
        </div>
        {limit > 0 && (
          <div className="flex justify-between gap-6">
            <span className="text-gray-500">Budget</span>
            <span className="font-semibold text-blue-600">NRs {limit.toLocaleString('en-IN')}</span>
          </div>
        )}
        {pct !== null && (
          <div className={`text-xs mt-1 font-medium ${pct > 100 ? 'text-red-500' : 'text-green-600'}`}>
            {pct > 100 ? `⚠ ${pct - 100}% over budget` : `${100 - pct}% remaining`}
          </div>
        )}
      </div>
    </div>
  );
};

export default function CategoryBreakdownChart() {
  const { user } = useAuth();
  const [data, setData] = useState<CategoryData[]>([]);
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

      // Sum expenses per category_id
      const spentMap: Record<number, number> = {};
      expenses.forEach((e) => {
        if (e.category_id) {
          spentMap[e.category_id] = (spentMap[e.category_id] || 0) + Number(e.amount);
        }
      });

      // Build chart data — only categories with activity or a limit set
      const chartData: CategoryData[] = categories
        .map((cat) => {
          const spent = spentMap[cat.category_id] || 0;
          // Use budget_limit if set, else fallback to salary * allocation_percentage
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
        .filter((d) => d.spent > 0 || d.limit > 0) // only show relevant categories
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 7); // max 7 bars for readability

      setData(chartData);
      setIsLoading(false);
    };

    fetchData();
  }, [user?.id]);

  const formatValue = (value: number) => {
    if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return String(value);
  };

  if (!isLoading && data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Category Breakdown</h2>
        <p className="text-sm text-gray-500 mb-6">This month&apos;s spending vs budget</p>
        <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
          No expense data for this month yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Category Breakdown</h2>
          <p className="text-sm text-gray-500 mt-0.5">This month&apos;s spending vs budget</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-orange-400" />
            <span className="text-gray-500">Spent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-blue-200" />
            <span className="text-gray-500">Budget</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[260px] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            barCategoryGap="30%"
            barGap={3}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#9ca3af"
              style={{ fontSize: '11px' }}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis
              tickFormatter={formatValue}
              stroke="#9ca3af"
              style={{ fontSize: '11px' }}
              width={38}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Budget limit bars (background) */}
            <Bar dataKey="limit" name="limit" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
            {/* Spent bars (foreground) */}
            <Bar dataKey="spent" name="spent" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.overBudget ? '#ef4444' : '#f97316'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}