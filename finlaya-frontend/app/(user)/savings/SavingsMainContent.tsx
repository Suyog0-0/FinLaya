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
  surplus: number;       // budget - spent (gross)
  lockedThisMonth: number;
  available: number;     // surplus - lockedThisMonth (what can still be locked)
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

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmtNRs = (n: number) =>
  `NRs ${Math.round(Math.abs(n)).toLocaleString('en-IN')}`;

function currentMonthLabel() {
  return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
}

// ── Custom checkbox ────────────────────────────────────────────────────────────

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
          ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
          : checked
            ? 'bg-orange-500 border-orange-500'
            : 'bg-white border-gray-300 hover:border-orange-400'
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

// ── History row ────────────────────────────────────────────────────────────────

function HistoryRow({ record, isLast }: { record: SavedRecord; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const lockedOn = new Date(record.locked_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <>
      <tr
        className={`hover:bg-gray-50 cursor-pointer transition-colors ${!isLast || expanded ? 'border-b border-gray-100' : ''}`}
        onClick={() => setExpanded(v => !v)}
      >
        <td className="px-4 py-3 text-sm font-medium text-gray-800">{record.month_label}</td>
        <td className="px-4 py-3">
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
            {record.category_breakdown.length} cat.
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md tabular-nums">
            +{fmtNRs(record.total_surplus)}
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">{lockedOn}</td>
        <td className="px-4 py-3 text-right">
          {expanded
            ? <ChevronUp size={13} className="text-gray-400 ml-auto" />
            : <ChevronDown size={13} className="text-gray-400 ml-auto" />}
        </td>
      </tr>

      <AnimatePresence>
        {expanded && (
          <tr>
            <td colSpan={5} className="px-4 pb-3 pt-1 bg-gray-50/60 border-b border-gray-100">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden mt-1">
                  <thead>
                    <tr className="bg-orange-50 border-b border-orange-100 text-left">
                      <th className="px-3 py-2 text-xs font-semibold text-orange-700 uppercase tracking-wider">Category</th>
                      <th className="px-3 py-2 text-xs font-semibold text-orange-700 uppercase tracking-wider text-right">Budget</th>
                      <th className="px-3 py-2 text-xs font-semibold text-orange-700 uppercase tracking-wider text-right">Spent</th>
                      <th className="px-3 py-2 text-xs font-semibold text-orange-700 uppercase tracking-wider text-right">Saved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {record.category_breakdown.map((cat, i) => (
                      <tr key={i} className={i % 2 === 1 ? 'bg-emerald-50/20' : 'bg-white'}>
                        <td className="px-3 py-2 text-sm text-gray-700">{cat.name}</td>
                        <td className="px-3 py-2 text-sm text-gray-500 text-right tabular-nums">{fmtNRs(cat.budget)}</td>
                        <td className="px-3 py-2 text-sm text-gray-500 text-right tabular-nums">{fmtNRs(cat.spent)}</td>
                        <td className="px-3 py-2 text-sm font-semibold text-emerald-600 text-right tabular-nums">+{fmtNRs(cat.surplus)}</td>
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

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const thisYear   = now.getFullYear();
    const thisMonth  = now.getMonth() + 1;

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

    // ── Build spent map ──────────────────────────────────────────────────────
    const spentMap: Record<number, number> = {};
    for (const e of expRes.data || []) {
      if (e.category_id)
        spentMap[e.category_id] = (spentMap[e.category_id] || 0) + Number(e.amount);
    }

    // ── Build locked-this-month map ──────────────────────────────────────────
    // For each past lock-in record in the current month, sum the surplus
    // per category from its JSON breakdown. This prevents double-locking.
    const lockedMap: Record<number, number> = {};
    const allRecords = (recordsRes.data || []) as SavedRecord[];
    for (const record of allRecords) {
      if (record.year === thisYear && record.month === thisMonth) {
        for (const cat of record.category_breakdown) {
          lockedMap[cat.id] = (lockedMap[cat.id] || 0) + cat.surplus;
        }
      }
    }

    // ── Build category list ──────────────────────────────────────────────────
    const cats: CategorySurplus[] = (catRes.data || [])
      .filter(c => Number(c.budget_limit) > 0)
      .map(c => {
        const budget          = Number(c.budget_limit);
        const spent           = spentMap[c.category_id] || 0;
        const surplus         = budget - spent;
        const lockedThisMonth = lockedMap[c.category_id] || 0;
        const available       = surplus - lockedThisMonth;
        return {
          id: c.category_id,
          name: c.category_name,
          budget,
          spent,
          surplus,
          lockedThisMonth,
          available,
        };
      })
      // Only show categories where there was a positive gross surplus
      .filter(c => c.surplus > 0)
      .sort((a, b) => b.available - a.available);

    setCategories(cats);
    // Start with nothing selected — user picks manually
    setSelectedIds(new Set());
    setPastRecords(allRecords);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Toggle ─────────────────────────────────────────────────────────────────

  const toggleCategory = (cat: CategorySurplus) => {
    if (cat.available <= 0) return; // fully locked, not selectable
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(cat.id)) next.delete(cat.id);
      else next.add(cat.id);
      return next;
    });
  };

  const selectableCategories = categories.filter(c => c.available > 0);

  const toggleAll = () => {
    if (selectedIds.size === selectableCategories.length)
      setSelectedIds(new Set());
    else
      setSelectedIds(new Set(selectableCategories.map(c => c.id)));
  };

  // ── Lock ───────────────────────────────────────────────────────────────────

  const handleLock = async () => {
    if (!user?.id || selectedIds.size === 0) return;
    setIsLocking(true);
    setErrorMsg('');

    const now      = new Date();
    // Only lock the `available` amount per category — not the full surplus
    const selected = categories
      .filter(c => selectedIds.has(c.id) && c.available > 0)
      .map(c => ({
        id:      c.id,
        name:    c.name,
        budget:  c.budget,
        spent:   c.spent,
        surplus: c.available, // store what's actually being locked this time
      }));

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

  // ── Derived ────────────────────────────────────────────────────────────────

  const selectedTotal  = categories
    .filter(c => selectedIds.has(c.id) && c.available > 0)
    .reduce((s, c) => s + c.available, 0);

  const allTimeTotal   = pastRecords.reduce((s, r) => s + Number(r.total_surplus), 0);
  const allSelected    = selectableCategories.length > 0 &&
                         selectedIds.size === selectableCategories.length;
  const thisMonthTotal = pastRecords
    .filter(r => r.year === new Date().getFullYear() && r.month === new Date().getMonth() + 1)
    .reduce((s, r) => s + Number(r.total_surplus), 0);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-8 max-w-6xl mx-auto animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-72 bg-gray-100 rounded mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-72 bg-gray-200 rounded-2xl" />
          <div className="h-72 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monthly Savings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Lock in unspent budget from your categories as savings
            </p>
          </div>

          {/* Summary pills */}
          {allTimeTotal > 0 && (
            <div className="flex items-center gap-3">
              {thisMonthTotal > 0 && (
                <div className="text-right">
                  <p className="text-xs text-gray-400">This month</p>
                  <p className="text-sm font-bold text-emerald-600 tabular-nums">
                    {fmtNRs(thisMonthTotal)}
                  </p>
                </div>
              )}
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-right">
                <p className="text-xs text-gray-400">All time</p>
                <p className="text-sm font-bold text-emerald-700 tabular-nums">
                  {fmtNRs(allTimeTotal)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Two column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* ── LEFT: Lock panel ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            <div className="px-5 py-3.5 border-b border-gray-100 border-l-4 border-l-orange-400">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">{currentMonthLabel()}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectableCategories.length > 0
                      ? `${selectableCategories.length} categories available to lock`
                      : 'Nothing left to lock this month'}
                  </p>
                </div>
                {selectedTotal > 0 && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md tabular-nums">
                    {fmtNRs(selectedTotal)}
                  </span>
                )}
              </div>
            </div>

            {/* Empty state */}
            {categories.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <PiggyBank size={24} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">No surplus this month</p>
                <p className="text-xs text-gray-400 mt-1">
                  Categories under budget will appear here
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-orange-50 border-b-2 border-orange-100">
                        <th className="px-5 py-2.5 w-10">
                          <Checkbox
                            checked={allSelected}
                            onChange={toggleAll}
                            disabled={selectableCategories.length === 0}
                          />
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">Category</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-orange-700 uppercase tracking-wider">Spent</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-orange-700 uppercase tracking-wider">Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat, idx) => {
                        const pct       = cat.budget > 0 ? Math.round((cat.spent / cat.budget) * 100) : 0;
                        const checked   = selectedIds.has(cat.id);
                        const fullyLocked = cat.available <= 0;
                        const rowBg     = fullyLocked
                          ? 'bg-gray-50/80'
                          : checked
                            ? 'bg-orange-50/40'
                            : idx % 2 === 1 ? 'bg-emerald-50/15' : 'bg-white';

                        return (
                          <tr
                            key={cat.id}
                            onClick={() => toggleCategory(cat)}
                            className={`border-b border-gray-100 last:border-0 transition-colors ${
                              fullyLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-orange-50/30'
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
                                <span className={`text-sm font-medium ${fullyLocked ? 'text-gray-400' : 'text-gray-800'}`}>
                                  {cat.name}
                                </span>
                                {fullyLocked && (
                                  <span className="text-xs font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                    Locked
                                  </span>
                                )}
                              </div>
                              {/* Mini usage bar */}
                              <div className="mt-1 w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-400"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <span className={`text-xs tabular-nums ${fullyLocked ? 'text-gray-400' : 'text-gray-500'}`}>
                                {fmtNRs(cat.spent)} <span className="text-gray-400">({pct}%)</span>
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right">
                              {fullyLocked ? (
                                <span className="text-xs text-gray-400 tabular-nums">
                                  {fmtNRs(cat.lockedThisMonth)} locked
                                </span>
                              ) : (
                                <span className="inline-block text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md tabular-nums">
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
                        <tr className="bg-orange-50/60 border-t-2 border-orange-100">
                          <td colSpan={3} className="px-5 py-2.5 text-xs font-semibold text-orange-700 uppercase tracking-wider">
                            {selectedIds.size} of {selectableCategories.length} selected
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md tabular-nums">
                              +{fmtNRs(selectedTotal)}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Lock button */}
                <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div>
                    {successMsg && <p className="text-xs text-emerald-600 font-medium">{successMsg}</p>}
                    {errorMsg   && <p className="text-xs text-red-500 font-medium">{errorMsg}</p>}
                    {!successMsg && !errorMsg && (
                      <p className="text-xs text-gray-400">Can lock multiple times per month.</p>
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

          {/* ── RIGHT: History panel ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            <div className="px-5 py-3.5 border-b border-gray-100 border-l-4 border-l-emerald-400 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Savings History</h2>
              {pastRecords.length > 0 && (
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {pastRecords.length} {pastRecords.length === 1 ? 'record' : 'records'}
                </span>
              )}
            </div>

            {pastRecords.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <PiggyBank size={24} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">No savings locked in yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Lock your monthly surplus to start building history
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-orange-50 border-b-2 border-orange-100">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">Month</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">Cat.</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">Saved</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider hidden sm:table-cell">Date</th>
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