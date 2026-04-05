'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Target, Plus,
  Home, Car, Plane, GraduationCap, Dumbbell, Gift,
  Smartphone, Coffee, Monitor, Heart, Music, Umbrella, Star, Briefcase
} from 'lucide-react';

const GOAL_ICONS = [
  { name: 'target',     icon: Target,        color: 'text-orange-500' },
  { name: 'home',       icon: Home,           color: 'text-blue-500'   },
  { name: 'car',        icon: Car,            color: 'text-slate-500'  },
  { name: 'plane',      icon: Plane,          color: 'text-sky-500'    },
  { name: 'graduation', icon: GraduationCap,  color: 'text-indigo-500' },
  { name: 'dumbbell',   icon: Dumbbell,       color: 'text-red-500'    },
  { name: 'gift',       icon: Gift,           color: 'text-pink-500'   },
  { name: 'smartphone', icon: Smartphone,     color: 'text-zinc-500'   },
  { name: 'coffee',     icon: Coffee,         color: 'text-amber-600'  },
  { name: 'monitor',    icon: Monitor,        color: 'text-purple-500' },
  { name: 'heart',      icon: Heart,          color: 'text-rose-500'   },
  { name: 'music',      icon: Music,          color: 'text-emerald-500'},
  { name: 'umbrella',   icon: Umbrella,       color: 'text-cyan-500'   },
  { name: 'star',       icon: Star,           color: 'text-yellow-500' },
  { name: 'briefcase',  icon: Briefcase,      color: 'text-slate-700'  },
];

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: {
    title: string;
    description: string;
    target_amount: number;
    deadline: string | null;
    emoji: string;
  }) => Promise<void>;
}

export default function AddGoalModal({ isOpen, onClose, onSave }: AddGoalModalProps) {
  const [title,        setTitle]        = useState('');
  const [description,  setDescription]  = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline,     setDeadline]     = useState('');
  const [selectedIcon, setSelectedIcon] = useState('target');
  const [isSaving,     setIsSaving]     = useState(false);
  const [error,        setError]        = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Please enter a goal title.'); return; }
    if (!targetAmount || parseFloat(targetAmount) <= 0) { setError('Please enter a valid target amount.'); return; }

    setIsSaving(true);
    setError('');

    await onSave({
      title:         title.trim(),
      description:   description.trim(),
      target_amount: parseFloat(targetAmount),
      deadline:      deadline || null,
      emoji:         selectedIcon,
    });

    setTitle('');
    setDescription('');
    setTargetAmount('');
    setDeadline('');
    setSelectedIcon('target');
    setIsSaving(false);
  };

  const handleClose = () => { if (isSaving) return; setError(''); onClose(); };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-800 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none text-sm transition-all bg-slate-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                    <Target size={16} className="text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-gray-100">New Goal</h2>
                    <p className="text-xs text-slate-400 dark:text-gray-500">Set your next savings target</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-400 dark:text-gray-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    ⚠️ {error}
                  </div>
                )}

                {/* Icon picker */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider block mb-2">Icon</label>
                  <div className="grid grid-cols-5 gap-2">
                    {GOAL_ICONS.map(({ name, icon: Icon, color }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setSelectedIcon(name)}
                        className={`h-11 rounded-xl flex items-center justify-center transition-all border ${
                          selectedIcon === name
                            ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 ring-2 ring-orange-100 dark:ring-orange-900 scale-105'
                            : 'bg-slate-50 dark:bg-gray-700 border-transparent hover:bg-slate-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        <Icon
                          size={18}
                          className={selectedIcon === name ? color : 'text-slate-400 dark:text-gray-400'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider block mb-2">Goal Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => { setTitle(e.target.value); setError(''); }}
                    placeholder="e.g. New MacBook Pro"
                    className={inputClass}
                    autoFocus
                  />
                </div>

                {/* Amount + Deadline */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider block mb-2">Target Amount</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 text-sm font-medium">NRs</span>
                      <input
                        type="number"
                        value={targetAmount}
                        onChange={e => { setTargetAmount(e.target.value); setError(''); }}
                        placeholder="0"
                        min="1"
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider block mb-2">
                      Deadline <span className="text-slate-300 dark:text-gray-600 normal-case font-normal">(optional)</span>
                    </label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={e => setDeadline(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider block mb-2">
                    Description <span className="text-slate-300 dark:text-gray-600 normal-case font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Why is this goal important to you?"
                    rows={2}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <><Plus size={16} /> Create Goal</>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}