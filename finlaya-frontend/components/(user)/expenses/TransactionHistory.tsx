'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, Search, SlidersHorizontal, MoreVertical, Pencil, Trash2 } from 'lucide-react';

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
  transactions: Transaction[];
  filtered: Transaction[];
  search: string;
  setSearch: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  categories: string[];
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-20 w-36 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Only show Edit for expenses, not income */}
          {transaction.type === 'expense' && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEdit(transaction);
              }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <Pencil size={14} />
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete(transaction.expense_id, transaction.type);
            }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function TransactionHistory({
  filtered,
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  categories,
  isLoading,
  categoryColors,
  onEdit,
  onDelete,
}: TransactionHistoryProps) {
  return (
    <>
      {/* Search + Filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-600">
          <SlidersHorizontal size={15} className="text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="appearance-none bg-transparent outline-none cursor-pointer text-gray-600"
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">Transaction History</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No transactions found
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((t) => {
              const isIncome = t.type === 'income';
              return (
                <div
                  key={`${t.type}-${t.expense_id}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group"
                >
                  {/* Left: icon + info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${isIncome ? 'bg-green-50' : 'bg-orange-50'}`}>
                      {isIncome ? (
                        <ArrowUpRight size={18} className="text-green-500" />
                      ) : (
                        <ArrowDownLeft size={18} className="text-orange-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{t.description}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {/* Category badge */}
                        {t.category_name && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              categoryColors[t.category_name] || 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {t.category_name}
                          </span>
                        )}
                        {/* Income badge */}
                        {isIncome && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                            Income
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{t.expense_date}</span>
                        {t.payment_method && (
                          <span className="text-xs text-gray-400">· {t.payment_method}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: amount + menu */}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <p className={`text-sm font-bold ${isIncome ? 'text-green-600' : 'text-gray-800'}`}>
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
    </>
  );
}