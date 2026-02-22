'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Plus, Trophy, Target, PiggyBank, Wallet,
  CalendarDays, AlertCircle, Star, Trash2, CheckCircle2,
  Flame, ArrowRight, TrendingUp,
  Home, Car, Plane, GraduationCap, Dumbbell, Gift, 
  Smartphone, Coffee, Monitor, Heart, Music, Umbrella, Briefcase
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client'; 
import { useAuth } from '@/lib/contexts/AuthContext'; 
import AddGoalModal from '@/components/modals/AddGoal/AddGoalModal'; 

interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_amount: number;
  deadline: string | null;
  icon_name: string;
  created_at: string;
}

interface GoalWithProgress extends Goal {
  savedSinceCreation: number;
  progressPercent: number;
  isComplete: boolean;
  daysLeft: number | null;
  monthsToGo: number | null;
}

const ICON_MAP: Record<string, LucideIcon> = {
  target: Target, home: Home, car: Car, plane: Plane,
  graduation: GraduationCap, dumbbell: Dumbbell, gift: Gift,
  smartphone: Smartphone, coffee: Coffee, monitor: Monitor,
  heart: Heart, music: Music, umbrella: Umbrella, star: Star, briefcase: Briefcase
};

const CircularProgress = ({ percent, size = 64, strokeWidth = 5, iconName, isComplete }: {
  percent: number; size?: number; strokeWidth?: number; iconName: string; isComplete: boolean;
}) => {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
  const center = size / 2;
  const IconComponent = ICON_MAP[iconName] || Target;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={center} cy={center} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        <motion.circle
          cx={center} cy={center} r={r} fill="none"
          stroke={isComplete ? '#10b981' : '#f97316'}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {isComplete ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <IconComponent size={16} className="text-gray-600" />}
      </div>
    </div>
  );
};

