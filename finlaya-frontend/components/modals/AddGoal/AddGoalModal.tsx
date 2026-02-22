'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Target, CalendarDays, Banknote, FileText, Plus, 
  Home, Car, Plane, GraduationCap, Dumbbell, Gift, 
  Smartphone, Coffee, Monitor, Heart, Music, Umbrella, Star, Briefcase 
} from 'lucide-react';

// Define available icons for selection
const GOAL_ICONS = [
  { name: 'target', icon: Target, color: 'text-orange-500' },
  { name: 'home', icon: Home, color: 'text-blue-500' },
  { name: 'car', icon: Car, color: 'text-slate-500' },
  { name: 'plane', icon: Plane, color: 'text-sky-500' },
  { name: 'graduation', icon: GraduationCap, color: 'text-indigo-500' },
  { name: 'dumbbell', icon: Dumbbell, color: 'text-red-500' },
  { name: 'gift', icon: Gift, color: 'text-pink-500' },
  { name: 'smartphone', icon: Smartphone, color: 'text-zinc-500' },
  { name: 'coffee', icon: Coffee, color: 'text-amber-600' },
  { name: 'monitor', icon: Monitor, color: 'text-purple-500' },
  { name: 'heart', icon: Heart, color: 'text-rose-500' },
  { name: 'music', icon: Music, color: 'text-emerald-500' },
  { name: 'umbrella', icon: Umbrella, color: 'text-cyan-500' },
  { name: 'star', icon: Star, color: 'text-yellow-500' },
  { name: 'briefcase', icon: Briefcase, color: 'text-slate-700' },
];

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: {
    title: string;
    description: string;
    target_amount: number;
    deadline: string | null;
    icon_name: string; // Changed from emoji to icon_name
  }) => Promise<void>;
}

export default function AddGoalModal({ isOpen, onClose, onSave }: AddGoalModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedIconName, setSelectedIconName] = useState('target');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Please enter a goal title.'); return; }
    if (!targetAmount || parseFloat(targetAmount) <= 0) { setError('Please enter a valid target amount.'); return; }
    
    setIsSaving(true);
    setError('');
    
    await onSave({
      title: title.trim(),
      description: description.trim(),
      target_amount: parseFloat(targetAmount),
      deadline: deadline || null,
      icon_name: selectedIconName,
    });
    
    // Reset form
    setTitle(''); 
    setDescription(''); 
    setTargetAmount(''); 
    setDeadline(''); 
    setSelectedIconName('target');
    setIsSaving(false);
  };

  const handleClose = () => { if (isSaving) return; setError(''); onClose(); };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none text-sm transition-all bg-slate-50 focus:bg-white";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          
          {/* Modal Content */}
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto pointer-events-auto flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-slate-100 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shadow-sm">
                    <Target size={18} className="text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">New Goal</h2>
                    <p className="text-xs text-slate-500 font-medium">Set your next target</p>
                  </div>
                </div>
                <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <span>⚠️</span> {error}
                  </div>
                )}

                {/* Icon Picker */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> Choose Icon
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    {GOAL_ICONS.map((item) => {
                      const IconComp = item.icon;
                      const isSelected = selectedIconName === item.name;
                      return (
                        <button 
                          key={item.name} 
                          type="button" 
                          onClick={() => setSelectedIconName(item.name)}
                          className={`
                            h-12 rounded-xl flex items-center justify-center transition-all duration-200 border
                            ${isSelected 
                              ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-100 scale-105 shadow-sm' 
                              : 'bg-slate-50 border-transparent hover:bg-slate-100 hover:border-slate-200'
                            }
                          `}
                        >
                          <IconComp size={20} className={isSelected ? item.color : 'text-slate-400'} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Goal Title
                  </label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={e => { setTitle(e.target.value); setError(''); }}
                    placeholder="e.g. New MacBook Pro" 
                    className={inputClass}
                    autoFocus
                  />
                </div>

                {/* Grid for Amount & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                      <input 
                        type="number" 
                        value={targetAmount}
                        onChange={e => { setTargetAmount(e.target.value); setError(''); }}
                        placeholder="0" 
                        min="1"
                        className={`${inputClass} pl-8 font-semibold text-slate-700`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Deadline
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
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Description
                    <span className="text-slate-300 font-normal normal-case ml-auto">(Optional)</span>
                  </label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Why is this important to you?" 
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-slate-200 hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-2"
                >
                  {isSaving ? (
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" 
                    />
                  ) : (
                    <>
                      <Plus size={18} /> Create Goal
                    </>
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