'use client';

import { motion } from 'framer-motion';
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

  const stats = [
    { label: 'Monthly Salary', value: formatNRs(salary), color: 'text-gray-900' },
    { label: 'Total Budget', value: formatNRs(totalBudget), color: 'text-gray-900' },
    { label: 'Total Spent', value: formatNRs(totalSpent), color: 'text-gray-900' },
    {
      label: 'Remaining',
      value: formatNRs(remaining),
      color: remaining >= 0 ? 'text-green-600' : 'text-red-500',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-gray-700">Allocation Overview</p>
        <span
          className={`text-sm font-semibold ${
            allocatedPct >= 100 ? 'text-red-500' : 'text-orange-500'
          }`}
        >
          {Math.round(allocatedPct)}% of salary
        </span>
      </div>

      {/* Allocation bar */}
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
        <motion.div
          className={`h-full rounded-full ${
            allocatedPct >= 100
              ? 'bg-red-500'
              : 'bg-gradient-to-r from-amber-400 to-orange-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${allocatedPct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* 4 summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}