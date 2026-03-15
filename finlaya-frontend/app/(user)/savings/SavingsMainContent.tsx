'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PiggyBank, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CategorySurplus {
  id: number;
  name: string;
  budget: number;
  spent: number;
  surplus: number;
}

interface SavedRecord {
  id: string;
  locked_at: string;
  month_label: string;
  year: number;
  month: number;
  total_surplus: number;
  category_breakdown: CategorySurplus[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmtNRs = (n: number) =>
  `NRs ${Math.round(Math.abs(n)).toLocaleString('en-IN')}`;

function currentMonthLabel() {
  return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
}

// ── Custom checkbox ────────────────────────────────────────────────────────────

function Checkbox({ checked, onChange, onClick }: {
  checked: boolean;
  onChange: () => void;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => { onClick?.(e); onChange(); }}
      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
        checked
          ? 'bg-orange-500 border-orange-500'
          : 'bg-white border-gray-300 hover:border-orange-400'
      }`}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

// ── History row ────────────────────────────────────────────────────────────────

function HistoryRow({ record, isLast }: { record: SavedRecord; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const lockedOn = new Date(record.locked_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <>
      <tr
        className={`hover:bg-gray-50/80 cursor-pointer transition-colors ${!isLast || expanded ? 'border-b border-gray-100' : ''}`}
        onClick={() => setExpanded(v => !v)}
      >
        <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{record.month_label}</td>
        <td className="px-5 py-3.5">
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
            {record.category_breakdown.length} {record.category_breakdown.length === 1 ? 'category' : 'categories'}
          </span>
        </td>
        <td className="px-5 py-3.5">
          <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md tabular-nums">
            +{fmtNRs(record.total_surplus)}
          </span>
        </td>
        <td className="px-5 py-3.5 text-sm text-gray-400">{lockedOn}</td>
        <td className="px-5 py-3.5 text-right">
          {expanded
            ? <ChevronUp size={14} className="text-gray-400 ml-auto" />
            : <ChevronDown size={14} className="text-gray-400 ml-auto" />
          }
        </td>
      </tr>

      <AnimatePresence>
        {expanded && (
          <tr>
            <td colSpan={5} className="px-6 pb-4 pt-2 bg-gray-50/60 border-b border-gray-100">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-orange-50 border-b border-orange-100 text-left">
                      <th className="px-4 py-2.5 text-xs font-semibold text-orange-700 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-orange-700 uppercase tracking-wider text-right">Budget</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-orange-700 uppercase tracking-wider text-right">Spent</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-orange-700 uppercase tracking-wider text-right">Saved</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {record.category_breakdown.map((cat, i) => (
                      <tr key={i} className={i % 2 === 1 ? 'bg-emerald-50/30' : 'bg-white'}>
                        <td className="px-4 py-2.5 text-sm font-medium text-gray-700">{cat.name}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-500 text-right tabular-nums">{fmtNRs(cat.budget)}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-500 text-right tabular-nums">{fmtNRs(cat.spent)}</td>
                        <td className="px-4 py-2.5 text-sm font-semibold text-emerald-600 text-right tabular-nums">
                          +{fmtNRs(cat.surplus)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SavingsMainContent() {
  const { user } = useAuth();

  const [categories, setCategories]   = useState<CategorySurplus[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [pastRecords, setPastRecords] = useState<SavedRecord[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [isLocking, setIsLocking]     = useState(false);
  const [successMsg, setSuccessMsg]   = useState('');
  const [errorMsg, setErrorMsg]       = useState('');

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [catRes, expRes, recordsRes] = await Promise.all([
      supabase
        .from('budget_categories')
        .select('category_id, category_name, budget_limit')
        .eq('user_id', user.id),
      supabase
        .from('expenses')
        .select('amount, category_id')
        .eq('user_id', user.id)
        .gte('expense_date', monthStart)
        .lte('expense_date', monthEnd),
      supabase
        .from('monthly_savings')
        .select('*')
        .eq('user_id', user.id)
        .order('locked_at', { ascending: false }),
    ]);

    const spentMap: Record<number, number> = {};
    for (const e of expRes.data || []) {
      if (e.category_id)
        spentMap[e.category_id] = (spentMap[e.category_id] || 0) + Number(e.amount);
    }

    const cats: CategorySurplus[] = (catRes.data || [])
      .filter(c => Number(c.budget_limit) > 0)
      .map(c => {
        const budget  = Number(c.budget_limit);
        const spent   = spentMap[c.category_id] || 0;
        const surplus = budget - spent;
        return { id: c.category_id, name: c.category_name, budget, spent, surplus };
      })
      .filter(c => c.surplus > 0)
      .sort((a, b) => b.surplus - a.surplus);

    setCategories(cats);
    setSelectedIds(new Set(cats.map(c => c.id)));
    setPastRecords((recordsRes.data || []) as SavedRecord[]);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleCategory = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === categories.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(categories.map(c => c.id)));
  };

  const handleLock = async () => {
    if (!user?.id || selectedIds.size === 0) return;
    setIsLocking(true);
    setErrorMsg('');

    const now      = new Date();
    const selected = categories.filter(c => selectedIds.has(c.id));
    const total    = selected.reduce((s, c) => s + c.surplus, 0);

    const { error } = await supabase.from('monthly_savings').insert({
      user_id:            user.id,
      month_label:        currentMonthLabel(),
      year:               now.getFullYear(),
      month:              now.getMonth() + 1,
      total_surplus:      total,
      category_breakdown: selected,
    });

    setIsLocking(false);

    if (error) {
      setErrorMsg('Failed to save. Please try again.');
    } else {
      setSuccessMsg(`Saved ${fmtNRs(total)} successfully.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      await fetchData();
    }
  };

  const selectedTotal = categories.filter(c => selectedIds.has(c.id)).reduce((s, c) => s + c.surplus, 0);
  const allTimeTotal  = pastRecords.reduce((s, r) => s + Number(r.total_surplus), 0);
  const allSelected   = selectedIds.size === categories.length && categories.length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-8 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-72 bg-gray-100 rounded mb-8" />
        <div className="h-64 bg-gray-200 rounded-2xl mb-5" />
        <div className="h-48 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monthly Savings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Lock in unspent budget from your categories as savings
            </p>
          </div>
          {allTimeTotal > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-400 font-medium">Total saved</p>
              <p className="text-base font-bold text-emerald-600 tabular-nums">{fmtNRs(allTimeTotal)}</p>
            </div>
          )}
        </div>

        {/* ── Current month lock panel ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">

          {/* Orange left-border accent on header */}
          <div className="px-6 py-4 border-b border-gray-100 border-l-4 border-l-orange-400">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">{currentMonthLabel()}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {categories.length > 0
                    ? `${categories.length} categories with unspent budget`
                    : 'No surplus to save this month'}
                </p>
              </div>
              {selectedTotal > 0 && (
                <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-md tabular-nums">
                  {fmtNRs(selectedTotal)} selected
                </span>
              )}
            </div>
          </div>

          {/* Empty state */}
          {categories.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <PiggyBank size={28} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">No surplus this month</p>
              <p className="text-xs text-gray-400 mt-1">
                Categories where spending is under budget will appear here
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    {/* Orange-tinted header — ties to the brand colour without being heavy */}
                    <tr className="bg-orange-50 border-b-2 border-orange-100">
                      <th className="px-6 py-3 text-left w-12">
                        <Checkbox checked={allSelected} onChange={toggleAll} />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-orange-700 uppercase tracking-wider">Budget</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-orange-700 uppercase tracking-wider">Spent</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-orange-700 uppercase tracking-wider">Surplus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat, idx) => {
                      const pct     = cat.budget > 0 ? Math.round((cat.spent / cat.budget) * 100) : 0;
                      const checked = selectedIds.has(cat.id);
                      const rowBg   = checked
                        ? 'bg-orange-50/50'
                        : idx % 2 === 1
                          ? 'bg-emerald-50/20'
                          : 'bg-white';
                      return (
                        <tr
                          key={cat.id}
                          onClick={() => toggleCategory(cat.id)}
                          className={`cursor-pointer transition-colors hover:bg-orange-50/40 border-b border-gray-100 last:border-0 ${rowBg}`}
                        >
                          <td className="px-6 py-3.5">
                            <Checkbox
                              checked={checked}
                              onChange={() => toggleCategory(cat.id)}
                              onClick={e => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                            {/* Mini usage bar — shows how much of budget was spent */}
                            <div className="mt-1.5 w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-400"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-500 text-right tabular-nums">
                            {fmtNRs(cat.budget)}
                          </td>
                          <td className="px-4 py-3.5 text-right tabular-nums">
                            <span className="text-sm text-gray-600">{fmtNRs(cat.spent)}</span>
                            <span className="text-xs text-gray-400 ml-1">({pct}%)</span>
                          </td>
                          {/* Surplus pill — the key number, deserves a badge */}
                          <td className="px-4 py-3.5 text-right">
                            <span className="inline-block text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-md tabular-nums">
                              +{fmtNRs(cat.surplus)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {selectedIds.size > 0 && (
                    <tfoot>
                      <tr className="bg-orange-50/60 border-t-2 border-orange-100">
                        <td colSpan={4} className="px-6 py-3 text-xs font-semibold text-orange-700 uppercase tracking-wider">
                          {selectedIds.size} of {categories.length} selected
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md tabular-nums">
                            +{fmtNRs(selectedTotal)}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Footer row: hint left, button right */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
                <div>
                  {successMsg && <p className="text-sm text-emerald-600 font-medium">{successMsg}</p>}
                  {errorMsg   && <p className="text-sm text-red-500 font-medium">{errorMsg}</p>}
                  {!successMsg && !errorMsg && (
                    <p className="text-xs text-gray-400">
                      You can lock savings multiple times in the same month.
                    </p>
                  )}
                </div>
                <button
                  onClick={handleLock}
                  disabled={selectedIds.size === 0 || isLocking}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {isLocking
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Lock size={14} />
                  }
                  {isLocking ? 'Saving...' : 'Lock in Savings'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Savings history ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 border-l-4 border-l-emerald-400 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Savings History</h2>
            {pastRecords.length > 0 && (
              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {pastRecords.length} {pastRecords.length === 1 ? 'record' : 'records'}
              </span>
            )}
          </div>

          {pastRecords.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <PiggyBank size={28} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">No savings locked in yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Lock your monthly surplus above to start building a history
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-orange-50 border-b-2 border-orange-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">Month</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">Categories</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">Amount Saved</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">Locked On</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {pastRecords.map((record, i) => (
                    <HistoryRow
                      key={record.id}
                      record={record}
                      isLast={i === pastRecords.length - 1}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}