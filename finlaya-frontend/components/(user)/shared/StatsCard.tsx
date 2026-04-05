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
      amount:     `${isNegativeBalance ? '-' : ''}${formatNRS(totalBalance)}`,
      icon:       Wallet,
      iconColor:  isNegativeBalance ? 'text-red-500'    : 'text-orange-500',
      iconBg:     isNegativeBalance ? 'bg-red-50 dark:bg-red-900/20'       : 'bg-orange-50 dark:bg-orange-900/20',
      valueColor: isNegativeBalance ? 'text-red-500'    : 'text-gray-900 dark:text-gray-100',
    },
    income: {
      title:      'Monthly Income',
      amount:     formatNRS(monthlySalary),
      icon:       TrendingUp,
      iconColor:  'text-emerald-500',
      iconBg:     'bg-emerald-50 dark:bg-emerald-900/20',
      valueColor: 'text-gray-900 dark:text-gray-100',
    },
    expenses: {
      title:      'Monthly Expenses',
      amount:     formatNRS(monthlyExpenses),
      icon:       TrendingDown,
      iconColor:  'text-red-500',
      iconBg:     'bg-red-50 dark:bg-red-900/20',
      valueColor: 'text-gray-900 dark:text-gray-100',
    },
    savings: {
      title:      'Total Savings',
      amount:     formatNRS(savings),
      icon:       PiggyBank,
      iconColor:  'text-amber-500',
      iconBg:     'bg-amber-50 dark:bg-amber-900/20',
      valueColor: 'text-gray-900 dark:text-gray-100',
    },
  };

  const stat = statsMap[statId];
  const Icon = stat.icon;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 animate-pulse">
        <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 mb-4" />
        <div className="h-7 w-3/4 bg-gray-100 dark:bg-gray-700 rounded mb-2" />
        <div className="h-4 w-1/2 bg-gray-50 dark:bg-gray-700/60 rounded" />
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border p-5 hover:shadow-sm transition-all duration-200 ${
      isNegativeBalance
        ? 'border-red-100 dark:border-red-900/40'
        : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
    }`}>
      <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center mb-4`}>
        <Icon size={18} className={stat.iconColor} strokeWidth={2} />
      </div>

      <p className={`text-2xl font-bold ${stat.valueColor} tabular-nums tracking-tight mb-1`}>
        {stat.amount}
      </p>

      <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>

      {isNegativeBalance && (
        <p className="text-xs text-red-400 font-medium mt-1">Deficit this month</p>
      )}
    </div>
  );
}