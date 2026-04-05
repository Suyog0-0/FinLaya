'use client';

import { useState, useEffect } from 'react';
import { Plus, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Category } from '@/components/(user)/categories/utils';
import MonthlySalaryBox from '@/components/(user)/categories/MonthlySalaryBox';
import AllocationOverviewBox from '@/components/(user)/categories/AllocationOverviewBox';
import CategoryTable from '@/components/(user)/categories/CategoryTable';

export const dynamic = 'force-static';
export const revalidate = 60;

export default function CategoriesMainContent() {
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [salary, setSalary] = useState(0);
  const [emiTotal, setEmiTotal] = useState(0);
  const [salaryInput, setSalaryInput] = useState('');
  const [isSalarySaving, setIsSalarySaving] = useState(false);
  const [salarySaved, setSalarySaved] = useState(false);
  const [salaryError, setSalaryError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddRow, setShowAddRow] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refetch = () => setTrigger((t) => t + 1);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const [catResult, expResult, userResult, emiResult] = await Promise.all([
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
        supabase
          .from('emi_payments')
          .select('emi_amount')
          .eq('user_id', user.id)
          .eq('is_active', true),
      ]);

      if (cancelled) return;

      const monthlySalary = userResult.data ? Number(userResult.data.monthly_salary) : 0;
      const totalEMI = (emiResult.data || []).reduce((sum, e) => sum + Number(e.emi_amount), 0);

      const spentMap: Record<number, number> = {};
      (expResult.data || []).forEach((e) => {
        if (e.category_id) spentMap[e.category_id] = (spentMap[e.category_id] || 0) + Number(e.amount);
      });

      const cats: Category[] = (catResult.data || []).map((c) => ({
        category_id:           c.category_id,
        category_name:         c.category_name,
        allocation_percentage: Number(c.allocation_percentage),
        budget_limit:          Number(c.budget_limit),
        current_balance:       Number(c.current_balance),
        spent:                 Math.round(spentMap[c.category_id] || 0),
      }));

      setSalary(monthlySalary);
      setEmiTotal(totalEMI);
      setSalaryInput((prev) => prev === '' || prev === '0' ? String(monthlySalary || '') : prev);
      setCategories(cats);
      setIsLoading(false);
    };

    run();
    return () => { cancelled = true; };
  }, [user?.id, trigger]);

  const budgetableSalary = Math.max(0, salary - emiTotal);
  const totalBudget = categories.reduce((s, c) => s + c.budget_limit, 0);
  const totalSpent  = categories.reduce((s, c) => s + c.spent, 0);

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

  const handleAddCategory = async (name: string, budget: number) => {
    if (!user?.id) return;
    const pct = budgetableSalary > 0 ? Math.round((budget / budgetableSalary) * 100) : 0;
    const { error } = await supabase.from('budget_categories').insert({
      user_id:               user.id,
      category_name:         name,
      allocation_percentage: pct,
      budget_limit:          budget,
      current_balance:       budget,
    });
    if (!error) { setShowAddRow(false); refetch(); }
  };

  const handleSaveEdit = async (id: number, name: string, budget: number) => {
    if (!user?.id) return;
    const pct = budgetableSalary > 0 ? Math.round((budget / budgetableSalary) * 100) : 0;
    await supabase
      .from('budget_categories')
      .update({ category_name: name, budget_limit: budget, allocation_percentage: pct, updated_at: new Date().toISOString() })
      .eq('category_id', id)
      .eq('user_id', user.id);
    setEditingId(null);
    refetch();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category? Expenses linked to it will become uncategorized.')) return;
    if (!user?.id) return;
    await supabase.from('expenses').update({ category_id: null }).eq('category_id', id).eq('user_id', user.id);
    await supabase.from('budget_categories').delete().eq('category_id', id).eq('user_id', user.id);
    refetch();
  };

  // ── Skeleton — always dark-mode aware, no white flash ──────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] transition-colors px-6 py-8 max-w-5xl mx-auto animate-pulse">
        <div className="h-8 w-56 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-4 w-80 bg-gray-100 dark:bg-gray-700/60 rounded mb-8" />
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-5" />
        <div className="h-36 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-6" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] transition-colors">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Budget Categories</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Allocate your salary into different spending categories</p>
        </div>

        <MonthlySalaryBox
          salaryInput={salaryInput}
          salary={salary}
          isSaving={isSalarySaving}
          isSaved={salarySaved}
          error={salaryError}
          onChange={(val) => { setSalaryInput(val); setSalaryError(''); setSalarySaved(false); }}
          onSave={handleSaveSalary}
        />

        <AllocationOverviewBox
          salary={salary}
          emiTotal={emiTotal}
          totalBudget={totalBudget}
          totalSpent={totalSpent}
        />

        {/* Empty state */}
        {categories.length === 0 && !showAddRow ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center py-20 text-center transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mb-3">
              <Tag size={20} className="text-orange-400" />
            </div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">No categories yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">Click &quot;Add Category&quot; to get started</p>
            <button
              onClick={() => setShowAddRow(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus size={14} /> Add Category
            </button>
          </div>
        ) : (
          <CategoryTable
            categories={categories}
            editingId={editingId}
            showAddRow={showAddRow}
            budgetableSalary={budgetableSalary}
            totalBudget={totalBudget}
            totalSpent={totalSpent}
            onEdit={(id) => { setEditingId(id); setShowAddRow(false); }}
            onCancelEdit={() => setEditingId(null)}
            onSaveEdit={handleSaveEdit}
            onDelete={handleDelete}
            onAddSave={handleAddCategory}
            onAddCancel={() => setShowAddRow(false)}
            onAddClick={() => { setShowAddRow(true); setEditingId(null); }}
          />
        )}

      </div>
    </div>
  );
}