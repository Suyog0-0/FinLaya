'use client';

import { motion } from 'framer-motion';
import { CreditCard, Calendar, TrendingDown, CheckCircle2 } from 'lucide-react';
import { EMI, EMIPaymentLog, formatNRs, getDaysUntilDue, isPaidThisMonth } from './utils';

interface EMISummaryBoxProps {
  emis: EMI[];
  logs: EMIPaymentLog[];
}

export default function EMISummaryBox({ emis, logs }: EMISummaryBoxProps) {
  const activeEMIs = emis.filter((e) => e.is_active);
  const totalMonthly = activeEMIs.reduce((s, e) => s + e.emi_amount, 0);
  const paidThisMonth = activeEMIs.filter((e) => isPaidThisMonth(e, logs)).length;

  // Find the EMI with the soonest due date
  const nextDue = activeEMIs
    .map((e) => ({ emi: e, days: getDaysUntilDue(e.payment_day) }))
    .filter((x) => x.days !== null)
    .sort((a, b) => (a.days ?? 999) - (b.days ?? 999))[0];

  const stats = [
    {
      label: 'Monthly Burden',
      value: formatNRs(totalMonthly),
      icon: CreditCard,
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      iconColor: 'text-blue-600',
      valueColor: 'text-blue-700',
    },
    {
      label: 'Active Loans',
      value: String(activeEMIs.length),
      icon: TrendingDown,
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      iconColor: 'text-amber-600',
      valueColor: 'text-amber-700',
    },
    {
      label: 'Paid This Month',
      value: `${paidThisMonth} / ${activeEMIs.length}`,
      icon: CheckCircle2,
      bg: paidThisMonth === activeEMIs.length && activeEMIs.length > 0 ? 'bg-emerald-50' : 'bg-gray-50',
      border: paidThisMonth === activeEMIs.length && activeEMIs.length > 0 ? 'border-emerald-100' : 'border-gray-100',
      iconColor: paidThisMonth === activeEMIs.length && activeEMIs.length > 0 ? 'text-emerald-600' : 'text-gray-400',
      valueColor: paidThisMonth === activeEMIs.length && activeEMIs.length > 0 ? 'text-emerald-700' : 'text-gray-600',
    },
    {
      label: 'Next Due In',
      value: nextDue ? `${nextDue.days} days` : '—',
      subLabel: nextDue ? nextDue.emi.loan_name : undefined,
      icon: Calendar,
      bg: nextDue && (nextDue.days ?? 99) <= 3 ? 'bg-red-50' : 'bg-orange-50',
      border: nextDue && (nextDue.days ?? 99) <= 3 ? 'border-red-100' : 'border-orange-100',
      iconColor: nextDue && (nextDue.days ?? 99) <= 3 ? 'text-red-500' : 'text-orange-500',
      valueColor: nextDue && (nextDue.days ?? 99) <= 3 ? 'text-red-600' : 'text-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            className={`${stat.bg} ${stat.border} border rounded-2xl p-5`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500">{stat.label}</p>
              <div className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center">
                <Icon size={15} className={stat.iconColor} />
              </div>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${stat.valueColor}`}>{stat.value}</p>
            {stat.subLabel && (
              <p className="text-xs text-gray-400 mt-1 truncate">{stat.subLabel}</p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}