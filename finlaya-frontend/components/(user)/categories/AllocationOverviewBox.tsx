'use client';

import { motion } from 'framer-motion';
import { Wallet, Target, ShoppingBag, PiggyBank, Info } from 'lucide-react';
import { formatNRs } from './utils';

interface AllocationOverviewBoxProps {
  salary: number;
  totalBudget: number;
  totalSpent: number;
}

export default function AllocationOverviewBox({
  salary,
  totalBudget,
  totalSpent,
}: AllocationOverviewBoxProps) {
  const remaining = totalBudget - totalSpent;
  const allocatedPct = salary > 0 ? Math.min((totalBudget / salary) * 100, 100) : 0;
  const isOverBudget = allocatedPct >= 100;
  const isNearLimit = allocatedPct >= 80 && allocatedPct < 100;

  const getProgressColor = () => {
    if (isOverBudget) return 'from-red-400 to-red-500';
    if (isNearLimit) return 'from-orange-400 to-red-400';
    return 'from-emerald-400 to-teal-500';
  };

  const getProgressGlow = () => {
    if (isOverBudget) return 'shadow-red-200/50';
    if (isNearLimit) return 'shadow-orange-200/50';
    return 'shadow-emerald-200/50';
  };

  const stats = [
    { 
      label: 'Monthly Salary', 
      value: formatNRs(salary), 
      icon: Wallet,
      valueColor: 'text-gray-900',
      iconColor: 'text-gray-600',
      bg: 'bg-gray-50',
      border: 'border-gray-100'
    },
    { 
      label: 'Total Budget', 
      value: formatNRs(totalBudget), 
      icon: Target,
      valueColor: 'text-gray-900',
      iconColor: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100'
    },
    { 
      label: 'Total Spent', 
      value: formatNRs(totalSpent), 
      icon: ShoppingBag,
      valueColor: 'text-gray-900',
      iconColor: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100'
    },
    {
      label: 'Remaining',
      value: formatNRs(remaining),
      icon: PiggyBank,
      valueColor: remaining >= 0 ? 'text-emerald-600' : 'text-red-500',
      iconColor: remaining >= 0 ? 'text-emerald-600' : 'text-red-500',
      bg: remaining >= 0 ? 'bg-emerald-50' : 'bg-red-50',
      border: remaining >= 0 ? 'border-emerald-100' : 'border-red-100'
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center border border-amber-100">
            <Target size={18} className="text-amber-600" strokeWidth={2} />
          </div>
          <p className="font-semibold text-gray-900">Allocation Overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${isOverBudget ? 'text-red-500' : isNearLimit ? 'text-orange-500' : 'text-emerald-600'}`}>
            {Math.round(allocatedPct)}% allocated
          </span>
          <button 
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Learn more about budget allocation"
            title="This shows what percentage of your salary is allocated to budgets"
          >
            <Info size={15} className="text-gray-400 hover:text-gray-600 transition-colors" />
          </button>
        </div>
      </div>

      {/* Progress Bar with Label */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2.5">
          <span>0%</span>
          <span className="font-medium text-gray-600">{Math.round(allocatedPct)}% of salary allocated</span>
          <span>100%</span>
        </div>
        <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          {/* 100% marker line */}
          <div className="absolute top-0 bottom-0 w-px bg-gray-300/60 z-10" style={{ left: '100%' }} />
          
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${getProgressColor()} shadow-lg ${getProgressGlow()}`}
            initial={{ width: 0 }}
            animate={{ width: `${allocatedPct}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
          
          {/* Subtle inner highlight */}
          <div className="absolute inset-0 rounded-full shadow-[inset_0_1px_3px_rgba(255,255,255,0.4)] pointer-events-none" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              className={`${stat.bg} ${stat.border} border rounded-xl p-4 text-center hover:shadow-sm transition-all cursor-default group`}
            >
              <div className="flex justify-center mb-2.5">
                <div className="w-9 h-9 rounded-lg bg-white/70 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Icon size={16} className={stat.iconColor} strokeWidth={2} />
                </div>
              </div>
              <p className={`text-lg font-bold ${stat.valueColor} tabular-nums tracking-tight`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1.5 font-medium">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Helper text for over budget */}
      {isOverBudget && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-start gap-2 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl"
        >
          <Info size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700 font-medium leading-relaxed">
            You&apos;ve allocated more than your salary. Consider adjusting your category budgets to stay on track.
          </p>
        </motion.div>
      )}

      {/* Helper text for near limit */}
      {isNearLimit && !isOverBudget && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-1.5 text-xs text-orange-600 mt-4 font-medium"
        >
          <Info size={12} />
          You&apos;re close to allocating your full salary. Leave room for unexpected expenses.
        </motion.p>
      )}
    </div>
  );
}