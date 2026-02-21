'use client';

import { useEffect, useState, useCallback } from 'react';
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
          <span className="font-semibold text-orange-600">
            NRs {spent.toLocaleString('en-IN')}
          </span>
        </div>
        {limit > 0 && (
          <div className="flex justify-between gap-6">
            <span className="text-gray-500">Budget</span>
            <span className="font-semibold text-blue-600">
              NRs {limit.toLocaleString('en-IN')}
            </span>
          </div>
        )}
        {pct !== null && (
          <div
            className={`text-xs mt-1 font-medium ${
              pct > 100 ? 'text-red-500' : 'text-green-600'
            }`}
          >
            {pct > 100
              ? `⚠ ${pct - 100}% over budget`
              : `${100 - pct}% remaining`}
          </div>
        )}
      </div>
    </div>
  );
};

function truncateName(name: string, max = 9): string {
  return name.length > max ? name.slice(0, max) + '…' : name;
}

export default function CategoryBreakdownChart() {
  const { user } = useAuth();
  const [data, setData] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

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
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),

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

    const monthlySalary = userResult.data
      ? Number(userResult.data.monthly_salary)
      : 0;
    const categories = catResult.data || [];
    const expenses = expResult.data || [];

    const spentMap: Record<number, number> = {};
    expenses.forEach((e) => {
      if (e.category_id) {
        spentMap[e.category_id] =
          (spentMap[e.category_id] || 0) + Number(e.amount);
      }
    });

    // Build a bar for EVERY budget category — including brand-new ones with 0 spending
 
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

  // Initial load
  useEffect(() => {
    (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  // Poll every 10 s — picks up categories added from the Categories page
  // without needing a full page reload or shared global state
  useEffect(() => {
    const id = setInterval(fetchData, 10000);
    return () => clearInterval(id);
  }, [fetchData]);

  // Re-fetch immediately when the user switches back to this tab
  // (e.g. added a category on the Categories page then navigated back)
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
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Category Breakdown</h2>
        <p className="text-sm text-gray-500 mb-6">
          This month&apos;s spending vs budget
        </p>
        <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
          No budget categories set up yet
        </div>
      </div>
    );
  }

  // Grow height so bars stay readable when there are many categories
  const chartHeight = Math.max(260, data.length * 32);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Category Breakdown</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            This month&apos;s spending vs budget
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-orange-400" />
            <span className="text-gray-500">Spent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-green-200" />
            <span className="text-gray-500">Budget</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[260px] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            barCategoryGap="30%"
            barGap={3}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="#9ca3af"
              style={{ fontSize: '11px' }}
              tick={{ fill: '#6b7280' }}
              tickFormatter={(v) => truncateName(v)}
            />
            <YAxis
              tickFormatter={formatValue}
              stroke="#9ca3af"
              style={{ fontSize: '11px' }}
              width={38}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Budget bars (background) */}
            <Bar
              dataKey="limit"
              name="limit"
              fill="#bbf7d0"
              radius={[4, 4, 0, 0]}
            />

            {/* Spent bars (foreground) — orange normally, red if over budget */}
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