const GoalCard = ({ goal, onDelete }: { goal: GoalWithProgress; onDelete: (id: string) => void }) => {
  const [showDelete, setShowDelete] = useState(false);
  const fmt = (n: number) => 'NPR ' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const remaining = Math.max(0, goal.target_amount - goal.savedSinceCreation);
  const pct = Math.round(Math.min(goal.progressPercent, 100));

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      whileHover={{ y: -2 }} transition={{ duration: 0.2 }}
      className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all ${goal.isComplete ? 'ring-1 ring-emerald-100' : ''}`}
    >
      <div className="flex gap-4">
        {/* Progress */}
        <div className="flex-shrink-0">
          <CircularProgress percent={goal.progressPercent} iconName={goal.icon_name} isComplete={goal.isComplete} />
          <p className={`text-xs font-semibold text-center mt-1 ${goal.isComplete ? 'text-emerald-600' : 'text-orange-600'}`}>{pct}%</p>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 truncate">{goal.title}</h3>
                {goal.isComplete && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-medium px-1.5 py-0.5 rounded">Done</span>}
              </div>
              {goal.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{goal.description}</p>}
            </div>
            {/* Delete */}
            <div className="relative">
              {showDelete ? (
                <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg">
                  <button onClick={() => onDelete(goal.id)} className="text-red-600 text-xs font-medium">Yes</button>
                  <button onClick={() => setShowDelete(false)} className="text-gray-400 hover:text-gray-600"><Plus size={12} className="rotate-45" /></button>
                </div>
              ) : (
                <button onClick={() => setShowDelete(true)} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div>
              <p className="text-[10px] text-gray-400 font-medium">Saved</p>
              <p className="text-sm font-semibold text-gray-800">{fmt(Math.min(goal.savedSinceCreation, goal.target_amount))}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-medium">Target</p>
              <p className="text-sm font-semibold text-gray-800">{fmt(goal.target_amount)}</p>
            </div>
          </div>

          {!goal.isComplete && (
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">{fmt(remaining)} left</span>
              {goal.deadline && goal.daysLeft !== null && (
                <span className={`text-[10px] font-medium px-2 py-1 rounded flex items-center gap-1 ${goal.daysLeft < 30 ? 'text-red-600 bg-red-50' : 'text-gray-500 bg-gray-100'}`}>
                  {goal.daysLeft < 30 ? <AlertCircle size={10} /> : <CalendarDays size={10} />}
                  {goal.daysLeft === 0 ? 'Due today' : `${goal.daysLeft}d left`}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200 mt-4"
  >
    <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4">
      <Target size={24} className="text-orange-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-1">No goals yet</h3>
    <p className="text-sm text-gray-500 mb-4 max-w-xs">Create your first savings goal to start tracking your progress.</p>
    <button onClick={onAdd} className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
      <Plus size={16} /> Add Goal
    </button>
  </motion.div>
);

export default function GoalsMainContent() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalSavings, setTotalSavings] = useState(0);

  const computeGoalProgress = useCallback((goal: Goal, saved: number): GoalWithProgress => {
    const s = Math.max(0, saved);
    const progressPercent = goal.target_amount > 0 ? (s / goal.target_amount) * 100 : 0;
    const isComplete = s >= goal.target_amount;
    let daysLeft: number | null = null;
    if (goal.deadline) daysLeft = Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000));
    let monthsToGo: number | null = null;
    if (!isComplete) {
      const monthsElapsed = Math.max(1, (Date.now() - new Date(goal.created_at).getTime()) / (86400000 * 30));
      const avg = s / monthsElapsed;
      if (avg > 0) monthsToGo = Math.ceil((goal.target_amount - s) / avg);
    }
    return { ...goal, savedSinceCreation: s, progressPercent, isComplete, daysLeft, monthsToGo };
  }, []);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const [{ data: rawGoals }, { data: incomeData }, { data: expenseData }] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('income').select('amount, income_date').eq('user_id', user.id),
        supabase.from('expenses').select('amount, expense_date').eq('user_id', user.id),
      ]);
      if (!rawGoals) return;
      const totalIncome = (incomeData || []).reduce((s, r) => s + Number(r.amount), 0);
      const totalExpenses = (expenseData || []).reduce((s, r) => s + Number(r.amount), 0);
      setTotalSavings(Math.max(0, totalIncome - totalExpenses));
      setGoals(rawGoals.map((goal) => {
        const cd = new Date(goal.created_at);
        const inc = (incomeData || []).filter(r => new Date(r.income_date) >= cd).reduce((s, r) => s + Number(r.amount), 0);
        const exp = (expenseData || []).filter(r => new Date(r.expense_date) >= cd).reduce((s, r) => s + Number(r.amount), 0);
        return computeGoalProgress(goal, inc - exp);
      }));
    } finally { setIsLoading(false); }
  }, [user?.id, computeGoalProgress]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveGoal = async (goalData: { title: string; description: string; target_amount: number; deadline: string | null; icon_name: string }) => {
    if (!user?.id) return;
    const { error } = await supabase.from('goals').insert({ user_id: user.id, ...goalData });
    if (error) { console.error('Insert error:', error); return; }
    setIsModalOpen(false);
    await fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!user?.id) return;
    await supabase.from('goals').delete().eq('id', id).eq('user_id', user.id);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const activeGoals = goals.filter(g => !g.isComplete);
  const completedGoals = goals.filter(g => g.isComplete);
  const totalTargets = goals.reduce((s, g) => s + g.target_amount, 0);
  const fmt = (n: number) => 'NPR ' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-orange-100 p-1.5 rounded-lg"><Flame size={14} className="text-orange-600" /></div>
                <span className="text-xs font-medium text-orange-600 uppercase">Savings Goals</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">My Goals</h1>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
              <Plus size={16} /> <span className="hidden sm:inline">New Goal</span>
            </button>
          </div>

          {/* Stats */}
          {goals.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Saved', value: fmt(totalSavings), icon: PiggyBank, color: 'emerald' },
                { label: 'Target', value: fmt(totalTargets), icon: Target, color: 'orange' },
                { label: 'Done', value: `${completedGoals.length}/${goals.length}`, icon: Star, color: 'amber' },
              ].map((stat) => (
                <div key={stat.label} className={`bg-${stat.color}-50 rounded-xl p-3 border border-white/50`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <stat.icon size={14} className={`text-${stat.color}-500`} />
                    <span className="text-[10px] text-gray-500 font-medium">{stat.label}</span>
                  </div>
                  <p className={`text-lg font-bold text-${stat.color}-700`}>{stat.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 mt-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-gray-100" />)}
          </div>
        ) : goals.length === 0 ? (
          <EmptyState onAdd={() => setIsModalOpen(true)} />
        ) : (
          <div className="space-y-6">
            {activeGoals.length > 0 && (
              <div>
                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 px-1">In Progress</h2>
                <AnimatePresence mode="popLayout">
                  {activeGoals.map(goal => <GoalCard key={goal.id} goal={goal} onDelete={handleDelete} />)}
                </AnimatePresence>
              </div>
            )}
            {completedGoals.length > 0 && (
              <div>
                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 px-1 flex items-center gap-2">
                  <Trophy size={12} className="text-amber-400" /> Achieved
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {completedGoals.map(goal => <GoalCard key={goal.id} goal={goal} onDelete={handleDelete} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AddGoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveGoal} />
    </div>
  );
}