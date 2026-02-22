'use client';

import { useEffect, useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
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
      month: d.getMonth() + 1,
    });
  }
  return result;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  
  const income = payload.find((p) => p.name === 'income')?.value ?? 0;
  const expenses = payload.find((p) => p.name === 'expenses')?.value ?? 0;
  const net = income - expenses;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm min-w-[200px]">
      <p className="font-semibold text-gray-800 mb-3">{label}</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            Income
          </span>
          <span className="font-semibold text-emerald-600">
            NRs {income.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
            Expenses
          </span>
          <span className="font-semibold text-orange-600">
            NRs {expenses.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="pt-2 border-t border-gray-100 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs">Net</span>
            <span className={`text-xs font-semibold flex items-center gap-1 ${net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {net >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              NRs {Math.abs(net).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
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
        .split('T')[0];

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

  // Calculate trend for simple indicator
  const getTrend = () => {
    if (data.length < 2) return null;
    const last = data[data.length - 1];
    const prev = data[data.length - 2];
    const diff = last.expenses - prev.expenses;
    if (diff > 0) return { direction: 'up' as const, value: diff };
    if (diff < 0) return { direction: 'down' as const, value: Math.abs(diff) };
    return null;
  };

  const trend = getTrend();

  if (!isLoading && data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Activity size={16} className="text-amber-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Spending Trend</h2>
        </div>
        <div className="h-[180px] flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <Activity size={20} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm font-medium">No data yet</p>
          <p className="text-gray-400 text-xs mt-1">Add income or expenses to see your trend</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100">
            <Activity size={16} className="text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Spending Trend</h2>
            <p className="text-xs text-gray-500 mt-0.5">Last 6 months overview</p>
          </div>
        </div>

        {/* Legend + Trend */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 rounded-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-gray-600 font-medium">Income</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-50 rounded-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
            <span className="text-xs text-gray-600 font-medium">Expenses</span>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
              trend.direction === 'up' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {trend.direction === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trend.direction === 'up' ? '↑' : '↓'} NRs {trend.value.toLocaleString('en-IN')}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-[260px] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 16, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#9ca3af"
              style={{ fontSize: '11px' }}
              tick={{ fill: '#6b7280' }}
              tickMargin={8}
            />
            <YAxis
              tickFormatter={formatYAxis}
              stroke="#9ca3af"
              style={{ fontSize: '11px' }}
              width={44}
              tickMargin={4}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f1f5f9', strokeDasharray: '4 4' }} />
            
            {/* Income Area */}
            <Area
              type="monotone"
              dataKey="income"
              stroke="#34d399"
              strokeWidth={2.5}
              fill="url(#incomeGrad)"
              dot={{ fill: '#34d399', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
              animationDuration={600}
            />
            
            {/* Expenses Area */}
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#f97316"
              strokeWidth={2.5}
              fill="url(#expenseGrad)"
              dot={{ fill: '#f97316', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}