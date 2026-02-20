'use client';

import { ArrowDownLeft, Search, SlidersHorizontal } from 'lucide-react';

interface Transaction {
  expense_id: number;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  category_name: string | null;
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
}

export default function TransactionHistory({
  transactions,
  filtered,
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  categories,
  isLoading,
  categoryColors,
}: TransactionHistoryProps) {
  return (
    <>
      {/* Search + Filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search expenses..."
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
            {filtered.map((t) => (
              <div
                key={t.expense_id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-50">
                    <ArrowDownLeft size={18} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{t.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {t.category_name && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[t.category_name] || 'bg-gray-100 text-gray-600'}`}>
                          {t.category_name}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{t.expense_date}</span>
                      {t.payment_method && (
                        <span className="text-xs text-gray-400">· {t.payment_method}</span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-800">
                  -NRs {Number(t.amount).toLocaleString('en-IN')}.00
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}