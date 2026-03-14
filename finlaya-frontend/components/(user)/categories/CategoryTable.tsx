'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Tag, Pencil, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { Category, getCategoryIcon, formatNRs } from './utils';
import ProgressBar from './ProgressBar';

// ── Color accent per category name ────────────────────────────────────────────
// Returns a left-border color and a subtle row tint for visual variety.
const ROW_ACCENTS: Record<string, { border: string; tint: string }> = {
  Housing:        { border: 'border-l-yellow-400',  tint: 'bg-yellow-50/30'  },
  Food:           { border: 'border-l-orange-400',  tint: 'bg-orange-50/30'  },
  Transportation: { border: 'border-l-blue-400',    tint: 'bg-blue-50/20'    },
  Transport:      { border: 'border-l-blue-400',    tint: 'bg-blue-50/20'    },
  Utilities:      { border: 'border-l-gray-400',    tint: 'bg-gray-50/40'    },
  Health:         { border: 'border-l-teal-400',    tint: 'bg-teal-50/20'    },
  Entertainment:  { border: 'border-l-purple-400',  tint: 'bg-purple-50/20'  },
  Savings:        { border: 'border-l-emerald-400', tint: 'bg-emerald-50/20' },
  Others:         { border: 'border-l-gray-300',    tint: 'bg-gray-50/30'    },
  Other:          { border: 'border-l-gray-300',    tint: 'bg-gray-50/30'    },
};
const DEFAULT_ACCENT = { border: 'border-l-indigo-400', tint: 'bg-indigo-50/20' };

function getAccent(name: string) {
  return ROW_ACCENTS[name] ?? DEFAULT_ACCENT;
}

