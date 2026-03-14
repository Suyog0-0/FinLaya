'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Plus, Trophy, Target, PiggyBank, Star, Trash2, CheckCircle2,
  Flame, CalendarDays, AlertCircle,
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

// ── Circular progress ring ─────────────────────────────────────────────────────
const ProgressRing = ({
  percent, emoji, isComplete, size = 60,
}: {
  percent: number; emoji: string; isComplete: boolean; size?: number;
}) => {
  const stroke = 4;
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;
  const center = size / 2;
  const Icon   = ICON_MAP[emoji] || Target;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={center} cy={center} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        <motion.circle
          cx={center} cy={center} r={r} fill="none"
          stroke={isComplete ? '#10b981' : '#f97316'}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {isComplete
          ? <CheckCircle2 size={16} className="text-emerald-500" />
          : <Icon size={15} className="text-slate-500" />
        }
      </div>
    </div>
  );
};

// ── Goal card ──────────────────────────────────────────────────────────────────
const GoalCard = ({
  goal, onDelete, onContribute,
}: {
  goal: Goal;
  onDelete: (id: string) => void;
  onContribute: (goal: Goal) => void;
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pct        = goal.target_amount > 0 ? Math.min((goal.saved_amount / goal.target_amount) * 100, 100) : 0;
  const isComplete = goal.saved_amount >= goal.target_amount;
  const remaining  = Math.max(0, goal.target_amount - goal.saved_amount);

  let daysLeft: number | null = null;
  if (goal.deadline)
    daysLeft = Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className={`bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all group ${
        isComplete ? 'border-emerald-100 ring-1 ring-emerald-100' : 'border-gray-100'
      }`}
    >
      <div className="flex gap-3">
        <div className="flex flex-col items-center gap-1">
          <ProgressRing percent={pct} emoji={goal.emoji} isComplete={isComplete} />
          <span className={`text-[10px] font-bold ${isComplete ? 'text-emerald-600' : 'text-orange-500'}`}>
            {Math.round(pct)}%
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{goal.title}</h3>
                {isComplete && (
                  <span className="bg-emerald-100 text-emerald-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                    COMPLETE
                  </span>
                )}
              </div>
              {goal.description && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">{goal.description}</p>
              )}
            </div>

            <div className="flex-shrink-0">
              {confirmDelete ? (
                <div className="flex items-center gap-1 bg-red-50 border border-red-100 px-2 py-1 rounded-lg">
                  <button onClick={() => onDelete(goal.id)} className="text-red-600 text-xs font-semibold">Delete</button>
                  <span className="text-red-200">|</span>
                  <button onClick={() => setConfirmDelete(false)} className="text-gray-400 text-xs">Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
            <motion.div
              className={`h-full rounded-full ${isComplete ? 'bg-emerald-400' : 'bg-orange-400'}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">Saved</p>
                <p className="text-xs font-bold text-gray-800">{fmt(goal.saved_amount)}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">Target</p>
                <p className="text-xs font-bold text-gray-800">{fmt(goal.target_amount)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {goal.deadline && daysLeft !== null && !isComplete && (
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
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
    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200 mt-4"
  >
    <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mb-3">
      <Target size={22} className="text-orange-400" />
    </div>
    <h3 className="text-base font-semibold text-gray-900 mb-1">No goals yet</h3>
    <p className="text-sm text-gray-400 mb-4 max-w-xs">Create a savings goal to start tracking your progress.</p>
    <button
      onClick={onAdd}
      className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
    >
      <Plus size={15} /> Add Goal
    </button>
  </motion.div>
);

// ── Main component ─────────────────────────────────────────────────────────────
export default function GoalsMainContent() {
  const { user } = useAuth();
  const [goals, setGoals]       = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);

  // The contribution cap passed to ContributeModal.
  // Primary source: Savings category budget_limit.
  // Fallback if no Savings category: salary - expenses - EMI (net spendable).
  const [savingsLimit, setSavingsLimit]           = useState(0);
  const [savingsLimitSource, setSavingsLimitSource] = useState<'category' | 'net'>('net');

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    const [
      { data: goalsData },
      { data: incomeData },
      { data: expenseData },
      { data: userData },
      { data: emiData },
      { data: categoryData },
    ] = await Promise.all([
      supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('income').select('amount').eq('user_id', user.id),
      supabase.from('expenses').select('amount').eq('user_id', user.id),
      supabase.from('users').select('monthly_salary').eq('user_id', user.id).maybeSingle(),
      supabase.from('emi_payments').select('emi_amount').eq('user_id', user.id).eq('is_active', true),
      // Fetch all categories so we can find the "Savings" one
      supabase.from('budget_categories').select('category_name, budget_limit').eq('user_id', user.id),
    ]);

    const monthlySalary  = Number(userData?.monthly_salary ?? 0);
    const totalIncome    = monthlySalary + (incomeData ?? []).reduce((s, r) => s + Number(r.amount), 0);
    const totalExpenses  = (expenseData ?? []).reduce((s, r) => s + Number(r.amount), 0);
    const totalEMI       = (emiData     ?? []).reduce((s, r) => s + Number(r.emi_amount), 0);

    // Look for a "Savings" category (case-insensitive)
    const savingsCategory = (categoryData ?? []).find(
      (c) => c.category_name.toLowerCase() === 'savings'
    );

    if (savingsCategory && Number(savingsCategory.budget_limit) > 0) {
      // Primary: use the Savings category budget limit
      setSavingsLimit(Number(savingsCategory.budget_limit));
      setSavingsLimitSource('category');
    } else {
      // Fallback: net spendable (salary + income - expenses - EMI), min 0
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
    const { error } = await supabase.from('goals').insert({
      user_id: user.id,
      ...goalData,
      saved_amount: 0,
    });
    if (error) { console.error('Insert error:', error); return; }
    setIsAddOpen(false);
    await fetchData();
  };

  const handleContribute = async (amount: number) => {
    if (!contributeGoal) return;
    const newSaved = Number(contributeGoal.saved_amount) + amount;
    const { error } = await supabase
      .from('goals')
      .update({ saved_amount: newSaved })
      .eq('id', contributeGoal.id)
      .eq('user_id', user!.id);
    if (error) { console.error('Contribute error:', error); return; }
    setContributeGoal(null);
    await fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id).eq('user_id', user!.id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
    await fetchData();
  };

  const activeGoals    = goals.filter((g) => Number(g.saved_amount) < Number(g.target_amount));
  const completedGoals = goals.filter((g) => Number(g.saved_amount) >= Number(g.target_amount));
  const totalTarget    = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const totalSaved     = goals.reduce((s, g) => s + Number(g.saved_amount), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Sticky header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-orange-100 p-1.5 rounded-lg">
                  <Flame size={13} className="text-orange-600" />
                </div>
                <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Savings Goals</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">My Goals</h1>
            </div>
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">New Goal</span>
            </button>
          </div>

          {goals.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {[
                {
                  label: savingsLimitSource === 'category' ? 'Savings Budget' : 'Available',
                  value: fmt(savingsLimit),
                  icon: PiggyBank,
                  color: 'emerald',
                },
                { label: 'Saved in Goals', value: fmt(totalSaved),     icon: Target,      color: 'orange' },
                { label: 'Total Target',   value: fmt(totalTarget),    icon: CalendarDays, color: 'blue'   },
                { label: 'Completed',      value: `${completedGoals.length}/${goals.length}`, icon: Star, color: 'amber' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className={`bg-${color}-50 rounded-xl p-2.5 border border-${color}-100/50`}>
                  <div className="flex items-center gap-1 mb-1">
                    <Icon size={11} className={`text-${color}-500`} />
                    <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wide truncate">{label}</span>
                  </div>
                  <p className={`text-sm font-bold text-${color}-700 truncate`}>{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Goal list */}
      <div className="max-w-3xl mx-auto px-4 mt-5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <EmptyState onAdd={() => setIsAddOpen(true)} />
        ) : (
          <div className="space-y-5">
            {activeGoals.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">In Progress</h2>
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
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                  <Trophy size={11} className="text-amber-400" /> Achieved
                </h2>
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

      <AddGoalModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleSaveGoal}
      />

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