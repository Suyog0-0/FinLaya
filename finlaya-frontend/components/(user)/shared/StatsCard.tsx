'use client';

import { Wallet, TrendingUp, TrendingDown, PiggyBank, LucideIcon } from 'lucide-react';

interface StatsCardProps {
  statId:          'balance' | 'income' | 'expenses' | 'savings';
  monthlySalary?:  number;
  monthlyExpenses?:number;
  savings?:        number;
  totalBalance?:   number;
  isLoading?:      boolean;
}

interface StatConfig {
  title:      string;
  amount:     string;
  icon:       LucideIcon;
  iconColor:  string;
  iconBg:     string;
  valueColor: string;
}

function formatNRS(value: number): string {
  return `NRs ${Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function StatsCard({
  statId,
  monthlySalary   = 0,
  monthlyExpenses = 0,
  savings         = 0,
  totalBalance    = 0,
  isLoading       = false,
}: StatsCardProps) {
  const isNegativeBalance = statId === 'balance' && totalBalance < 0;

  const statsMap: Record<string, StatConfig> = {
    balance: {
      title:      'Total Balance',
      // Show minus sign when negative so the user immediately understands
      amount:     `${isNegativeBalance ? '-' : ''}${formatNRS(totalBalance)}`,
      icon:       Wallet,
      iconColor:  isNegativeBalance ? 'text-red-500'    : 'text-orange-500',
      iconBg:     isNegativeBalance ? 'bg-red-50'       : 'bg-orange-50',
      valueColor: isNegativeBalance ? 'text-red-500'    : 'text-gray-900',
    },
    income: {
      title:      'Monthly Income',
      amount:     formatNRS(monthlySalary),
      icon:       TrendingUp,
      iconColor:  'text-emerald-500',
      iconBg:     'bg-emerald-50',
      valueColor: 'text-gray-900',
    },
    expenses: {
      title:      'Monthly Expenses',
      amount:     formatNRS(monthlyExpenses),
      icon:       TrendingDown,
      iconColor:  'text-red-500',
      iconBg:     'bg-red-50',
      valueColor: 'text-gray-900',
    },
    savings: {
      title:      'Total Savings',
      amount:     formatNRS(savings),
      icon:       PiggyBank,
      iconColor:  'text-amber-500',
      iconBg:     'bg-amber-50',
      valueColor: 'text-gray-900',
    },
  };

  const stat = statsMap[statId];
  const Icon = stat.icon;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
        <div className="w-9 h-9 rounded-xl bg-gray-100 mb-4" />
        <div className="h-7 w-3/4 bg-gray-100 rounded mb-2" />
        <div className="h-4 w-1/2 bg-gray-50 rounded" />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border p-5 hover:shadow-sm transition-all duration-200 ${
      isNegativeBalance ? 'border-red-100' : 'border-gray-100 hover:border-gray-200'
    }`}>
      <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center mb-4`}>
        <Icon size={18} className={stat.iconColor} strokeWidth={2} />
      </div>

      <p className={`text-2xl font-bold ${stat.valueColor} tabular-nums tracking-tight mb-1`}>
        {stat.amount}
      </p>

      <p className="text-sm text-gray-500">{stat.title}</p>

      {/* Small deficit label under the balance card */}
      {isNegativeBalance && (
        <p className="text-xs text-red-400 font-medium mt-1">Deficit this month</p>
      )}
    </div>
  );
}