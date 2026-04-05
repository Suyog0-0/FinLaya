'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PiggyBank, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface CategorySurplus {
  id: number;
  name: string;
  budget: number;
  spent: number;
  surplus: number;
  lockedThisMonth: number;
  available: number;
}

interface SavedRecord {
  id: string;
  locked_at: string;
  month_label: string;
  year: number;
  month: number;
  total_surplus: number;
  category_breakdown: { id: number; name: string; budget: number; spent: number; surplus: number }[];
}

const fmtNRs = (n: number) =>
  `NRs ${Math.round(Math.abs(n)).toLocaleString('en-IN')}`;

function currentMonthLabel() {
  return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
}

function Checkbox({ checked, onChange, onClick, disabled }: {
  checked: boolean;
  onChange: () => void;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => { onClick?.(e); if (!disabled) onChange(); }}
      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
        disabled
          ? 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 cursor-not-allowed'
          : checked
            ? 'bg-orange-500 border-orange-500'
            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 hover:border-orange-400'
      }`}
    >
      {checked && !disabled && (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

function HistoryRow({ record, isLast }: { record: SavedRecord; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const lockedOn = new Date(record.locked_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <>
      <tr
        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
          !isLast || expanded ? 'border-b border-gray-100 dark:border-gray-700' : ''
        }`}
        onClick={() => setExpanded(v => !v)}
      >
        <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">{record.month_label}</td>
        <td className="px-4 py-3">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
            {record.category_breakdown.length} cat.
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 px-2 py-0.5 rounded-md tabular-nums">
            +{fmtNRs(record.total_surplus)}
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 hidden sm:table-cell">{lockedOn}</td>
        <td className="px-4 py-3 text-right">
          {expanded
            ? <ChevronUp size={13} className="text-gray-400 ml-auto" />
            : <ChevronDown size={13} className="text-gray-400 ml-auto" />}
        </td>
      </tr>

      <AnimatePresence>
        {expanded && (
          <tr>
            <td colSpan={5} className="px-4 pb-3 pt-1 bg-gray-50/60 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <table className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden mt-1">
                  <thead>
                    <tr className="bg-orange-50 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-800 text-left">
                      <th className="px-3 py-2 text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Category</th>
                      <th className="px-3 py-2 text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider text-right">Budget</th>
                      <th className="px-3 py-2 text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider text-right">Spent</th>
                      <th className="px-3 py-2 text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider text-right">Saved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                    {record.category_breakdown.map((cat, i) => (
                      <tr key={i} className={i % 2 === 1 ? 'bg-emerald-50/20 dark:bg-emerald-900/10' : 'bg-white dark:bg-gray-800'}>
                        <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">{cat.name}</td>
                        <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-right tabular-nums">{fmtNRs(cat.budget)}</td>
                        <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-right tabular-nums">{fmtNRs(cat.spent)}</td>
                        <td className="px-3 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 text-right tabular-nums">+{fmtNRs(cat.surplus)}</td>
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

export default function SavingsMainContent() {
  const { user } = useAuth();

  const [categories,   setCategories]   = useState<CategorySurplus[]>([]);
  const [selectedIds,  setSelectedIds]  = useState<Set<number>>(new Set());
  const [pastRecords,  setPastRecords]  = useState<SavedRecord[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isLocking,    setIsLocking]    = useState(false);
  const [successMsg,   setSuccessMsg]   = useState('');
  const [errorMsg,     setErrorMsg]     = useState('');

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const thisYear   = now.getFullYear();
    const thisMonth  = now.getMonth() + 1;

    const [catRes, expRes, recordsRes] = await Promise.all([
      supabase.from('budget_categories').select('category_id, category_name, budget_limit').eq('user_id', user.id),
      supabase.from('expenses').select('amount, category_id').eq('user_id', user.id).gte('expense_date', monthStart).lte('expense_date', monthEnd),
      supabase.from('monthly_savings').select('*').eq('user_id', user.id).order('locked_at', { ascending: false }),
    ]);

    const spentMap: Record<number, number> = {};
    for (const e of expRes.data || []) {
      if (e.category_id) spentMap[e.category_id] = (spentMap[e.category_id] || 0) + Number(e.amount);
    }

    const lockedMap: Record<number, number> = {};
    const allRecords = (recordsRes.data || []) as SavedRecord[];
    for (const record of allRecords) {
      if (record.year === thisYear && record.month === thisMonth) {
        for (const cat of record.category_breakdown) {
          lockedMap[cat.id] = (lockedMap[cat.id] || 0) + cat.surplus;
        }
      }
    }

    const cats: CategorySurplus[] = (catRes.data || [])
      .filter(c => Number(c.budget_limit) > 0)
      .map(c => {
        const budget          = Number(c.budget_limit);
        const spent           = spentMap[c.category_id] || 0;
        const surplus         = budget - spent;
        const lockedThisMonth = lockedMap[c.category_id] || 0;
        const available       = surplus - lockedThisMonth;
        return { id: c.category_id, name: c.category_name, budget, spent, surplus, lockedThisMonth, available };
      })
      .filter(c => c.surplus > 0)
      .sort((a, b) => b.available - a.available);

    setCategories(cats);
    setSelectedIds(new Set());
    setPastRecords(allRecords);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleCategory = (cat: CategorySurplus) => {
    if (cat.available <= 0) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(cat.id)) next.delete(cat.id);
      else next.add(cat.id);
      return next;
    });
  };

  const selectableCategories = categories.filter(c => c.available > 0);

  const toggleAll = () => {
    if (selectedIds.size === selectableCategories.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(selectableCategories.map(c => c.id)));
  };

  const handleLock = async () => {
    if (!user?.id || selectedIds.size === 0) return;
    setIsLocking(true);
    setErrorMsg('');

    const now      = new Date();
    const selected = categories
      .filter(c => selectedIds.has(c.id) && c.available > 0)
      .map(c => ({ id: c.id, name: c.name, budget: c.budget, spent: c.spent, surplus: c.available }));

    const total = selected.reduce((s, c) => s + c.surplus, 0);

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

  const selectedTotal  = categories.filter(c => selectedIds.has(c.id) && c.available > 0).reduce((s, c) => s + c.available, 0);
  const allTimeTotal   = pastRecords.reduce((s, r) => s + Number(r.total_surplus), 0);
  const allSelected    = selectableCategories.length > 0 && selectedIds.size === selectableCategories.length;
  const thisMonthTotal = pastRecords
    .filter(r => r.year === new Date().getFullYear() && r.month === new Date().getMonth() + 1)
    .reduce((s, r) => s + Number(r.total_surplus), 0);

  // ── Dark-mode-aware skeleton ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] px-6 py-8 max-w-6xl mx-auto animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-4 w-72 bg-gray-100 dark:bg-gray-700/60 rounded mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] transition-colors">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Monthly Savings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Lock in unspent budget from your categories as savings
            </p>
          </div>

          {allTimeTotal > 0 && (
            <div className="flex items-center gap-3">
              {thisMonthTotal > 0 && (
                <div className="text-right">
                  <p className="text-xs text-gray-400 dark:text-gray-500">This month</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {fmtNRs(thisMonthTotal)}
                  </p>
                </div>
              )}
              <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
              <div className="text-right">
                <p className="text-xs text-gray-400 dark:text-gray-500">All time</p>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {fmtNRs(allTimeTotal)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* LEFT: Lock panel */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">

            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 border-l-4 border-l-orange-400">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">{currentMonthLabel()}</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {selectableCategories.length > 0
                      ? `${selectableCategories.length} categories available to lock`
                      : 'Nothing left to lock this month'}
                  </p>
                </div>
                {selectedTotal > 0 && (
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 px-2.5 py-1 rounded-md tabular-nums">
                    {fmtNRs(selectedTotal)}
                  </span>
                )}
              </div>
            </div>

            {categories.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <PiggyBank size={24} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No surplus this month</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Categories under budget will appear here
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-orange-50 dark:bg-orange-900/10 border-b-2 border-orange-100 dark:border-orange-800">
                        <th className="px-5 py-2.5 w-10">
                          <Checkbox checked={allSelected} onChange={toggleAll} disabled={selectableCategories.length === 0} />
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Category</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Spent</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat, idx) => {
                        const pct         = cat.budget > 0 ? Math.round((cat.spent / cat.budget) * 100) : 0;
                        const checked     = selectedIds.has(cat.id);
                        const fullyLocked = cat.available <= 0;
                        const rowBg       = fullyLocked
                          ? 'bg-gray-50/80 dark:bg-gray-700/30'
                          : checked
                            ? 'bg-orange-50/40 dark:bg-orange-900/10'
                            : idx % 2 === 1 ? 'bg-emerald-50/15 dark:bg-emerald-900/5' : 'bg-white dark:bg-gray-800';

                        return (
                          <tr
                            key={cat.id}
                            onClick={() => toggleCategory(cat)}
                            className={`border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors ${
                              fullyLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-orange-50/30 dark:hover:bg-orange-900/10'
                            } ${rowBg}`}
                          >
                            <td className="px-5 py-3">
                              <Checkbox
                                checked={checked && !fullyLocked}
                                onChange={() => toggleCategory(cat)}
                                onClick={e => e.stopPropagation()}
                                disabled={fullyLocked}
                              />
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${fullyLocked ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                  {cat.name}
                                </span>
                                {fullyLocked && (
                                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                    Locked
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 w-20 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${pct}%` }} />
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <span className={`text-xs tabular-nums ${fullyLocked ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                {fmtNRs(cat.spent)} <span className="text-gray-400 dark:text-gray-500">({pct}%)</span>
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right">
                              {fullyLocked ? (
                                <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                                  {fmtNRs(cat.lockedThisMonth)} locked
                                </span>
                              ) : (
                                <span className="inline-block text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 px-2 py-0.5 rounded-md tabular-nums">
                                  +{fmtNRs(cat.available)}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {selectedIds.size > 0 && (
                      <tfoot>
                        <tr className="bg-orange-50/60 dark:bg-orange-900/10 border-t-2 border-orange-100 dark:border-orange-800">
                          <td colSpan={3} className="px-5 py-2.5 text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                            {selectedIds.size} of {selectableCategories.length} selected
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md tabular-nums">
                              +{fmtNRs(selectedTotal)}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                  <div>
                    {successMsg && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{successMsg}</p>}
                    {errorMsg   && <p className="text-xs text-red-500 font-medium">{errorMsg}</p>}
                    {!successMsg && !errorMsg && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">Can lock multiple times per month.</p>
                    )}
                  </div>
                  <button
                    onClick={handleLock}
                    disabled={selectedIds.size === 0 || isLocking}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {isLocking
                      ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Lock size={13} />
                    }
                    {isLocking ? 'Saving...' : 'Lock in Savings'}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* RIGHT: History panel */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">

            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 border-l-4 border-l-emerald-400 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Savings History</h2>
              {pastRecords.length > 0 && (
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {pastRecords.length} {pastRecords.length === 1 ? 'record' : 'records'}
                </span>
              )}
            </div>

            {pastRecords.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <PiggyBank size={24} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No savings locked in yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Lock your monthly surplus to start building history
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-orange-50 dark:bg-orange-900/10 border-b-2 border-orange-100 dark:border-orange-800">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Month</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Cat.</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Saved</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider hidden sm:table-cell">Date</th>
                      <th className="px-4 py-2.5 w-6" />
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
    </div>
  );
}