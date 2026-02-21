'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash2, Check, X,
  Home, ShoppingBag, Car, Film, Heart,
  PiggyBank, Zap, MoreHorizontal, Tag,
  Utensils, Wifi, Plane, Music, Book,
  Dumbbell, Coffee, Gift, Briefcase,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category {
  category_id: number;
  category_name: string;
  allocation_percentage: number;
  budget_limit: number;
  current_balance: number;
  spent: number; // computed from this month's expenses
}

// ─── Icon map (auto-assign by name) ──────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  housing: Home,
  home: Home,
  rent: Home,
  food: Utensils,
  groceries: ShoppingBag,
  shopping: ShoppingBag,
  transport: Car,
  transportation: Car,
  commute: Car,
  travel: Plane,
  entertainment: Film,
  movies: Film,
  music: Music,
  health: Heart,
  medical: Heart,
  fitness: Dumbbell,
  gym: Dumbbell,
  savings: PiggyBank,
  saving: PiggyBank,
  utilities: Zap,
  bills: Zap,
  internet: Wifi,
  wifi: Wifi,
  education: Book,
  books: Book,
  coffee: Coffee,
  cafe: Coffee,
  gift: Gift,
  gifts: Gift,
  work: Briefcase,
  business: Briefcase,
  other: MoreHorizontal,
  others: MoreHorizontal,
  misc: MoreHorizontal,
};

const ICON_COLOR_MAP: Record<string, string> = {
  housing: 'text-orange-500 bg-orange-50',
  home: 'text-orange-500 bg-orange-50',
  rent: 'text-orange-500 bg-orange-50',
  food: 'text-yellow-500 bg-yellow-50',
  groceries: 'text-yellow-500 bg-yellow-50',
  shopping: 'text-yellow-500 bg-yellow-50',
  transport: 'text-amber-500 bg-amber-50',
  transportation: 'text-amber-500 bg-amber-50',
  travel: 'text-sky-500 bg-sky-50',
  entertainment: 'text-orange-500 bg-orange-50',
  music: 'text-purple-500 bg-purple-50',
  health: 'text-green-500 bg-green-50',
  medical: 'text-green-500 bg-green-50',
  fitness: 'text-teal-500 bg-teal-50',
  gym: 'text-teal-500 bg-teal-50',
  savings: 'text-orange-500 bg-orange-50',
  saving: 'text-orange-500 bg-orange-50',
  utilities: 'text-yellow-500 bg-yellow-50',
  bills: 'text-yellow-500 bg-yellow-50',
  internet: 'text-blue-500 bg-blue-50',
  education: 'text-indigo-500 bg-indigo-50',
  coffee: 'text-amber-600 bg-amber-50',
  gift: 'text-pink-500 bg-pink-50',
  work: 'text-gray-600 bg-gray-100',
  business: 'text-gray-600 bg-gray-100',
  other: 'text-gray-400 bg-gray-100',
  others: 'text-gray-400 bg-gray-100',
};

function getCategoryIcon(name: string): { Icon: React.ElementType; colorClass: string } {
  const key = name.toLowerCase().trim();
  // exact match first
  if (ICON_MAP[key]) {
    return {
      Icon: ICON_MAP[key],
      colorClass: ICON_COLOR_MAP[key] || 'text-orange-500 bg-orange-50',
    };
  }
  // partial match
  for (const k of Object.keys(ICON_MAP)) {
    if (key.includes(k) || k.includes(key)) {
      return {
        Icon: ICON_MAP[k],
        colorClass: ICON_COLOR_MAP[k] || 'text-orange-500 bg-orange-50',
      };
    }
  }
  return { Icon: Tag, colorClass: 'text-orange-500 bg-orange-50' };
}

// ─── Progress bar color ───────────────────────────────────────────────────────
function getBarColor(spent: number, budget: number) {
  if (budget === 0) return 'bg-gray-300';
  const pct = (spent / budget) * 100;
  if (pct >= 100) return 'bg-red-500';
  if (pct >= 80) return 'bg-amber-500';
  return 'bg-gradient-to-r from-amber-400 to-orange-500';
}

function formatNRs(n: number) {
  return `NRs ${Math.round(n).toLocaleString('en-IN')}`;
}

