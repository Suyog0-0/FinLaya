'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Category } from '@/components/(user)/categories/utils';
import MonthlySalaryBox from '@/components/(user)/categories/MonthlySalaryBox';
import AllocationOverviewBox from '@/components/(user)/categories/AllocationOverviewBox';
import CategoryCard from '@/components/(user)/categories/CategoryCard';
import AddCategoryCard from '@/components/(user)/categories/AddCategoryCard';

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
  // Bump to trigger a re-fetch without useCallback (avoids cascading setState lint error)
  const [trigger, setTrigger] = useState(0);
  const refetch = () => setTrigger((t) => t + 1);

  // ── Fetch all data ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

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

      const monthlySalary = userResult.data
        ? Number(userResult.data.monthly_salary)
        : 0;

      const spentMap: Record<number, number> = {};
      (expResult.data || []).forEach((e) => {
        if (e.category_id) {
          spentMap[e.category_id] =
            (spentMap[e.category_id] || 0) + Number(e.amount);
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
      setSalaryInput((prev) =>
        prev === '' || prev === '0' ? String(monthlySalary || '') : prev
      );
      setCategories(cats);
      setIsLoading(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id, trigger]);

  // ── Save salary ─────────────────────────────────────────────────────────────
  const handleSaveSalary = async () => {
    const val = parseFloat(salaryInput);
    if (!val || val <= 0) {
      setSalaryError('Please enter a valid salary');
      return;
    }
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
    if (
      !confirm(
        'Delete this category? Expenses linked to it will become uncategorized.'
      )
    )
      return;
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
            onClick={() => {
              setShowAddCard(true);
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-sm shadow-md transition-all"
          >
            <Plus size={16} />
            Add Category
          </button>
        </div>

        {/* ── Salary box ───────────────────────────────────────────────────── */}
        <MonthlySalaryBox
          salaryInput={salaryInput}
          salary={salary}
          isSaving={isSalarySaving}
          isSaved={salarySaved}
          error={salaryError}
          onChange={(val) => {
            setSalaryInput(val);
            setSalaryError('');
            setSalarySaved(false);
          }}
          onSave={handleSaveSalary}
        />

        {/* ── Allocation overview ───────────────────────────────────────────── */}
        <AllocationOverviewBox
          salary={salary}
          totalBudget={totalBudget}
          totalSpent={totalSpent}
        />

        {/* ── Category grid ─────────────────────────────────────────────────── */}
        {categories.length === 0 && !showAddCard ? (
          <div className="text-center py-20 text-gray-400">
            <Tag size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No categories yet</p>
            <p className="text-sm mt-1">
              Click &quot;Add Category&quot; to get started
            </p>
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