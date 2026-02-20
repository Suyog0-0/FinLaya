'use client';

import { Wallet, TrendingUp, TrendingDown, PiggyBank, LucideIcon } from 'lucide-react';

interface StatConfig {
  title: string;
  amount: string;
  icon: LucideIcon;
  iconBg: string;
  isPositive: boolean;
}

interface StatsCardProps {
  statId: 'balance' | 'income' | 'expenses' | 'savings';
  monthlySalary?: number;
  monthlyExpenses?: number;
  savings?: number;
  totalBalance?: number;
  isLoading?: boolean;
}

function formatNRS(value: number): string {
  return `NRs ${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function StatsCard({
  statId,
  monthlySalary = 0,
  monthlyExpenses = 0,
  savings = 0,
  totalBalance = 0,
  isLoading = false,
}: StatsCardProps) {
  const statsMap: Record<string, StatConfig> = {
    balance: {
      title: 'Total Balance',
      amount: formatNRS(totalBalance),
      icon: Wallet,
      iconBg: 'bg-amber-50',
      isPositive: totalBalance >= 0,
    },
    income: {
      title: 'Monthly Income',
      amount: formatNRS(monthlySalary),
      icon: TrendingUp,
      iconBg: 'bg-green-50',
      isPositive: true,
    },
    expenses: {
      title: 'Monthly Expenses',
      amount: formatNRS(monthlyExpenses),
      icon: TrendingDown,
      iconBg: 'bg-red-50',
      isPositive: false,
    },
    savings: {
      title: 'Savings (20%)',
      amount: formatNRS(savings),
      icon: PiggyBank,
      iconBg: 'bg-blue-50',
      isPositive: true,
    },
  };

  const stat = statsMap[statId];
  const Icon = stat.icon;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-gray-200" />
          <div className="w-12 h-4 rounded bg-gray-200" />
        </div>
        <div className="w-24 h-8 rounded bg-gray-200 mb-2" />
        <div className="w-32 h-4 rounded bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${stat.iconBg}`}>
          <Icon size={24} className="text-orange-600" />
        </div>
        <div
          className={`flex items-center gap-1 text-sm font-semibold ${
            stat.isPositive ? 'text-green-600' : 'text-red-600'
          }`}
        >
          <span>{stat.isPositive ? '↑' : '↓'}</span>
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.amount}</h3>
        <p className="text-gray-500 text-sm">{stat.title}</p>
      </div>
    </div>
  );
}