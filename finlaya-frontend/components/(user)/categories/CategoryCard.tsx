'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Category, getCategoryIcon, getBarColor, formatNRs } from './utils';

interface CategoryCardProps {
  cat: Category;
  salary: number;
  onDelete: (id: number) => void;
  onSaveEdit: (id: number, name: string, budget: number) => Promise<void>;
}

export default function CategoryCard({
  cat,
  salary,
  onDelete,
  onSaveEdit,
}: CategoryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(cat.category_name);
  const [editBudget, setEditBudget] = useState(String(cat.budget_limit));
  const [saving, setSaving] = useState(false);

  const { Icon, colorClass } = getCategoryIcon(cat.category_name);
  const budget = cat.budget_limit;
  const spent = cat.spent;
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const salaryPct = salary > 0 ? Math.round((budget / salary) * 100) : cat.allocation_percentage;
  const barColor = getBarColor(spent, budget);
  const isOver = spent > budget && budget > 0;

  const editPct =
    salary > 0 && editBudget
      ? Math.round((parseFloat(editBudget) / salary) * 100)
      : 0;

  const handleSave = async () => {
    setSaving(true);
    await onSaveEdit(
      cat.category_id,
      editName.trim() || cat.category_name,
      parseFloat(editBudget) || 0
    );
    setSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(cat.category_name);
    setEditBudget(String(cat.budget_limit));
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      className={`bg-white rounded-2xl border p-5 flex flex-col gap-3 transition-shadow hover:shadow-md ${
        isEditing ? 'border-orange-300 shadow-md' : 'border-gray-100 shadow-sm'
      }`}
    >
      {/* Top row: icon + action buttons */}
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}
        >
          <Icon size={20} />
        </div>

        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors"
                title="Save"
              >
                {saving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full"
                  />
                ) : (
                  <Check size={16} />
                )}
              </button>
              <button
                onClick={handleCancel}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                title="Cancel"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                title="Edit"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => onDelete(cat.category_id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Name / edit fields */}
      {isEditing ? (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1">Name</label>
            <input
              autoFocus
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 text-gray-800 font-semibold"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1">
              Budget{' '}
              {editPct > 0 && (
                <span className="text-orange-500">({editPct}% of salary)</span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                NRs
              </span>
              <input
                type="number"
                value={editBudget}
                onChange={(e) => setEditBudget(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                min="0"
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 text-gray-800"
              />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h3 className="font-bold text-gray-900 text-base leading-tight">
            {cat.category_name}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">{salaryPct}% of salary</p>
        </div>
      )}

      {/* Progress bar (hidden while editing) */}
      {!isEditing && (
        <div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span
              className={`text-xs font-semibold ${
                isOver ? 'text-red-500' : 'text-orange-500'
              }`}
            >
              {isOver ? '⚠ ' : ''}
              {formatNRs(spent)} spent
            </span>
            <span className="text-xs text-gray-500">{formatNRs(budget)}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}