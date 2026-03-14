'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Plus, Target, PiggyBank, Star, Trash2, CheckCircle2,
  CalendarDays, AlertCircle,
  Home, Car, Plane, GraduationCap, Dumbbell, Gift,
  Smartphone, Coffee, Monitor, Heart, Music, Umbrella, Briefcase,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import AddGoalModal from '@/components/modals/AddGoal/AddGoalModal';
import ContributeModal from '@/components/modals/AddGoal/ContributeModal';

interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_amount: number;
  saved_amount: number;
  deadline: string | null;
  emoji: string;
  created_at: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  target: Target, home: Home, car: Car, plane: Plane,
  graduation: GraduationCap, dumbbell: Dumbbell, gift: Gift,
  smartphone: Smartphone, coffee: Coffee, monitor: Monitor,
  heart: Heart, music: Music, umbrella: Umbrella, star: Star, briefcase: Briefcase,
};

const fmt = (n: number) =>
  'NRs ' + Math.max(0, n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

// ── Goal card ──────────────────────────────────────────────────────────────────
const GoalCard = ({
  goal, onDelete, onContribute,
}: {
  goal: Goal;
  onDelete: (id: string) => void;
  onContribute: (goal: Goal) => void;
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pct = goal.target_amount > 0 ? Math.min((goal.saved_amount / goal.target_amount) * 100, 100) : 0;
  const isComplete = goal.saved_amount >= goal.target_amount;
  const remaining = Math.max(0, goal.target_amount - goal.saved_amount);
  const Icon = ICON_MAP[goal.emoji] || Target;

  let daysLeft: number | null = null;
  if (goal.deadline)
    daysLeft = Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`bg-white rounded-2xl border p-5 hover:border-gray-200 hover:shadow-sm transition-all group ${
        isComplete ? 'border-emerald-100' : 'border-gray-100'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Icon + progress */}
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isComplete ? 'bg-emerald-50' : 'bg-orange-50'}`}>
            {isComplete
              ? <CheckCircle2 size={18} className="text-emerald-500" />
              : <Icon size={18} className="text-orange-500" />
            }
          </div>
          <p className={`text-xs font-semibold text-center mt-1 ${isComplete ? 'text-emerald-600' : 'text-orange-500'}`}>
            {Math.round(pct)}%
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 text-sm">{goal.title}</h3>
                {isComplete && (
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                    COMPLETE
                  </span>
                )}
              </div>
              {goal.description && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">{goal.description}</p>
              )}
            </div>

            {/* Delete */}
            {confirmDelete ? (
              <div className="flex items-center gap-1 bg-red-50 border border-red-100 px-2 py-1 rounded-lg flex-shrink-0">
                <button onClick={() => onDelete(goal.id)} className="text-red-600 text-xs font-semibold">Delete</button>
                <span className="text-red-200">|</span>
                <button onClick={() => setConfirmDelete(false)} className="text-gray-400 text-xs">Cancel</button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
            <motion.div
              className={`h-full rounded-full ${isComplete ? 'bg-emerald-400' : 'bg-orange-400'}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>

          {/* Stats + actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Saved</p>
                <p className="text-xs font-bold text-gray-800">{fmt(goal.saved_amount)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Target</p>
                <p className="text-xs font-bold text-gray-800">{fmt(goal.target_amount)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {goal.deadline && daysLeft !== null && !isComplete && (
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                  daysLeft < 30 ? 'text-red-500 bg-red-50' : 'text-gray-400 bg-gray-100'
                }`}>
                  {daysLeft < 30 ? <AlertCircle size={8} /> : <CalendarDays size={8} />}
                  {daysLeft === 0 ? 'Due today' : `${daysLeft}d`}
                </span>
              )}
              {!isComplete && (
                <button
                  onClick={() => onContribute(goal)}
                  className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={10} /> Add
                </button>
              )}
            </div>
          </div>

          {!isComplete && (
            <div className="mt-2">
              <span className="text-[10px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                {fmt(remaining)} to go
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ── Empty state ────────────────────────────────────────────────────────────────
const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200"
  >
    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-3">
      <Target size={20} className="text-orange-400" />
    </div>
    <h3 className="text-base font-semibold text-gray-900 mb-1">No goals yet</h3>
    <p className="text-sm text-gray-400 mb-5 max-w-xs">Create a savings goal to start tracking your progress.</p>
    <button
      onClick={onAdd}
      className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
    >
      <Plus size={15} /> Add Goal
    </button>
  </motion.div>
);

// ── Main component ─────────────────────────────────────────────────────────────
export default function GoalsMainContent() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [savingsLimit, setSavingsLimit] = useState(0);
  const [savingsLimitSource, setSavingsLimitSource] = useState<'category' | 'net'>('net');

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    // Scope income/expenses to current month so savings limit is accurate
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [
      { data: goalsData },
      { data: incomeData },
      { data: expenseData },
      { data: userData },
      { data: emiData },
      { data: categoryData },
    ] = await Promise.all([
      supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('income').select('amount').eq('user_id', user.id).gte('income_date', monthStart).lte('income_date', monthEnd),
      supabase.from('expenses').select('amount').eq('user_id', user.id).gte('expense_date', monthStart).lte('expense_date', monthEnd),
      supabase.from('users').select('monthly_salary').eq('user_id', user.id).maybeSingle(),
      supabase.from('emi_payments').select('emi_amount').eq('user_id', user.id).eq('is_active', true),
      supabase.from('budget_categories').select('category_name, budget_limit').eq('user_id', user.id),
    ]);

    const monthlySalary = Number(userData?.monthly_salary ?? 0);
    const totalIncome = monthlySalary + (incomeData ?? []).reduce((s, r) => s + Number(r.amount), 0);
    const totalExpenses = (expenseData ?? []).reduce((s, r) => s + Number(r.amount), 0);
    const totalEMI = (emiData ?? []).reduce((s, r) => s + Number(r.emi_amount), 0);

    const savingsCategory = (categoryData ?? []).find(
      (c) => c.category_name.toLowerCase() === 'savings'
    );

    if (savingsCategory && Number(savingsCategory.budget_limit) > 0) {
      setSavingsLimit(Number(savingsCategory.budget_limit));
      setSavingsLimitSource('category');
    } else {
      setSavingsLimit(Math.max(0, totalIncome - totalExpenses - totalEMI));
      setSavingsLimitSource('net');
    }

    setGoals(goalsData ?? []);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveGoal = async (goalData: {
    title: string;
    description: string;
    target_amount: number;
    deadline: string | null;
    emoji: string;
  }) => {
    if (!user?.id) return;
    await supabase.from('goals').insert({ user_id: user.id, ...goalData, saved_amount: 0 });
    setIsAddOpen(false);
    await fetchData();
  };

  const handleContribute = async (amount: number) => {
    if (!contributeGoal) return;
    const newSaved = Number(contributeGoal.saved_amount) + amount;
    await supabase.from('goals').update({ saved_amount: newSaved }).eq('id', contributeGoal.id).eq('user_id', user!.id);
    setContributeGoal(null);
    await fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id).eq('user_id', user!.id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const activeGoals = goals.filter((g) => Number(g.saved_amount) < Number(g.target_amount));
  const completedGoals = goals.filter((g) => Number(g.saved_amount) >= Number(g.target_amount));
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const totalSaved = goals.reduce((s, g) => s + Number(g.saved_amount), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Page header — consistent with all other pages */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Goals</h1>
            <p className="text-sm text-gray-500 mt-1">Track your savings goals and progress</p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus size={15} />
            New Goal
          </button>
        </div>

        {/* Stats strip — only when there are goals */}
        {goals.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: savingsLimitSource === 'category' ? 'Savings Budget' : 'Available',
                value: fmt(savingsLimit),
                icon: PiggyBank,
                iconColor: 'text-emerald-500',
                iconBg: 'bg-emerald-50',
              },
              {
                label: 'Saved in Goals',
                value: fmt(totalSaved),
                icon: Target,
                iconColor: 'text-orange-500',
                iconBg: 'bg-orange-50',
              },
              {
                label: 'Total Target',
                value: fmt(totalTarget),
                icon: CalendarDays,
                iconColor: 'text-amber-500',
                iconBg: 'bg-amber-50',
              },
              {
                label: 'Completed',
                value: `${completedGoals.length}/${goals.length}`,
                icon: Star,
                iconColor: 'text-amber-500',
                iconBg: 'bg-amber-50',
              },
            ].map(({ label, value, icon: Icon, iconColor, iconBg }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
                  <Icon size={16} className={iconColor} />
                </div>
                <p className="text-xl font-bold text-gray-900 tabular-nums truncate">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Goal list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <EmptyState onAdd={() => setIsAddOpen(true)} />
        ) : (
          <div className="space-y-6">
            {activeGoals.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">In Progress</p>
                <AnimatePresence mode="popLayout">
                  <div className="space-y-3">
                    {activeGoals.map((g) => (
                      <GoalCard key={g.id} goal={g} onDelete={handleDelete} onContribute={setContributeGoal} />
                    ))}
                  </div>
                </AnimatePresence>
              </div>
            )}
            {completedGoals.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Achieved</p>
                <div className="space-y-3">
                  {completedGoals.map((g) => (
                    <GoalCard key={g.id} goal={g} onDelete={handleDelete} onContribute={setContributeGoal} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AddGoalModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSave={handleSaveGoal} />

      {contributeGoal && (
        <ContributeModal
          isOpen={!!contributeGoal}
          onClose={() => setContributeGoal(null)}
          goalTitle={contributeGoal.title}
          targetAmount={Number(contributeGoal.target_amount)}
          savedAmount={Number(contributeGoal.saved_amount)}
          availableSavings={savingsLimit}
          savingsSource={savingsLimitSource}
          onContribute={handleContribute}
        />
      )}
    </div>
  );
}