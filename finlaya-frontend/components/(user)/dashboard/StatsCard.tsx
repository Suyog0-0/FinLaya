'use client';

import { Wallet, TrendingUp, TrendingDown, PiggyBank, LucideIcon } from 'lucide-react';

const statsData: Record<string, {
  title: string;
  amount: string;
  percentage: string;
  isPositive: boolean;
  icon: LucideIcon;
  iconBg: string;
}> = {
  balance: {
    title: 'Total Balance',
    amount: 'NRs 2,400',
    percentage: '+12%',
    isPositive: true,
    icon: Wallet,
    iconBg: 'bg-amber-50',
  },
  income: {
    title: 'Monthly Income',
    amount: 'NRs 1,000',
    percentage: '+5%',
    isPositive: true,
    icon: TrendingUp,
    iconBg: 'bg-green-50',
  },
  expenses: {
    title: 'Monthly Expenses',
    amount: 'NRs 740',
    percentage: '-8%',
    isPositive: false,
    icon: TrendingDown,
    iconBg: 'bg-red-50',
  },
  savings: {
    title: 'Savings',
    amount: 'NRs 2600',
    percentage: '+24%',
    isPositive: true,
    icon: PiggyBank,
    iconBg: 'bg-blue-50',
  },
};

interface StatsCardProps {
  statId: keyof typeof statsData;
}

export default function StatsCard({ statId }: StatsCardProps) {
  const stat = statsData[statId];
  const Icon = stat.icon;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${stat.iconBg}`}>
          <Icon size={24} className="text-orange-600" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-semibold ${
          stat.isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          <span>{stat.isPositive ? '↑' : '↓'}</span>
          <span>{stat.percentage}</span>
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.amount}</h3>
        <p className="text-gray-500 text-sm">{stat.title}</p>
      </div>
    </div>
  );
}