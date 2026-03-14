'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDownLeft, ArrowUpRight, MoreVertical,
  Pencil, Trash2, Calendar, CreditCard,
} from 'lucide-react';
import ConfirmDeleteModal from '@/components/modals/ConfirmDelete/ConfirmDeleteModal';

interface Transaction {
  expense_id:     number;
  description:    string;
  amount:         number;
  expense_date:   string;
  payment_method: string;
  category_name:  string | null;
  category_id?:   number | null;
  type:           'expense' | 'income';
}

interface TransactionHistoryProps {
  filtered:       Transaction[];
  isLoading:      boolean;
  categoryColors: Record<string, string>;
  onEdit:         (t: Transaction) => void;
  onDelete:       (id: number, type: 'expense' | 'income') => void;
}

function ThreeDotMenu({
  transaction, onEdit, onDelete,
}: {
  transaction: Transaction;
  onEdit: (t: Transaction) => void;
  onDelete: (id: number, type: 'expense' | 'income') => void;
}) {
  const [open, setOpen]                       = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting]           = useState(false);
  const [menuPos, setMenuPos]                 = useState({ top: 0, right: 0 });

  const btnRef  = useRef<HTMLButtonElement>(null);
  // Ref attached to the portal div so outside-click can check both
  const menuRef = useRef<HTMLDivElement>(null);

  // Close only when click is outside BOTH the trigger button AND the portal menu
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideBtn  = btnRef.current?.contains(target);
      const insideMenu = menuRef.current?.contains(target);
      if (!insideBtn && !insideMenu) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on scroll so menu doesn't float away from its button
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, [open]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setMenuPos({
      top:   rect.bottom + window.scrollY + 4,
      right: window.innerWidth - rect.right,
    });
    setOpen((v) => !v);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    await onDelete(transaction.expense_id, transaction.type);
    setIsDeleting(false);
    setShowDeleteModal(false);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
      >
        <MoreVertical size={14} />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top:   menuPos.top,
            right: menuPos.right,
            zIndex: 9999,
          }}
          className="w-36 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
        >
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => { setOpen(false); onEdit(transaction); }}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <Pencil size={13} /> Edit
          </button>
          <div className="h-px bg-gray-100 mx-3" />
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => { setOpen(false); setShowDeleteModal(true); }}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>,
        document.body
      )}

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        message={`Are you sure you want to delete "${transaction.description}"?`}
        isDeleting={isDeleting}
      />
    </>
  );
}

export default function TransactionHistory({
  filtered, isLoading, categoryColors, onEdit, onDelete,
}: TransactionHistoryProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

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
        <div className="flex flex-col items-center justify-center py-14">
          <div className="w-10 h-10 mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <ArrowDownLeft size={18} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm font-medium">No transactions found</p>
          <p className="text-gray-400 text-xs mt-1">Try a different month or category</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Title
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                  Category
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                  Date
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                  Method
                </th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                  Amount
                </th>
                <th className="px-3 py-3 w-10" />
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {filtered.map((t) => {
                const isIncome = t.type === 'income';
                return (
                  <tr
                    key={`${t.type}-${t.expense_id}`}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 ${
                          isIncome ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          {isIncome
                            ? <ArrowUpRight size={13} className="text-green-600" />
                            : <ArrowDownLeft size={13} className="text-red-600" />
                          }
                        </div>
                        <span className="text-sm font-medium text-gray-800 truncate max-w-[140px]">
                          {t.description}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 hidden sm:table-cell">
                      {t.category_name ? (
                        <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-gray-100 text-gray-600">
                          {t.category_name}
                        </span>
                      ) : isIncome ? (
                        <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-gray-100 text-gray-600">
                          Income
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar size={11} className="text-gray-300" />
                        {new Date(t.expense_date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                    </td>

                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <CreditCard size={11} className="text-gray-300" />
                        {t.payment_method || '—'}
                      </span>
                    </td>

                    <td className="px-5 py-3 text-right">
                      <span className={`text-sm font-bold tabular-nums ${
                        isIncome ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {isIncome ? '+' : '-'}NRs {Number(t.amount).toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <ThreeDotMenu transaction={t} onEdit={onEdit} onDelete={onDelete} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}