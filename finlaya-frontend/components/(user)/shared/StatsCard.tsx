'use client';

import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  LucideIcon,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface StatConfig {
  title: string;
  amount: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeBorder: string;
  dotColor: string;
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
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600',
      badgeBg: 'bg-orange-50',
      badgeBorder: 'border-orange-100',
      dotColor: 'bg-orange-500',
    },
    income: {
      title: 'Monthly Income',
      amount: formatNRS(monthlySalary),
      icon: TrendingUp,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      badgeBg: 'bg-green-50',
      badgeBorder: 'border-green-100',
      dotColor: 'bg-green-500',
    },
    expenses: {
      title: 'Monthly Expenses',
      amount: formatNRS(monthlyExpenses),
      icon: TrendingDown,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      badgeBg: 'bg-red-50',
      badgeBorder: 'border-red-100',
      dotColor: 'bg-red-500',
    },
    savings: {
      title: 'Total Savings',
      amount: formatNRS(savings),
      icon: PiggyBank,
      iconBg: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      badgeBg: 'bg-yellow-50',
      badgeBorder: 'border-yellow-100',
      dotColor: 'bg-yellow-500',
    },
  };

  const stat = statsMap[statId];
  const Icon = stat.icon;
  // Determine trend icon based on stat type (optional logic, kept simple here)
  const isPositive = statId !== 'expenses';
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
        <div className="flex items-start justify-between mb-5">
          <div className="w-12 h-12 rounded-xl bg-gray-100" />
          <div className="w-16 h-6 rounded-full bg-gray-100" />
        </div>
        <div className="space-y-2">
          <div className="w-3/4 h-8 rounded bg-gray-100" />
          <div className="w-1/2 h-4 rounded bg-gray-50" />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 ease-in-out">
      {/* Top Section: Icon & Color Indicator */}
      <div className="flex items-start justify-between mb-5">
        <div className={`p-3 rounded-xl ${stat.iconBg} transition-transform duration-300 group-hover:scale-105`}>
          <Icon size={24} className={stat.iconColor} strokeWidth={2} />
        </div>
        
        {/* Color Badge with Dot Indicator */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${stat.badgeBg} ${stat.badgeBorder}`}>
          <div className={`w-2 h-2 rounded-full ${stat.dotColor} ring-2 ring-white`} />
          <TrendIcon size={14} className={stat.iconColor} strokeWidth={2} />
        </div>
      </div>

      {/* Bottom Section: Amount & Title */}
      <div className="space-y-1">
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight tabular-nums">
          {stat.amount}
        </h3>
        <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
      </div>
      
      {/* Subtle decorative gradient at bottom */}
      <div className={`absolute bottom-0 left-6 right-6 h-1 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${stat.iconBg}`} />
    </div>
  );
}