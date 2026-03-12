'use client';

import { motion } from 'framer-motion';
import { Check, Pencil, Trash2, Plus, X, CreditCard } from 'lucide-react';

export interface CategoryRow {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  enabled: boolean;
  isEditing: boolean;
}

interface CategorySetupProps {
  salary: number;
  reservedForEMI: number;
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
  onBack: () => void;
  onSave: () => void;
}

function AllocationBar({ salary, rows }: { salary: number; rows: CategoryRow[] }) {
  const allocated = rows.filter((r) => r.enabled).reduce((s, r) => s + r.amount, 0);
  const pct = salary > 0 ? Math.min((allocated / salary) * 100, 100) : 0;
  const remaining = salary - allocated;
  const over = remaining < 0;

  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-500 font-medium">
          Allocated: <span className="text-gray-800">NRs {allocated.toLocaleString('en-IN')}</span>
        </span>
        <span className={`font-medium ${over ? 'text-red-500' : 'text-gray-500'}`}>
          {over
            ? `Over by NRs ${Math.abs(remaining).toLocaleString('en-IN')}`
            : `Remaining: NRs ${remaining.toLocaleString('en-IN')}`}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full transition-colors ${over ? 'bg-red-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
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
  onBack,
  onSave,
}: CategorySetupProps) {
  const enabledCount = rows.filter((r) => r.enabled).length;
  const totalAllocated = rows.filter((r) => r.enabled).reduce((s, r) => s + r.amount, 0);
  const isOverAllocated = salary > 0 && totalAllocated > salary;

  return (
    <>
      <div className="p-6">
        <p className="text-sm text-gray-500 mb-3">
          Toggle categories on/off, rename them, or adjust amounts. The bar shows how much of your remaining budget is allocated.
        </p>

        {/* EMI reserved callout — only shown if user entered EMIs */}
        {reservedForEMI > 0 && (
          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5 mb-3">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
              <CreditCard size={12} className="text-white" />
            </div>
            <p className="text-xs text-amber-700 leading-snug">
              <span className="font-semibold">NRs {reservedForEMI.toLocaleString('en-IN')}</span> reserved for EMIs monthly.
              Categories are distributed across your remaining{' '}
              <span className="font-semibold">NRs {salary.toLocaleString('en-IN')}</span>.
            </p>
          </div>
        )}

        <AllocationBar salary={salary} rows={rows} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm mb-3">
            {error}
          </div>
        )}

        {/* Category list */}
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1 mb-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className={`flex items-center gap-2 p-2.5 rounded-xl border transition-colors ${
                row.enabled
                  ? 'border-orange-100 bg-orange-50/40'
                  : 'border-gray-100 bg-gray-50 opacity-50'
              }`}
            >
              {/* Toggle */}
              <button
                type="button"
                onClick={() => onToggleRow(row.id)}
                className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                  row.enabled ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'
                }`}
              >
                {row.enabled && <Check size={10} className="text-white" strokeWidth={3} />}
              </button>

              {/* Name */}
              {row.isEditing ? (
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) => onUpdateName(row.id, e.target.value)}
                  onBlur={() => onSetEditing(row.id, false)}
                  onKeyDown={(e) => e.key === 'Enter' && onSetEditing(row.id, false)}
                  autoFocus
                  className="flex-1 text-sm font-medium text-gray-800 bg-white border border-orange-300 rounded-lg px-2 py-0.5 outline-none focus:ring-1 focus:ring-orange-400"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onSetEditing(row.id, true)}
                  className="flex-1 text-left text-sm font-medium text-gray-800 flex items-center gap-1 group"
                >
                  {row.name}
                  <Pencil size={10} className="text-gray-300 group-hover:text-orange-400 transition-colors" />
                </button>
              )}

              {/* Amount */}
              <div className="relative w-28 flex-shrink-0">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">NRs</span>
                <input
                  type="number"
                  value={row.amount || ''}
                  onChange={(e) => onUpdateAmount(row.id, e.target.value)}
                  disabled={!row.enabled}
                  className="w-full pl-8 pr-2 py-1 text-xs text-right rounded-lg border border-gray-200 bg-white focus:border-orange-400 focus:ring-1 focus:ring-orange-200 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>

              {/* % badge */}
              <span className="text-xs text-gray-400 w-8 text-right flex-shrink-0">{row.percentage}%</span>

              {/* Delete */}
              <button
                type="button"
                onClick={() => onRemoveRow(row.id)}
                className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add custom category */}
        {showAddRow ? (
          <div className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-orange-300 bg-orange-50/30">
            <input
              type="text"
              placeholder="Category name"
              value={newCatName}
              onChange={(e) => onNewCatNameChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAddCustomRow()}
              autoFocus
              className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-orange-400"
            />
            <div className="relative w-28 flex-shrink-0">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">NRs</span>
              <input
                type="number"
                placeholder="0"
                value={newCatAmount}
                onChange={(e) => onNewCatAmountChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onAddCustomRow()}
                className="w-full pl-8 pr-2 py-1 text-xs text-right border border-gray-200 rounded-lg outline-none focus:border-orange-400"
              />
            </div>
            <button type="button" onClick={onAddCustomRow} className="text-orange-500 hover:text-orange-600 font-semibold text-xs px-2">
              Add
            </button>
            <button type="button" onClick={onToggleAddRow} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onToggleAddRow}
            className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors"
          >
            <Plus size={15} />
            Add custom category
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors px-2"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSave}
          disabled={isSaving || enabledCount === 0 || isOverAllocated}
          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <>Save & Continue <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg></>
          )}
        </motion.button>
      </div>
    </>
  );
}