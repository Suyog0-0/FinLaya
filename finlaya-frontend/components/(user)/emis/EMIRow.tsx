'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, CheckCircle2, Circle, ChevronDown, ChevronUp, Calendar, TrendingDown } from 'lucide-react';
import {
  EMI,
  EMIPaymentLog,
  formatNRs,
  getProgressPct,
  getPaidInstallments,
  getTotalInstallments,
  getDaysUntilDue,
  isPaidThisMonth,
} from './utils';

interface EMIRowProps {
  emi: EMI;
  logs: EMIPaymentLog[];
  onEdit: (emi: EMI) => void;
  onDelete: (id: number) => void;
  onTogglePaid: (emi: EMI) => void;
}

export default function EMIRow({ emi, logs, onEdit, onDelete, onTogglePaid }: EMIRowProps) {
  const [expanded, setExpanded] = useState(false);

  const progressPct = getProgressPct(emi, logs);
  const paidCount = getPaidInstallments(emi, logs);
  const totalCount = getTotalInstallments(emi);
  const daysUntilDue = getDaysUntilDue(emi.payment_day);
  const paidNow = isPaidThisMonth(emi, logs);
  const amountPaid = paidCount * emi.emi_amount;
  const amountRemaining = Math.max(0, emi.total_amount - amountPaid);

  const getDueBadge = () => {
    if (paidNow) return { text: 'Paid', bg: 'bg-emerald-100', text_color: 'text-emerald-700' };
    if (daysUntilDue === null) return null;
    if (daysUntilDue <= 0) return { text: 'Due Today', bg: 'bg-red-100', text_color: 'text-red-700' };
    if (daysUntilDue <= 3) return { text: `Due in ${daysUntilDue}d`, bg: 'bg-red-50', text_color: 'text-red-600' };
    if (daysUntilDue <= 7) return { text: `Due in ${daysUntilDue}d`, bg: 'bg-orange-50', text_color: 'text-orange-600' };
    return { text: `Due in ${daysUntilDue}d`, bg: 'bg-gray-100', text_color: 'text-gray-500' };
  };

  const dueBadge = getDueBadge();

  const getProgressColor = () => {
    if (progressPct >= 100) return 'bg-emerald-500';
    if (progressPct >= 60) return 'bg-blue-500';
    if (progressPct >= 30) return 'bg-amber-500';
    return 'bg-orange-400';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`bg-white border rounded-2xl overflow-hidden transition-all ${
        paidNow ? 'border-emerald-100' : 'border-gray-100'
      } hover:shadow-sm`}
    >
      {/* Main row */}
      <div className="flex items-center gap-4 px-5 py-4">

        {/* Paid toggle */}
        <button
          onClick={() => onTogglePaid(emi)}
          className="flex-shrink-0 transition-transform hover:scale-110"
          title={paidNow ? 'Mark as unpaid' : 'Mark as paid this month'}
        >
          {paidNow ? (
            <CheckCircle2 size={22} className="text-emerald-500" />
          ) : (
            <Circle size={22} className="text-gray-300 hover:text-blue-400 transition-colors" />
          )}
        </button>

        {/* Loan name + badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold text-sm ${paidNow ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
              {emi.loan_name}
            </span>
            {dueBadge && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dueBadge.bg} ${dueBadge.text_color}`}>
                {dueBadge.text}
              </span>
            )}
          </div>
          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${getProgressColor()}`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs text-gray-400 tabular-nums flex-shrink-0">{progressPct}%</span>
          </div>
        </div>

        {/* EMI amount */}
        <div className="text-right flex-shrink-0 hidden sm:block">
          <p className="text-sm font-bold text-gray-800 tabular-nums">{formatNRs(emi.emi_amount)}</p>
          <p className="text-xs text-gray-400">/month</p>
        </div>

        {/* Installments */}
        <div className="text-right flex-shrink-0 hidden md:block">
          <p className="text-sm font-semibold text-gray-700 tabular-nums">
            {paidCount}<span className="text-gray-300 font-normal">/{totalCount}</span>
          </p>
          <p className="text-xs text-gray-400">paid</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(emi)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(emi.emi_id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded detail panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pt-1 border-t border-gray-50">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Total Loan</p>
                  <p className="text-sm font-bold text-gray-800 tabular-nums">{formatNRs(emi.total_amount)}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Amount Paid</p>
                  <p className="text-sm font-bold text-blue-700 tabular-nums">{formatNRs(amountPaid)}</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Remaining</p>
                  <p className="text-sm font-bold text-orange-600 tabular-nums">{formatNRs(amountRemaining)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <Calendar size={10} /> Due Day
                  </p>
                  <p className="text-sm font-bold text-gray-800">
                    {emi.payment_day ? `${emi.payment_day}th` : '—'}
                  </p>
                </div>
              </div>

              {/* Remaining installments hint */}
              {totalCount > 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <TrendingDown size={12} />
                  <span>
                    {totalCount - paidCount > 0
                      ? `${totalCount - paidCount} installments remaining`
                      : 'Loan fully paid off 🎉'}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}