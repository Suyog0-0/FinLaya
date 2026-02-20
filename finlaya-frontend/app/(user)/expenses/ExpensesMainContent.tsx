'use client';

import { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Search, SlidersHorizontal, Plus } from 'lucide-react';
import StatsCard from '@/components/(user)/shared/StatsCard';

interface Transaction {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
}

const mockTransactions: Transaction[] = [
  { id: '1', title: 'Grocery Store', category: 'Food', date: '2024-12-28', amount: 855, type: 'expense' },
  { id: '2', title: 'Salary Deposit', category: 'Income', date: '2024-12-25', amount: 52000, type: 'income' },
  { id: '3', title: 'Netflix Subscription', category: 'Entertainment', date: '2024-12-24', amount: 1599, type: 'expense' },
  { id: '4', title: 'Electric Bill', category: 'Utilities', date: '2024-12-23', amount: 1200, type: 'expense' },
  { id: '5', title: 'Taxi Ride', category: 'Transport', date: '2024-12-22', amount: 245, type: 'expense' },
  { id: '6', title: 'Restaurant Dinner', category: 'Food', date: '2024-12-21', amount: 650, type: 'expense' },
  { id: '7', title: 'Gym Membership', category: 'Health', date: '2024-12-20', amount: 500, type: 'expense' },
  { id: '8', title: 'Freelance Payment', category: 'Income', date: '2024-12-19', amount: 8000, type: 'income' },
  { id: '9', title: 'Phone Bill', category: 'Utilities', date: '2024-12-18', amount: 450, type: 'expense' },
  { id: '10', title: 'Coffee Shop', category: 'Food', date: '2024-12-17', amount: 125, type: 'expense' },
];

const categories = ['All Categories', 'Food', 'Income', 'Entertainment', 'Utilities', 'Transport', 'Health'];

const categoryColors: Record<string, string> = {
  Food: 'bg-orange-100 text-orange-700',
  Income: 'bg-green-100 text-green-700',
  Entertainment: 'bg-purple-100 text-purple-700',
  Utilities: 'bg-gray-200 text-gray-700',
  Transport: 'bg-blue-100 text-blue-700',
  Health: 'bg-teal-100 text-teal-700',
};

export default function ExpensesMainContent() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const totalIncome = mockTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = mockTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpenses;

  const filtered = mockTransactions.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      selectedCategory === 'All Categories' || t.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
            <p className="text-gray-500 text-sm mt-0.5">Track and manage your expenses</p>
          </div>
          <button className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 rounded-lg font-semibold shadow hover:shadow-md transition-all text-sm">
            <Plus size={16} />
            Add Expense
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatsCard statId="income" monthlySalary={totalIncome} />
          <StatsCard statId="expenses" monthlyExpenses={totalExpenses} />
          <StatsCard statId="balance" totalBalance={netBalance} />
        </div>

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
          <div className="relative">
            <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-600 cursor-pointer">
              <SlidersHorizontal size={15} className="text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-transparent outline-none cursor-pointer pr-4 text-gray-600"
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Transaction History</h2>

          <div className="space-y-3">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-green-50' : 'bg-orange-50'}`}>
                    {t.type === 'income' ? (
                      <ArrowUpRight size={18} className="text-green-500" />
                    ) : (
                      <ArrowDownLeft size={18} className="text-orange-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{t.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[t.category] || 'bg-gray-100 text-gray-600'}`}>
                        {t.category}
                      </span>
                      <span className="text-xs text-gray-400">{t.date}</span>
                    </div>
                  </div>
                </div>
                <p className={`text-sm font-bold ${t.type === 'income' ? 'text-green-500' : 'text-gray-800'}`}>
                  {t.type === 'income' ? '+' : '-'}NRs {t.amount.toLocaleString('en-IN')}.00
                </p>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">
                No transactions found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}