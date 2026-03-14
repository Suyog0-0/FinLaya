'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, MoreVertical, Pencil, Trash2, Calendar, CreditCard } from 'lucide-react';
import ConfirmDeleteModal from '@/components/modals/ConfirmDelete/ConfirmDeleteModal';

interface Transaction {
  expense_id: number;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  category_name: string | null;
  category_id?: number | null;
  type: 'expense' | 'income';
}

interface TransactionHistoryProps {
  filtered: Transaction[];
  isLoading: boolean;
  categoryColors: Record<string, string>;
  onEdit: (t: Transaction) => void;
  onDelete: (id: number, type: 'expense' | 'income') => void;
}

function ThreeDotMenu({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  onEdit: (t: Transaction) => void;
  onDelete: (id: number, type: 'expense' | 'income') => void;
}) {
  const [open, setOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    await onDelete(transaction.expense_id, transaction.type);
    setIsDeleting(false);
    setShowDeleteModal(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
      >
        <MoreVertical size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-20 w-36 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={() => { setOpen(false); onEdit(transaction); }}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <Pencil size={13} /> Edit
          </button>
          <div className="h-px bg-gray-100 mx-3" />
          <button
            type="button"
            onClick={() => { setOpen(false); setShowDeleteModal(true); }}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        message={`Are you sure you want to delete "${transaction.description}"?`}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default function TransactionHistory({
  filtered,
  isLoading,
  categoryColors,
  onEdit,
  onDelete,
}: TransactionHistoryProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-900">Transaction History</h2>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}
        </span>
      </div>

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="divide-y divide-gray-50">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 bg-gray-100 rounded" />
                <div className="h-3 w-24 bg-gray-50 rounded" />
              </div>
              <div className="h-3.5 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (

        /* Empty state */
        <div className="flex flex-col items-center justify-center py-14">
          <div className="w-10 h-10 mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <ArrowDownLeft size={18} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm font-medium">No transactions found</p>
          <p className="text-gray-400 text-xs mt-1">Try a different month or category</p>
        </div>

      ) : (

        /* Transaction rows — compact py-2.5 */
        <div className="divide-y divide-gray-50">
          {filtered.map((t) => {
            const isIncome = t.type === 'income';
            return (
              <div
                key={`${t.type}-${t.expense_id}`}
                className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50 transition-colors"
              >
                {/* Left: icon + info */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 ${isIncome ? 'bg-green-50' : 'bg-red-50'}`}>
                    {isIncome
                      ? <ArrowUpRight size={15} className="text-green-600" />
                      : <ArrowDownLeft size={15} className="text-red-600" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
                      {t.description}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {t.category_name ? (
                        <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${categoryColors[t.category_name] || 'bg-gray-100 text-gray-600'}`}>
                          {t.category_name}
                        </span>
                      ) : isIncome ? (
                        <span className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-green-100 text-green-700">
                          Income
                        </span>
                      ) : null}
                      <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                        <Calendar size={10} />
                        {new Date(t.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {t.payment_method && (
                        <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                          <CreditCard size={10} />
                          {t.payment_method}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: amount + menu */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <p className={`text-sm font-bold tabular-nums ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                    {isIncome ? '+' : '-'}NRs {Number(t.amount).toLocaleString('en-IN')}
                  </p>
                  <ThreeDotMenu transaction={t} onEdit={onEdit} onDelete={onDelete} />
                </div>
              </div>
            );
          })}
        </div>
    )}
    </div>
  );
}