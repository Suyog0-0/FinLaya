'use client';

import { motion } from 'framer-motion';
import { Wallet, Target, ShoppingBag, PiggyBank, Info, CreditCard } from 'lucide-react';
import { formatNRs } from './utils';

interface AllocationOverviewBoxProps {
  salary: number;
  emiTotal: number;
  totalBudget: number;
  totalSpent: number;
}

export default function AllocationOverviewBox({
  salary,
  emiTotal,
  totalBudget,
  totalSpent,
}: AllocationOverviewBoxProps) {
  const budgetableSalary = Math.max(0, salary - emiTotal);
  const remaining        = budgetableSalary - totalBudget;

  const emiPct    = salary > 0 ? Math.min((emiTotal    / salary) * 100, 100)             : 0;
  const budgetPct = salary > 0 ? Math.min((totalBudget / salary) * 100, 100 - emiPct)    : 0;

  const allocatedOfBudgetable = budgetableSalary > 0
    ? (totalBudget / budgetableSalary) * 100
    : 0;
  const isOverBudget = allocatedOfBudgetable > 100;
  const isNearLimit  = allocatedOfBudgetable >= 80 && allocatedOfBudgetable <= 100;

  const getBudgetBarColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (isNearLimit)  return 'bg-orange-400';
    return 'bg-emerald-500';
  };

  const stats = [
    {
      label:      'Monthly Salary',
      value:      formatNRs(salary),
      icon:       Wallet,
      valueColor: 'text-gray-900 dark:text-gray-100',
      iconColor:  'text-gray-600 dark:text-gray-300',
      bg:         'bg-gray-50 dark:bg-gray-700/50',
      border:     'border-gray-100 dark:border-gray-600',
    },
    {
      label:      'EMIs Reserved',
      value:      formatNRs(emiTotal),
      icon:       CreditCard,
      valueColor: emiTotal > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500',
      iconColor:  emiTotal > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500',
      bg:         emiTotal > 0 ? 'bg-amber-50 dark:bg-amber-900/20'   : 'bg-gray-50 dark:bg-gray-700/50',
      border:     emiTotal > 0 ? 'border-amber-100 dark:border-amber-800' : 'border-gray-100 dark:border-gray-600',
    },
    {
      label:      'Total Spent',
      value:      formatNRs(totalSpent),
      icon:       ShoppingBag,
      valueColor: 'text-gray-900 dark:text-gray-100',
      iconColor:  'text-red-600 dark:text-red-400',
      bg:         'bg-red-50 dark:bg-red-900/20',
      border:     'border-red-100 dark:border-red-800',
    },
    {
      label:      'Remaining Budget',
      value:      formatNRs(remaining),
      icon:       PiggyBank,
      valueColor: remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
      iconColor:  remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
      bg:         remaining >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20'   : 'bg-red-50 dark:bg-red-900/20',
      border:     remaining >= 0 ? 'border-emerald-100 dark:border-emerald-800' : 'border-red-100 dark:border-red-800',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 mb-8 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center border border-amber-100 dark:border-amber-800">
            <Target size={18} className="text-amber-600 dark:text-amber-400" strokeWidth={2} />
          </div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">Allocation Overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${
            isOverBudget ? 'text-red-500' : isNearLimit ? 'text-orange-500' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {Math.round(allocatedOfBudgetable)}% of available budget
          </span>
          <button
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Percentage is calculated against salary minus EMIs"
          >
            <Info size={15} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span>0%</span>
          <span className="font-medium text-gray-600 dark:text-gray-300">
            {Math.round(emiPct + budgetPct)}% of salary allocated
          </span>
          <span>100%</span>
        </div>

        <div
          className="relative w-full h-4 rounded-full overflow-hidden"
          style={{
            background: 'repeating-linear-gradient(90deg, #e5e7eb 0px, #e5e7eb 6px, #f3f4f6 6px, #f3f4f6 12px)',
            border: '1.5px dashed #d1d5db',
          }}
        >
          {emiPct > 0 && (
            <motion.div
              className="absolute top-0 left-0 h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${emiPct}%` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
          {budgetPct > 0 && (
            <motion.div
              className={`absolute top-0 h-full ${getBudgetBarColor()}`}
              style={{ left: `${emiPct}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${budgetPct}%` }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
          {emiPct > 0 && budgetPct > 0 && (
            <div
              className="absolute top-0 h-full w-0.5 bg-white/80 z-10"
              style={{ left: `${emiPct}%` }}
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2">
          {emiTotal > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">EMIs ({Math.round(emiPct)}%)</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${getBudgetBarColor()}`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">Categories ({Math.round(budgetPct)}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border border-dashed border-gray-400 bg-gray-100 dark:bg-gray-600" />
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Unallocated ({Math.max(0, Math.round(100 - emiPct - budgetPct))}%)
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
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
                <div className="w-9 h-9 rounded-lg bg-white/70 dark:bg-gray-800/70 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Icon size={16} className={stat.iconColor} strokeWidth={2} />
                </div>
              </div>
              <p className={`text-lg font-bold ${stat.valueColor} tabular-nums tracking-tight`}>
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Over budget warning */}
      {isOverBudget && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-start gap-2 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl"
        >
          <Info size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700 dark:text-red-400 font-medium leading-relaxed">
            Your category budgets exceed your available salary after EMIs. Consider adjusting them to stay on track.
          </p>
        </motion.div>
      )}

      {/* Near limit warning */}
      {isNearLimit && !isOverBudget && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 mt-4 font-medium"
        >
          <Info size={12} />
          You&apos;re close to allocating your full available budget. Leave room for unexpected expenses.
        </motion.p>
      )}
    </div>
  );
}