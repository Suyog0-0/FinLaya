'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Pencil, Trash2, CheckCircle2, Circle,
  ChevronDown, ChevronUp, Calendar, TrendingDown,
} from 'lucide-react';
import {
  EMI, EMIPaymentLog, formatNRs,
  getProgressPct, getPaidInstallments, getTotalInstallments,
  getDaysUntilDue, isPaidThisMonth,
} from './utils';

interface EMITableProps {
  emis: EMI[];
  logs: EMIPaymentLog[];
  onEdit: (emi: EMI) => void;
  onDelete: (id: number) => void;
  // BUG FIX: alreadyPaid is passed alongside emi so the parent never has to
  // re-derive it from a potentially stale logs closure.
  onTogglePaid: (emi: EMI, alreadyPaid: boolean) => void;
  onAdd: () => void;
}

function DueBadge({ emi, logs }: { emi: EMI; logs: EMIPaymentLog[] }) {
  const paidNow      = isPaidThisMonth(emi, logs);
  const daysUntilDue = getDaysUntilDue(emi.payment_day);

  if (paidNow)
    return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Paid</span>;
  if (daysUntilDue === null) return null;
  if (daysUntilDue <= 0)
    return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">Due Today</span>;
  if (daysUntilDue <= 3)
    return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">Due in {daysUntilDue}d</span>;
  if (daysUntilDue <= 7)
    return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">Due in {daysUntilDue}d</span>;
  return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Due in {daysUntilDue}d</span>;
}

function ExpandedRow({ emi, logs }: { emi: EMI; logs: EMIPaymentLog[] }) {
  const paidCount       = getPaidInstallments(emi, logs);
  const totalCount      = getTotalInstallments(emi);
  const amountPaid      = paidCount * emi.emi_amount;
  const amountRemaining = Math.max(0, emi.total_amount - amountPaid);
  const progressPct     = getProgressPct(emi, logs);

  return (
    <motion.tr
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <td colSpan={6} className="px-0 pb-0">
        <div className="mx-4 mb-4 bg-gray-50 rounded-2xl p-5 border border-gray-100">

          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Payoff Progress</span>
              <span className="font-semibold text-gray-700">{progressPct}% complete</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  progressPct >= 100 ? 'bg-emerald-500' :
                  progressPct >= 60  ? 'bg-blue-500'    :
                  progressPct >= 30  ? 'bg-amber-500'   : 'bg-orange-400'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{paidCount} of {totalCount} installments paid</span>
              <span>{totalCount - paidCount > 0 ? `${totalCount - paidCount} remaining` : '🎉 Fully paid off!'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">Total Loan</p>
              <p className="text-sm font-bold text-gray-800 tabular-nums">{formatNRs(emi.total_amount)}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-blue-100">
              <p className="text-xs text-gray-400 mb-1">Amount Paid</p>
              <p className="text-sm font-bold text-blue-600 tabular-nums">{formatNRs(amountPaid)}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-orange-100">
              <p className="text-xs text-gray-400 mb-1">Remaining</p>
              <p className="text-sm font-bold text-orange-500 tabular-nums">{formatNRs(amountRemaining)}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <Calendar size={10} /> Due Day
              </p>
              <p className="text-sm font-bold text-gray-700">
                {emi.payment_day ? `${emi.payment_day}th of month` : '—'}
              </p>
            </div>
          </div>

          {emi.start_date && (
            <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
              <TrendingDown size={11} />
              Started {new Date(emi.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

export default function EMITable({ emis, logs, onEdit, onDelete, onTogglePaid, onAdd }: EMITableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (emis.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
          <CreditCard size={24} className="text-blue-300" />
        </div>
        <p className="font-semibold text-gray-500 mb-1">No loans yet</p>
        <p className="text-sm text-gray-400 mb-5">Add your first EMI to start tracking</p>
        <button
          onClick={onAdd}
          className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Add Loan
        </button>
      </div>
    );
  }

  // Sort: unpaid + soonest due first, paid last
  const monthStr = new Date().toISOString().slice(0, 7);
  const sorted = [...emis].sort((a, b) => {
    const aPaid = logs.some((l) => l.emi_id === a.emi_id && l.paid_month.startsWith(monthStr));
    const bPaid = logs.some((l) => l.emi_id === b.emi_id && l.paid_month.startsWith(monthStr));
    if (aPaid !== bPaid) return aPaid ? 1 : -1;
    return (a.payment_day ?? 99) - (b.payment_day ?? 99);
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5 w-10" />
            <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3.5">Loan</th>
            <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3.5 hidden sm:table-cell">Monthly EMI</th>
            <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Paid</th>
            <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell w-36">Status</th>
            <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Actions</th>
          </tr>
        </thead>

        <tbody>
          {sorted.map((emi) => {
            // paidNow is computed HERE from the fresh `logs` prop —
            // passed straight to onTogglePaid so the parent never re-derives it.
            const paidNow     = isPaidThisMonth(emi, logs);
            const paidCount   = getPaidInstallments(emi, logs);
            const totalCount  = getTotalInstallments(emi);
            const progressPct = getProgressPct(emi, logs);
            const isExpanded  = expandedId === emi.emi_id;

            return (
              <React.Fragment key={emi.emi_id}>
                <tr
                  className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer ${isExpanded ? 'bg-gray-50/60' : ''}`}
                  onClick={() => setExpandedId(isExpanded ? null : emi.emi_id)}
                >
                  {/* Paid toggle — stopPropagation so row expand doesn't fire */}
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onTogglePaid(emi, paidNow)}
                      className="flex-shrink-0 transition-transform hover:scale-110"
                      title={paidNow ? 'Mark as unpaid' : 'Mark as paid this month'}
                    >
                      {paidNow
                        ? <CheckCircle2 size={20} className="text-emerald-500" />
                        : <Circle size={20} className="text-gray-300 hover:text-blue-400 transition-colors" />
                      }
                    </button>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-sm ${paidNow ? 'text-gray-400' : 'text-gray-800'}`}>
                        {emi.loan_name}
                      </span>
                      <span className="text-xs text-gray-400 sm:hidden">{progressPct}%</span>
                    </div>
                    <div className="mt-1.5 w-32 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          progressPct >= 100 ? 'bg-emerald-500' :
                          progressPct >= 60  ? 'bg-blue-500'    :
                          progressPct >= 30  ? 'bg-amber-500'   : 'bg-orange-400'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </td>

                  <td className="px-4 py-4 text-right hidden sm:table-cell">
                    <span className="text-sm font-bold text-gray-800 tabular-nums">{formatNRs(emi.emi_amount)}</span>
                    <p className="text-xs text-gray-400">/month</p>
                  </td>

                  <td className="px-4 py-4 text-right hidden md:table-cell">
                    <span className="text-sm font-semibold text-gray-700 tabular-nums">
                      {paidCount}
                      <span className="text-gray-300 font-normal">/{totalCount}</span>
                    </span>
                    <p className="text-xs text-gray-400">installments</p>
                  </td>

                  <td className="px-4 py-4 hidden lg:table-cell">
                    <DueBadge emi={emi} logs={logs} />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(emi); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(emi.emi_id); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : emi.emi_id); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>

                <AnimatePresence>
                  {isExpanded && (
                    <ExpandedRow key={`expand-${emi.emi_id}`} emi={emi} logs={logs} />
                  )}
                </AnimatePresence>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}