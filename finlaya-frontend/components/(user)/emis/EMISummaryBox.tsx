'use client';

import { motion } from 'framer-motion';
import { CreditCard, Calendar, TrendingDown, CheckCircle2 } from 'lucide-react';
import { EMI, EMIPaymentLog, formatNRs, getDaysUntilDue, isPaidThisMonth } from './utils';

interface EMISummaryBoxProps {
  emis: EMI[];
  logs: EMIPaymentLog[];
}

export default function EMISummaryBox({ emis, logs }: EMISummaryBoxProps) {
  const activeEMIs    = emis.filter((e) => e.is_active);
  const totalMonthly  = activeEMIs.reduce((s, e) => s + e.emi_amount, 0);
  const paidThisMonth = activeEMIs.filter((e) => isPaidThisMonth(e, logs)).length;
  const allPaid       = activeEMIs.length > 0 && paidThisMonth === activeEMIs.length;

  const nextDue = allPaid
    ? null
    : activeEMIs
        .filter((e) => !isPaidThisMonth(e, logs))
        .map((e) => ({ emi: e, days: getDaysUntilDue(e.payment_day) }))
        .filter((x) => x.days !== null)
        .sort((a, b) => (a.days ?? 999) - (b.days ?? 999))[0] ?? null;

  const stats = [
    {
      label:      'Monthly Burden',
      value:      formatNRs(totalMonthly),
      icon:       CreditCard,
      bg:         'bg-blue-50 dark:bg-blue-900/20',
      border:     'border-blue-100 dark:border-blue-800',
      iconColor:  'text-blue-600 dark:text-blue-400',
      valueColor: 'text-blue-700 dark:text-blue-300',
      iconBg:     'bg-white/70 dark:bg-gray-800/70',
    },
    {
      label:      'Active Loans',
      value:      String(activeEMIs.length),
      icon:       TrendingDown,
      bg:         'bg-amber-50 dark:bg-amber-900/20',
      border:     'border-amber-100 dark:border-amber-800',
      iconColor:  'text-amber-600 dark:text-amber-400',
      valueColor: 'text-amber-700 dark:text-amber-300',
      iconBg:     'bg-white/70 dark:bg-gray-800/70',
    },
    {
      label:      'Paid This Month',
      value:      `${paidThisMonth} / ${activeEMIs.length}`,
      icon:       CheckCircle2,
      bg:         allPaid ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-gray-50 dark:bg-gray-700/50',
      border:     allPaid ? 'border-emerald-100 dark:border-emerald-800' : 'border-gray-100 dark:border-gray-600',
      iconColor:  allPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500',
      valueColor: allPaid ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-300',
      iconBg:     'bg-white/70 dark:bg-gray-800/70',
    },
    {
      label:    'Next Due In',
      value:    allPaid
                  ? 'All paid ✓'
                  : nextDue
                    ? `${nextDue.days} days`
                    : '—',
      subLabel: allPaid ? 'No pending EMIs' : nextDue?.emi.loan_name,
      icon:     Calendar,
      bg:       allPaid
                  ? 'bg-emerald-50 dark:bg-emerald-900/20'
                  : nextDue && (nextDue.days ?? 99) <= 3
                    ? 'bg-red-50 dark:bg-red-900/20'
                    : 'bg-orange-50 dark:bg-orange-900/20',
      border:   allPaid
                  ? 'border-emerald-100 dark:border-emerald-800'
                  : nextDue && (nextDue.days ?? 99) <= 3
                    ? 'border-red-100 dark:border-red-800'
                    : 'border-orange-100 dark:border-orange-800',
      iconColor:  allPaid
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : nextDue && (nextDue.days ?? 99) <= 3
                      ? 'text-red-500 dark:text-red-400'
                      : 'text-orange-500 dark:text-orange-400',
      valueColor: allPaid
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : nextDue && (nextDue.days ?? 99) <= 3
                      ? 'text-red-600 dark:text-red-300'
                      : 'text-orange-600 dark:text-orange-300',
      iconBg:     'bg-white/70 dark:bg-gray-800/70',
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
            className={`${stat.bg} ${stat.border} border rounded-2xl p-5 transition-colors`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
              <div className={`w-8 h-8 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                <Icon size={15} className={stat.iconColor} />
              </div>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${stat.valueColor}`}>{stat.value}</p>
            {stat.subLabel && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">{stat.subLabel}</p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}