// ─── Inline Add Card ──────────────────────────────────────────────────────────
function AddCategoryCard({
  salary,
  onSave,
  onCancel,
}: {
  salary: number;
  onSave: (name: string, budget: number) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const pct = salary > 0 && budget ? Math.round((parseFloat(budget) / salary) * 100) : 0;

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    const amt = parseFloat(budget) || 0;
    setSaving(true);
    await onSave(name.trim(), amt);
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl border-2 border-dashed border-orange-300 p-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-orange-500">New Category</span>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div>
        <label className="text-xs text-gray-500 font-medium mb-1 block">Category Name</label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="e.g. Dining Out"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 text-gray-800"
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 font-medium mb-1 block">
          Budget Amount {pct > 0 && <span className="text-orange-500 ml-1">({pct}% of salary)</span>}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">NRs</span>
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
            <><Check size={14} /> Save</>
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Category Card ────────────────────────────────────────────────────────────
function CategoryCard({
  cat,
  salary,
  onDelete,
  onSaveEdit,
}: {
  cat: Category;
  salary: number;
  onDelete: (id: number) => void;
  onSaveEdit: (id: number, name: string, budget: number) => Promise<void>;
}) {
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

  const editPct = salary > 0 && editBudget
    ? Math.round((parseFloat(editBudget) / salary) * 100)
    : 0;

  const handleSaveEdit = async () => {
    setSaving(true);
    await onSaveEdit(cat.category_id, editName.trim() || cat.category_name, parseFloat(editBudget) || 0);
    setSaving(false);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
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
      {/* Top row: icon + actions */}
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon size={20} />
        </div>

        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdit}
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
                onClick={handleCancelEdit}
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

      {/* Name */}
      {isEditing ? (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1">Name</label>
            <input
              autoFocus
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 text-gray-800 font-semibold"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1">
              Budget {editPct > 0 && <span className="text-orange-500">({editPct}% of salary)</span>}
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">NRs</span>
              <input
                type="number"
                value={editBudget}
                onChange={(e) => setEditBudget(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                min="0"
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 text-gray-800"
              />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h3 className="font-bold text-gray-900 text-base leading-tight">{cat.category_name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{salaryPct}% of salary</p>
        </div>
      )}

      {/* Progress bar */}
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
            <span className={`text-xs font-semibold ${isOver ? 'text-red-500' : 'text-orange-500'}`}>
              {isOver ? '⚠ ' : ''}{formatNRs(spent)} spent
            </span>
            <span className="text-xs text-gray-500">{formatNRs(budget)}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CategoriesMainContent() {
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [salary, setSalary] = useState(0);
  const [salaryInput, setSalaryInput] = useState('');
  const [isSalarySaving, setIsSalarySaving] = useState(false);
  const [salarySaved, setSalarySaved] = useState(false);
  const [salaryError, setSalaryError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  // Trigger refetch by bumping this counter — avoids useCallback setState lint error
  const [trigger, setTrigger] = useState(0);
  const refetch = () => setTrigger((t) => t + 1);

  // ── Fetch all data ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const [catResult, expResult, userResult] = await Promise.all([
        supabase
          .from('budget_categories')
          .select('category_id, category_name, allocation_percentage, budget_limit, current_balance')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),

        supabase
          .from('expenses')
          .select('amount, category_id')
          .eq('user_id', user.id)
          .gte('expense_date', monthStart)
          .lte('expense_date', monthEnd),

        supabase
          .from('users')
          .select('monthly_salary')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      const monthlySalary = userResult.data ? Number(userResult.data.monthly_salary) : 0;

      const spentMap: Record<number, number> = {};
      (expResult.data || []).forEach((e) => {
        if (e.category_id) {
          spentMap[e.category_id] = (spentMap[e.category_id] || 0) + Number(e.amount);
        }
      });

      const cats: Category[] = (catResult.data || []).map((c) => ({
        category_id: c.category_id,
        category_name: c.category_name,
        allocation_percentage: Number(c.allocation_percentage),
        budget_limit: Number(c.budget_limit),
        current_balance: Number(c.current_balance),
        spent: Math.round(spentMap[c.category_id] || 0),
      }));

      setSalary(monthlySalary);
      setSalaryInput((prev) => (prev === '' || prev === '0') ? String(monthlySalary || '') : prev);
      setCategories(cats);
      setIsLoading(false);
    };

    run();
    return () => { cancelled = true; };
  }, [user?.id, trigger]);

  // ── Save salary ─────────────────────────────────────────────────────────────
  const handleSaveSalary = async () => {
    const val = parseFloat(salaryInput);
    if (!val || val <= 0) { setSalaryError('Please enter a valid salary'); return; }
    setIsSalarySaving(true);
    setSalaryError('');

    const { error } = await supabase
      .from('users')
      .update({ monthly_salary: val, updated_at: new Date().toISOString() })
      .eq('user_id', user!.id);

    setIsSalarySaving(false);
    if (error) {
      setSalaryError('Failed to save. Try again.');
    } else {
      setSalary(val);
      setSalarySaved(true);
      setTimeout(() => setSalarySaved(false), 2000);
      refetch();
    }
  };

  // ── Add category ────────────────────────────────────────────────────────────
  const handleAddCategory = async (name: string, budget: number) => {
    if (!user?.id) return;
    const pct = salary > 0 ? Math.round((budget / salary) * 100) : 0;

    const { error } = await supabase.from('budget_categories').insert({
      user_id: user.id,
      category_name: name,
      allocation_percentage: pct,
      budget_limit: budget,
      current_balance: budget,
    });

    if (!error) {
      setShowAddCard(false);
      refetch();
    }
  };

  // ── Edit category (inline) ──────────────────────────────────────────────────
  const handleSaveEdit = async (id: number, name: string, budget: number) => {
    if (!user?.id) return;
    const pct = salary > 0 ? Math.round((budget / salary) * 100) : 0;

    await supabase
      .from('budget_categories')
      .update({
        category_name: name,
        budget_limit: budget,
        allocation_percentage: pct,
        updated_at: new Date().toISOString(),
      })
      .eq('category_id', id)
      .eq('user_id', user.id);

    refetch();
  };

  // ── Delete category ─────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category? Expenses linked to it will become uncategorized.')) return;
    if (!user?.id) return;

    await supabase
      .from('expenses')
      .update({ category_id: null })
      .eq('category_id', id)
      .eq('user_id', user.id);

    await supabase
      .from('budget_categories')
      .delete()
      .eq('category_id', id)
      .eq('user_id', user.id);

    refetch();
  };

  // ── Derived totals ──────────────────────────────────────────────────────────
  const totalBudget = categories.reduce((s, c) => s + c.budget_limit, 0);
  const totalSpent = categories.reduce((s, c) => s + c.spent, 0);
  const remaining = totalBudget - totalSpent;
  const allocatedPct = salary > 0 ? Math.min((totalBudget / salary) * 100, 100) : 0;

  const salaryChanged = parseFloat(salaryInput) !== salary;

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 w-56 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-80 bg-gray-100 rounded mb-8" />
        <div className="h-24 bg-gray-200 rounded-2xl mb-6" />
        <div className="h-36 bg-gray-200 rounded-2xl mb-8" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-44 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budget Categories</h1>
            <p className="text-gray-500 text-sm mt-1">
              Allocate your salary into different spending categories
            </p>
          </div>
          <button
            onClick={() => { setShowAddCard(true); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all"
          >
            <Plus size={16} />
            Add Category
          </button>
        </div>

        {/* ── Salary input card ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-semibold text-gray-900">Monthly Salary</p>
              <p className="text-sm text-gray-400 mt-0.5">
                Enter your monthly income to auto-calculate budgets
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                <span className="text-sm text-gray-500 font-medium">NRs</span>
                <input
                  type="number"
                  value={salaryInput}
                  onChange={(e) => { setSalaryInput(e.target.value); setSalaryError(''); setSalarySaved(false); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveSalary()}
                  placeholder="0"
                  min="0"
                  className="w-32 text-sm text-gray-900 font-semibold bg-transparent outline-none"
                />
              </div>
              <AnimatePresence mode="wait">
                {salarySaved ? (
                  <motion.div
                    key="saved"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-green-600 text-sm font-medium"
                  >
                    <Check size={15} /> Saved!
                  </motion.div>
                ) : (
                  <motion.button
                    key="btn"
                    onClick={handleSaveSalary}
                    disabled={isSalarySaving || !salaryChanged}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSalarySaving ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : 'Save'}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
          {salaryError && (
            <p className="text-xs text-red-500 mt-2">{salaryError}</p>
          )}
        </div>

        {/* ── Allocation overview card ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-gray-700">Allocation Overview</p>
            <span className={`text-sm font-semibold ${allocatedPct >= 100 ? 'text-red-500' : 'text-orange-500'}`}>
              {Math.round(allocatedPct)}% of salary
            </span>
          </div>

          {/* Allocation bar */}
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
            <motion.div
              className={`h-full rounded-full ${allocatedPct >= 100 ? 'bg-red-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${allocatedPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>

          {/* 4 summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Monthly Salary', value: formatNRs(salary), color: 'text-gray-900' },
              { label: 'Total Budget', value: formatNRs(totalBudget), color: 'text-gray-900' },
              { label: 'Total Spent', value: formatNRs(totalSpent), color: 'text-gray-900' },
              {
                label: 'Remaining',
                value: formatNRs(remaining),
                color: remaining >= 0 ? 'text-green-600' : 'text-red-500',
              },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Category grid ─────────────────────────────────────────────────── */}
        {categories.length === 0 && !showAddCard ? (
          <div className="text-center py-20 text-gray-400">
            <Tag size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No categories yet</p>
            <p className="text-sm mt-1">Click &quot;Add Category&quot; to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.category_id}
                  cat={cat}
                  salary={salary}
                  onDelete={handleDelete}
                  onSaveEdit={handleSaveEdit}
                />
              ))}

              {showAddCard && (
                <AddCategoryCard
                  key="add-card"
                  salary={salary}
                  onSave={handleAddCategory}
                  onCancel={() => setShowAddCard(false)}
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}