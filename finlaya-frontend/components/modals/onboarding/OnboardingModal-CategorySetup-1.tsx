'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Plus, X, ChevronRight } from 'lucide-react';

export interface CategoryRow {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  enabled: boolean;
  isEditing: boolean;
}

interface CategorySetupProps {
  salary: number;          // budgetable salary (after EMI deduction)
  reservedForEMI: number;  // total monthly EMI amount
  rows: CategoryRow[];
  error: string;
  newCatName: string;
  newCatAmount: string;
  showAddRow: boolean;
  isSaving: boolean;
  onToggleRow: (id: string) => void;
  onUpdateAmount: (id: string, val: string) => void;
  onUpdateName: (id: string, val: string) => void;
  onSetEditing: (id: string, val: boolean) => void;
  onRemoveRow: (id: string) => void;
  onNewCatNameChange: (val: string) => void;
  onNewCatAmountChange: (val: string) => void;
  onAddCustomRow: () => void;
  onToggleAddRow: () => void;
  onClearRows: () => void;   // clears all rows for "build my own"
  onBack: () => void;
  onSave: () => void;
}

// ── 3-segment bar: EMI | allocated | remaining ──────────────────────────────
function AllocationBar({
  totalSalary,
  reservedForEMI,
  rows,
}: {
  totalSalary: number;
  reservedForEMI: number;
  rows: CategoryRow[];
}) {
  const allocated = rows.filter((r) => r.enabled).reduce((s, r) => s + r.amount, 0);
  const budgetable = totalSalary - reservedForEMI;
  const over = allocated > budgetable;

  const emiPct   = totalSalary > 0 ? (reservedForEMI / totalSalary) * 100 : 0;
  const allocPct = totalSalary > 0
    ? Math.min((allocated / totalSalary) * 100, 100 - emiPct)
    : 0;

  const remaining = Math.max(0, budgetable - allocated);

  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs mb-2">
        <span className="text-gray-400">
          Allocated{' '}
          <span className="font-semibold text-gray-700">
            NRs {allocated.toLocaleString('en-IN')}
          </span>
        </span>
        <span className={`font-semibold ${over ? 'text-red-500' : 'text-gray-400'}`}>
          {over
            ? `Over by NRs ${(allocated - budgetable).toLocaleString('en-IN')}`
            : `NRs ${remaining.toLocaleString('en-IN')} left`}
        </span>
      </div>

      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
        {reservedForEMI > 0 && (
          <div
            className="h-full bg-gray-300 flex-shrink-0"
            style={{ width: `${emiPct}%` }}
          />
        )}
        <motion.div
          className={`h-full flex-shrink-0 ${over ? 'bg-red-400' : 'bg-orange-400'}`}
          animate={{ width: `${allocPct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>

      {reservedForEMI > 0 && (
        <div className="flex items-center gap-4 mt-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
            <span className="text-[11px] text-gray-400">
              EMI NRs {reservedForEMI.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <span className="text-[11px] text-gray-400">Categories</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OnboardingModalCategorySetup1({
  salary,
  reservedForEMI,
  rows,
  error,
  newCatName,
  newCatAmount,
  showAddRow,
  isSaving,
  onToggleRow,
  onUpdateAmount,
  onUpdateName,
  onSetEditing,
  onRemoveRow,
  onNewCatNameChange,
  onNewCatAmountChange,
  onAddCustomRow,
  onToggleAddRow,
  onClearRows,
  onBack,
  onSave,
}: CategorySetupProps) {
  // 'pick' = choose mode, 'edit' = editing rows
  const [mode, setMode] = useState<'pick' | 'edit'>('pick');

  const totalSalary = salary + reservedForEMI;
  const enabledCount = rows.filter((r) => r.enabled).length;
  const totalAllocated = rows.filter((r) => r.enabled).reduce((s, r) => s + r.amount, 0);
  const isOverAllocated = salary > 0 && totalAllocated > salary;

  // ── Mode picker ──────────────────────────────────────────────────────────
  if (mode === 'pick') {
    return (
      <div className="p-6 flex flex-col gap-4">
        <p className="text-sm text-gray-500 leading-relaxed">
          How would you like to set up your budget categories?
        </p>

        {/* Use recommended */}
        <button
          type="button"
          onClick={() => {
            // rows are already pre-filled with recommended defaults from parent
            setMode('edit');
          }}
          className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-left transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-50 group-hover:bg-white flex items-center justify-center flex-shrink-0 transition-colors text-lg">
            ✦
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">Use recommended split</p>
            <p className="text-xs text-gray-400 mt-0.5">
              8 pre-filled categories — you can still edit them
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-300 group-hover:text-orange-400 transition-colors flex-shrink-0" />
        </button>

        {/* Build my own */}
        <button
          type="button"
          onClick={() => {
            // Tell parent to wipe rows, then go to edit with empty list
            onClearRows();
            setMode('edit');
          }}
          className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-left transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-white flex items-center justify-center flex-shrink-0 transition-colors text-lg">
            ＋
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">Build my own</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Start blank and add your own categories
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
        </button>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back
          </button>
        </div>
      </div>
    );
  }

  // ── Edit screen ──────────────────────────────────────────────────────────
  return (
    <div className="p-6 flex flex-col gap-4">

      <AllocationBar
        totalSalary={totalSalary}
        reservedForEMI={reservedForEMI}
        rows={rows}
      />

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-500 px-3 py-2.5 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Category rows */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
        {rows.length === 0 && !showAddRow && (
          <p className="text-sm text-gray-400 text-center py-8">
            No categories yet — add one below.
          </p>
        )}

        {rows.map((row) => (
          <div
            key={row.id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
              row.enabled
                ? 'border-orange-100 bg-orange-50/50'
                : 'border-gray-100 bg-gray-50 opacity-50'
            }`}
          >
            {/* Checkbox */}
            <button
              type="button"
              onClick={() => onToggleRow(row.id)}
              className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                row.enabled ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'
              }`}
            >
              {row.enabled && (
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>

            {/* Name — click to rename */}
            {row.isEditing ? (
              <input
                type="text"
                value={row.name}
                onChange={(e) => onUpdateName(row.id, e.target.value)}
                onBlur={() => onSetEditing(row.id, false)}
                onKeyDown={(e) => e.key === 'Enter' && onSetEditing(row.id, false)}
                autoFocus
                className="flex-1 text-sm font-medium text-gray-800 bg-white border border-orange-300 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-orange-300"
              />
            ) : (
              <button
                type="button"
                onClick={() => onSetEditing(row.id, true)}
                className="flex-1 text-left text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors truncate"
                title="Click to rename"
              >
                {row.name}
              </button>
            )}

            {/* Amount */}
            <div className="relative w-24 flex-shrink-0">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 text-xs select-none">NRs</span>
              <input
                type="number"
                value={row.amount || ''}
                onChange={(e) => onUpdateAmount(row.id, e.target.value)}
                disabled={!row.enabled}
                className="w-full pl-7 pr-1.5 py-1.5 text-xs text-right rounded-lg border border-gray-200 bg-white focus:border-orange-400 focus:ring-1 focus:ring-orange-100 outline-none disabled:bg-gray-50 disabled:text-gray-300 transition-all"
              />
            </div>

            {/* Delete */}
            <button
              type="button"
              onClick={() => onRemoveRow(row.id)}
              className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Add custom category */}
      {showAddRow ? (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-orange-200 bg-orange-50/30">
          <input
            type="text"
            placeholder="Category name"
            value={newCatName}
            onChange={(e) => onNewCatNameChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAddCustomRow()}
            autoFocus
            className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-orange-400 transition-all"
          />
          <div className="relative w-24 flex-shrink-0">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 text-xs select-none">NRs</span>
            <input
              type="number"
              placeholder="0"
              value={newCatAmount}
              onChange={(e) => onNewCatAmountChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAddCustomRow()}
              className="w-full pl-7 pr-1.5 py-1.5 text-xs text-right bg-white border border-gray-200 rounded-lg outline-none focus:border-orange-400 transition-all"
            />
          </div>
          <button type="button" onClick={onAddCustomRow} className="text-orange-500 hover:text-orange-600 font-semibold text-xs flex-shrink-0 px-1">
            Add
          </button>
          <button type="button" onClick={onToggleAddRow} className="text-gray-300 hover:text-gray-500 flex-shrink-0">
            <X size={13} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onToggleAddRow}
          className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors"
        >
          <Plus size={14} />
          Add custom category
        </button>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => setMode('pick')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSave}
          disabled={isSaving || enabledCount === 0 || isOverAllocated}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {isSaving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <>
              Save & Continue
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </>
          )}
        </motion.button>
      </div>

    </div>
  );
}