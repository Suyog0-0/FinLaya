'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface AddCategoryCardProps {
  salary: number;
  onSave: (name: string, budget: number) => Promise<void>;
  onCancel: () => void;
}

export default function AddCategoryCard({
  salary,
  onSave,
  onCancel,
}: AddCategoryCardProps) {
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const pct =
    salary > 0 && budget
      ? Math.round((parseFloat(budget) / salary) * 100)
      : 0;

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    await onSave(name.trim(), parseFloat(budget) || 0);
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl border-2 border-dashed border-orange-300 p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-orange-500">New Category</span>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Name input */}
      <div>
        <label className="text-xs text-gray-500 font-medium mb-1 block">
          Category Name
        </label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="e.g. Dining Out"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 text-gray-800"
        />
      </div>

      {/* Budget input */}
      <div>
        <label className="text-xs text-gray-500 font-medium mb-1 block">
          Budget Amount{' '}
          {pct > 0 && (
            <span className="text-orange-500 ml-1">({pct}% of salary)</span>
          )}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">
            NRs
          </span>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="0"
            min="0"
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 text-gray-800"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {saving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <>
              <Check size={14} /> Save
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}