// ── View row ───────────────────────────────────────────────────────────────────
function CategoryRow({
  cat, salary, onEdit, onDelete,
}: {
  cat: Category; salary: number;
  onEdit: () => void; onDelete: (id: number) => void;
}) {
  const { Icon, colorClass } = getCategoryIcon(cat.category_name);
  const { border, tint }     = getAccent(cat.category_name);
  const remaining = cat.budget_limit - cat.spent;
  const isOver    = cat.spent > cat.budget_limit && cat.budget_limit > 0;
  const salaryPct = salary > 0
    ? Math.min(Math.round((cat.budget_limit / salary) * 100), 100)
    : cat.allocation_percentage;

  return (
    <tr className={`border-b border-gray-50 border-l-4 ${border} ${tint} hover:brightness-[0.98] transition-all group`}>
      {/* Category name + icon */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
            <Icon size={15} strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{cat.category_name}</p>
            <p className="text-xs text-gray-400">{salaryPct}% of salary</p>
          </div>
        </div>
      </td>

      {/* Budget */}
      <td className="px-5 py-3.5">
        <span className="text-sm text-gray-700 tabular-nums font-medium">
          {formatNRs(cat.budget_limit)}
        </span>
      </td>

      {/* Spent — red tint if over */}
      <td className="px-5 py-3.5">
        <span className={`text-sm tabular-nums font-medium ${isOver ? 'text-red-500' : 'text-gray-700'}`}>
          {isOver && <span className="mr-1 text-xs">⚠</span>}
          {formatNRs(cat.spent)}
        </span>
      </td>

      {/* Remaining — green if positive, red if negative */}
      <td className="px-5 py-3.5 hidden md:table-cell">
        <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums ${
          remaining < 0
            ? 'bg-red-100 text-red-600'
            : remaining === 0
              ? 'bg-gray-100 text-gray-500'
              : 'bg-emerald-100 text-emerald-700'
        }`}>
          {remaining < 0 ? '-' : ''}{formatNRs(Math.abs(remaining))}
        </span>
      </td>

      {/* Progress bar */}
      <td className="px-5 py-3.5 hidden lg:table-cell w-40">
        <ProgressBar spent={cat.spent} budget={cat.budget_limit} />
      </td>

      {/* Actions */}
      <td className="px-5 py-3.5">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors opacity-0 group-hover:opacity-100"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(cat.category_id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Edit row ───────────────────────────────────────────────────────────────────
function EditCategoryRow({
  cat, salary, onSave, onCancel,
}: {
  cat: Category; salary: number;
  onSave: (id: number, name: string, budget: number) => Promise<void>;
  onCancel: () => void;
}) {
  const [editName,   setEditName]   = useState(cat.category_name);
  const [editBudget, setEditBudget] = useState(String(cat.budget_limit));
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const budgetNum = parseFloat(editBudget) || 0;
  const pct       = salary > 0 && budgetNum > 0
    ? Math.min(Math.round((budgetNum / salary) * 100), 100)
    : 0;

  const handleSave = async () => {
    if (salary > 0 && budgetNum > salary) {
      setError(`Cannot exceed salary (${formatNRs(salary)})`);
      return;
    }
    setError('');
    setSaving(true);
    await onSave(cat.category_id, editName.trim() || cat.category_name, budgetNum);
    setSaving(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <tr className="border-b border-orange-100 border-l-4 border-l-orange-400 bg-orange-50/30">
      <td className="px-5 py-2.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Tag size={14} className="text-orange-500" />
          </div>
          <input
            ref={nameRef}
            type="text" value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Category name"
            className="text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 w-full"
          />
        </div>
      </td>

      <td className="px-5 py-2.5" colSpan={2}>
        <div className="flex flex-col gap-1">
          <div className="relative w-40">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">NRs</span>
            <input
              type="number" value={editBudget}
              onChange={(e) => { setEditBudget(e.target.value); setError(''); }}
              onKeyDown={handleKey}
              min="0" placeholder="0"
              className={`text-sm text-gray-800 border rounded-lg pl-9 pr-2.5 py-1.5 outline-none focus:ring-2 w-full tabular-nums ${
                error ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-gray-200 focus:border-orange-400 focus:ring-orange-100'
              }`}
            />
          </div>
          {pct > 0 && !error && (
            <span className="text-xs text-orange-500 font-medium">{pct}% of salary</span>
          )}
          {error && (
            <span className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={10} /> {error}
            </span>
          )}
        </div>
      </td>

      <td className="hidden md:table-cell" />
      <td className="hidden lg:table-cell" />

      <td className="px-5 py-2.5">
        <div className="flex items-center justify-end gap-1">
          <button onClick={handleSave} disabled={saving}
            className="p-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-50" title="Save">
            {saving
              ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Check size={14} />}
          </button>
          <button onClick={onCancel}
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors" title="Cancel">
            <X size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Add row ────────────────────────────────────────────────────────────────────
function AddCategoryRow({
  salary, onSave, onCancel,
}: {
  salary: number;
  onSave: (name: string, budget: number) => Promise<void>;
  onCancel: () => void;
}) {
  const [name,   setName]   = useState('');
  const [budget, setBudget] = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const budgetNum = parseFloat(budget) || 0;
  const pct       = salary > 0 && budgetNum > 0
    ? Math.min(Math.round((budgetNum / salary) * 100), 100)
    : 0;

  const handleSave = async () => {
    if (!name.trim())                      { setError('Name is required'); return; }
    if (salary > 0 && budgetNum > salary)  { setError('Cannot exceed salary'); return; }
    setError('');
    setSaving(true);
    await onSave(name.trim(), budgetNum);
    setSaving(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <tr className="border-b border-dashed border-orange-200 border-l-4 border-l-orange-300 bg-orange-50/20">
      <td className="px-5 py-2.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg border-2 border-dashed border-orange-200 flex items-center justify-center flex-shrink-0">
            <Plus size={13} className="text-orange-400" />
          </div>
          <input
            ref={nameRef}
            type="text" value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            onKeyDown={handleKey}
            placeholder="Category name..."
            className="text-sm font-medium text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 w-full placeholder-gray-300"
          />
        </div>
      </td>

      <td className="px-5 py-2.5" colSpan={2}>
        <div className="flex flex-col gap-1">
          <div className="relative w-40">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">NRs</span>
            <input
              type="number" value={budget}
              onChange={(e) => { setBudget(e.target.value); setError(''); }}
              onKeyDown={handleKey}
              min="0" placeholder="0"
              className="text-sm text-gray-800 border border-gray-200 rounded-lg pl-9 pr-2.5 py-1.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 w-full tabular-nums placeholder-gray-300"
            />
          </div>
          {pct > 0 && !error && (
            <span className="text-xs text-orange-500 font-medium">{pct}% of salary</span>
          )}
          {error && (
            <span className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={10} /> {error}
            </span>
          )}
        </div>
      </td>

      <td className="hidden md:table-cell" />
      <td className="hidden lg:table-cell" />

      <td className="px-5 py-2.5">
        <div className="flex items-center justify-end gap-1">
          <button onClick={handleSave} disabled={saving}
            className="p-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-50" title="Add">
            {saving
              ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Check size={14} />}
          </button>
          <button onClick={onCancel}
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors" title="Cancel">
            <X size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Table shell ────────────────────────────────────────────────────────────────
interface CategoryTableProps {
  categories:       Category[];
  editingId:        number | null;
  showAddRow:       boolean;
  budgetableSalary: number;
  totalBudget:      number;
  totalSpent:       number;
  onEdit:           (id: number) => void;
  onCancelEdit:     () => void;
  onSaveEdit:       (id: number, name: string, budget: number) => Promise<void>;
  onDelete:         (id: number) => void;
  onAddSave:        (name: string, budget: number) => Promise<void>;
  onAddCancel:      () => void;
  onAddClick:       () => void;
}

export default function CategoryTable({
  categories, editingId, showAddRow, budgetableSalary,
  totalBudget, totalSpent,
  onEdit, onCancelEdit, onSaveEdit, onDelete,
  onAddSave, onAddCancel, onAddClick,
}: CategoryTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60">
            <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">
              Category
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">
              Budget
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">
              Spent
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5 hidden md:table-cell">
              Remaining
            </th>
            <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5 hidden lg:table-cell">
              Progress
            </th>
            <th className="px-5 py-3.5 w-20 text-right">
              <button
                onClick={onAddClick}
                disabled={showAddRow}
                title="Add category"
                className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            </th>
          </tr>
        </thead>

        <tbody>
          {categories.map((cat) =>
            editingId === cat.category_id ? (
              <EditCategoryRow
                key={cat.category_id} cat={cat} salary={budgetableSalary}
                onSave={onSaveEdit} onCancel={onCancelEdit}
              />
            ) : (
              <CategoryRow
                key={cat.category_id} cat={cat} salary={budgetableSalary}
                onEdit={() => onEdit(cat.category_id)} onDelete={onDelete}
              />
            )
          )}

          {showAddRow && (
            <AddCategoryRow salary={budgetableSalary} onSave={onAddSave} onCancel={onAddCancel} />
          )}
        </tbody>

        {categories.length > 0 && (
          <tfoot>
            <tr className="border-t-2 border-gray-100 bg-gray-50/60">
              <td className="px-5 py-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Total ({categories.length})
                </span>
              </td>
              <td className="px-5 py-3">
                <span className="text-sm font-bold text-gray-800 tabular-nums">{formatNRs(totalBudget)}</span>
              </td>
              <td className="px-5 py-3">
                <span className={`text-sm font-bold tabular-nums ${totalSpent > totalBudget ? 'text-red-500' : 'text-gray-800'}`}>
                  {formatNRs(totalSpent)}
                </span>
              </td>
              <td className="px-5 py-3 hidden md:table-cell">
                <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums ${
                  totalBudget - totalSpent < 0
                    ? 'bg-red-100 text-red-600'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {totalBudget - totalSpent < 0 ? '-' : ''}{formatNRs(Math.abs(totalBudget - totalSpent))}
                </span>
              </td>
              <td className="hidden lg:table-cell" />
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}