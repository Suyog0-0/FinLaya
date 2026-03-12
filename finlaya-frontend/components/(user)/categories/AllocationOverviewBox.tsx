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

  // Percentages relative to full salary so bar segments sum correctly
  const emiPct    = salary > 0 ? Math.min((emiTotal    / salary) * 100, 100)             : 0;
  const budgetPct = salary > 0 ? Math.min((totalBudget / salary) * 100, 100 - emiPct)    : 0;

  // Allocation status relative to budgetable salary
  const allocatedOfBudgetable = budgetableSalary > 0
    ? (totalBudget / budgetableSalary) * 100
    : 0;
  const isOverBudget = allocatedOfBudgetable > 100;
  const isNearLimit  = allocatedOfBudgetable >= 80 && allocatedOfBudgetable <= 100;

  // Flat bar color — no gradient
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
      valueColor: 'text-gray-900',
      iconColor:  'text-gray-600',
      bg:         'bg-gray-50',
      border:     'border-gray-100',
    },
    {
      label:      'EMIs Reserved',
      value:      formatNRs(emiTotal),
      icon:       CreditCard,
      valueColor: emiTotal > 0 ? 'text-amber-700' : 'text-gray-400',
      iconColor:  emiTotal > 0 ? 'text-amber-600' : 'text-gray-400',
      bg:         emiTotal > 0 ? 'bg-amber-50'    : 'bg-gray-50',
      border:     emiTotal > 0 ? 'border-amber-100' : 'border-gray-100',
    },
    {
      label:      'Total Spent',
      value:      formatNRs(totalSpent),
      icon:       ShoppingBag,
      valueColor: 'text-gray-900',
      iconColor:  'text-red-600',
      bg:         'bg-red-50',
      border:     'border-red-100',
    },
    {
      label:      'Remaining Budget',
      value:      formatNRs(remaining),
      icon:       PiggyBank,
      valueColor: remaining >= 0 ? 'text-emerald-600' : 'text-red-500',
      iconColor:  remaining >= 0 ? 'text-emerald-600' : 'text-red-500',
      bg:         remaining >= 0 ? 'bg-emerald-50'    : 'bg-red-50',
      border:     remaining >= 0 ? 'border-emerald-100' : 'border-red-100',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
            <Target size={18} className="text-amber-600" strokeWidth={2} />
          </div>
          <p className="font-semibold text-gray-900">Allocation Overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${
            isOverBudget ? 'text-red-500' : isNearLimit ? 'text-orange-500' : 'text-emerald-600'
          }`}>
            {Math.round(allocatedOfBudgetable)}% of available budget
          </span>
          <button
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Percentage is calculated against salary minus EMIs"
          >
            <Info size={15} className="text-gray-400 hover:text-gray-600 transition-colors" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>0%</span>
          <span className="font-medium text-gray-600">
            {Math.round(emiPct + budgetPct)}% of salary allocated
          </span>
          <span>100%</span>
        </div>

        {/* Segmented bar */}
        <div
          className="relative w-full h-4 rounded-full overflow-hidden"
          style={{
            background: 'repeating-linear-gradient(90deg, #e5e7eb 0px, #e5e7eb 6px, #f3f4f6 6px, #f3f4f6 12px)',
            border: '1.5px dashed #d1d5db',
          }}
        >
          {/* EMI segment — blue */}
          {emiPct > 0 && (
            <motion.div
              className="absolute top-0 left-0 h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${emiPct}%` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          )}

          {/* Categories segment — starts right after EMI, flat color */}
          {budgetPct > 0 && (
            <motion.div
              className={`absolute top-0 h-full ${getBudgetBarColor()}`}
              style={{ left: `${emiPct}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${budgetPct}%` }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            />
          )}

          {/* White divider between segments */}
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
              <span className="text-xs text-gray-500">EMIs ({Math.round(emiPct)}%)</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${getBudgetBarColor()}`} />
            <span className="text-xs text-gray-500">Categories ({Math.round(budgetPct)}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border border-dashed border-gray-400 bg-gray-100" />
            <span className="text-xs text-gray-400">
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
                <div className="w-9 h-9 rounded-lg bg-white/70 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Icon size={16} className={stat.iconColor} strokeWidth={2} />
                </div>
              </div>
              <p className={`text-lg font-bold ${stat.valueColor} tabular-nums tracking-tight`}>
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 mt-1.5 font-medium">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Over budget warning */}
      {isOverBudget && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-start gap-2 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl"
        >
          <Info size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700 font-medium leading-relaxed">
            Your category budgets exceed your available salary after EMIs. Consider adjusting them to stay on track.
          </p>
        </motion.div>
      )}

      {/* Near limit warning */}
      {isNearLimit && !isOverBudget && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-1.5 text-xs text-orange-600 mt-4 font-medium"
        >
          <Info size={12} />
          You&apos;re close to allocating your full available budget. Leave room for unexpected expenses.
        </motion.p>
      )}
    </div>
  );
}