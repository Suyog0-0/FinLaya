'use client';

import { useEffect, useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend } from 'recharts';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface MonthData {
  month: string;
  income: number;
  expenses: number;
}

function getLast6Months(): { label: string; year: number; month: number }[] {
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      label: d.toLocaleString('default', { month: 'short' }),
      year: d.getFullYear(),
      month: d.getMonth() + 1, // 1-indexed
    });
  }
  return result;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500 capitalize">{p.name}:</span>
          <span className="font-semibold text-gray-800">NRs {p.value.toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  );
};

export default function SpendingTrendChart() {
  const { user } = useAuth();
  const [data, setData] = useState<MonthData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      setIsLoading(true);

      const months = getLast6Months();
      const firstMonth = months[0];
      const lastMonth = months[months.length - 1];

      const startDate = `${firstMonth.year}-${String(firstMonth.month).padStart(2, '0')}-01`;
      const endDate = new Date(lastMonth.year, lastMonth.month, 0)
        .toISOString()
        .split('T')[0]; // last day of last month

      const [expResult, incResult] = await Promise.all([
        supabase
          .from('expenses')
          .select('amount, expense_date')
          .eq('user_id', user.id)
          .gte('expense_date', startDate)
          .lte('expense_date', endDate),

        supabase
          .from('income')
          .select('amount, income_date')
          .eq('user_id', user.id)
          .gte('income_date', startDate)
          .lte('income_date', endDate),
      ]);

      // Aggregate by month
      const monthMap: Record<string, { income: number; expenses: number }> = {};
      months.forEach(({ label }) => {
        monthMap[label] = { income: 0, expenses: 0 };
      });

      (expResult.data || []).forEach((e) => {
        const d = new Date(e.expense_date);
        const label = d.toLocaleString('default', { month: 'short' });
        if (monthMap[label] !== undefined) {
          monthMap[label].expenses += Number(e.amount);
        }
      });

      (incResult.data || []).forEach((i) => {
        const d = new Date(i.income_date);
        const label = d.toLocaleString('default', { month: 'short' });
        if (monthMap[label] !== undefined) {
          monthMap[label].income += Number(i.amount);
        }
      });

      const chartData: MonthData[] = months.map(({ label }) => ({
        month: label,
        income: Math.round(monthMap[label].income),
        expenses: Math.round(monthMap[label].expenses),
      }));

      setData(chartData);
      setIsLoading(false);
    };

    fetchData();
  }, [user?.id]);

  const formatYAxis = (value: number) => {
    if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return String(value);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Spending Trend</h2>
          <p className="text-sm text-gray-500 mt-0.5">Last 6 months overview</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-gray-500">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-orange-400" />
            <span className="text-gray-500">Expenses</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[260px] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis tickFormatter={formatYAxis} stroke="#9ca3af" style={{ fontSize: '12px' }} width={40} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#34d399"
              strokeWidth={2.5}
              fill="url(#incomeGrad)"
              dot={{ fill: '#34d399', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#f97316"
              strokeWidth={2.5}
              fill="url(#expenseGrad)"
              dot={{ fill: '#f97316', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}