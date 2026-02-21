'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import OnboardingModalSalaryInput0 from '../onboarding/OnboardingModal-SalaryInput-0';
import OnboardingModalCategorySetup1, { CategoryRow } from '../onboarding/OnboardingModal-CategorySetup-1';
import OnboardingModalDone2 from '../onboarding/OnboardingModal-Success-2';


interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;    // skip/dismiss
  onComplete: () => void; // finished setup
}

const DEFAULT_CATEGORIES = [
  { name: 'Housing', percentage: 30 },
  { name: 'Food', percentage: 15 },
  { name: 'Transportation', percentage: 10 },
  { name: 'Utilities', percentage: 8 },
  { name: 'Health', percentage: 7 },
  { name: 'Entertainment', percentage: 5 },
  { name: 'Savings', percentage: 20 },
  { name: 'Others', percentage: 5 },
]; 

const STEP_LABELS = ['Salary', 'Categories', 'Done'];

function buildRows(salary: number): CategoryRow[] {
  return DEFAULT_CATEGORIES.map((c, i) => ({
    id: `default-${i}`,
    name: c.name,
    percentage: c.percentage,
    amount: Math.round(salary * (c.percentage / 100)),
    enabled: true,
    isEditing: false,
  }));
}

export default function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Step 1 state
  const [salary, setSalary] = useState('');

  // Step 2 state
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatAmount, setNewCatAmount] = useState('');
  const [showAddRow, setShowAddRow] = useState(false);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Rebuild rows when salary changes
  useEffect(() => {
    const s = parseFloat(salary) || 0;
    setRows(buildRows(s));
  }, [salary]);

  // Disable background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  // Row helpers
  const toggleRow = (id: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));

  const updateAmount = (id: string, raw: string) => {
    const amount = parseFloat(raw) || 0;
    const s = parseFloat(salary) || 1;
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, amount, percentage: Math.round((amount / s) * 100) } : r
      )
    );
  };

  const updateName = (id: string, name: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)));

  const setEditing = (id: string, val: boolean) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isEditing: val } : r)));

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const addCustomRow = () => {
    const name = newCatName.trim();
    const amount = parseFloat(newCatAmount) || 0;
    if (!name) return;
    const s = parseFloat(salary) || 1;
    setRows((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name,
        amount,
        percentage: Math.round((amount / s) * 100),
        enabled: true,
        isEditing: false,
      },
    ]);
    setNewCatName('');
    setNewCatAmount('');
    setShowAddRow(false);
  };

  // Save to Supabase
  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    setError('');

    try {
      const salaryNum = parseFloat(salary);
      if (!salaryNum || salaryNum <= 0) {
        setError('Please enter a valid salary.');
        setIsSaving(false);
        return;
      }

      // Save salary
      const { error: salaryErr } = await supabase
        .from('users')
        .update({ monthly_salary: salaryNum, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (salaryErr) throw salaryErr;

      // Delete existing categories
      await supabase.from('budget_categories').delete().eq('user_id', user.id);

      // Insert enabled categories
      const toInsert = rows
        .filter((r) => r.enabled && r.name.trim())
        .map((r) => ({
          user_id: user.id,
          category_name: r.name.trim(),
          allocation_percentage: r.percentage,
          budget_limit: r.amount,
          current_balance: r.amount,
        }));

      if (toInsert.length > 0) {
        const { error: catErr } = await supabase.from('budget_categories').insert(toInsert);
        if (catErr) throw catErr;
      }

      goTo(2);
    } catch (err: unknown) {
      console.error('[OnboardingModal] save error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Animation variants
  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  const enabledCount = rows.filter((r) => r.enabled).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 24 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                      <Wallet className="text-white" size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {step === 0 && 'Set Up Your Budget'}
                        {step === 1 && 'Customize Categories'}
                        {step === 2 && "You're All Set!"}
                      </h2>
                      <p className="text-xs text-gray-400">Step {step + 1} of 3</p>
                    </div>
                  </div>
                  {step < 2 && (
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600 transition-colors text-sm flex items-center gap-1"
                    >
                      Skip <X size={14} />
                    </button>
                  )}
                </div>

                {/* Progress bars */}
                <div className="flex gap-2">
                  {STEP_LABELS.map((label, i) => (
                    <div key={label} className="flex-1">
                      <div
                        className={`h-1.5 rounded-full transition-colors duration-300 ${
                          i <= step ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gray-100'
                        }`}
                      />
                      <p className={`text-xs mt-1 text-center font-medium ${i <= step ? 'text-orange-500' : 'text-gray-300'}`}>
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step content with animation */}
              <div className="relative overflow-hidden" style={{ minHeight: 320 }}>
                <AnimatePresence custom={direction} mode="wait">
                  {step === 0 && (
                    <motion.div
                      key="step-0"
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                    >
                      <OnboardingModalSalaryInput0
                        salary={salary}
                        onSalaryChange={setSalary}
                        defaultCategories={DEFAULT_CATEGORIES}
                        onNext={() => goTo(1)}
                        onSkip={onClose}
                      />
                    </motion.div>
                  )}

                  {step === 1 && (
                    <motion.div
                      key="step-1"
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                    >
                      <OnboardingModalCategorySetup1
                        salary={parseFloat(salary) || 0}
                        rows={rows}
                        error={error}
                        newCatName={newCatName}
                        newCatAmount={newCatAmount}
                        showAddRow={showAddRow}
                        isSaving={isSaving}
                        onToggleRow={toggleRow}
                        onUpdateAmount={updateAmount}
                        onUpdateName={updateName}
                        onSetEditing={setEditing}
                        onRemoveRow={removeRow}
                        onNewCatNameChange={setNewCatName}
                        onNewCatAmountChange={setNewCatAmount}
                        onAddCustomRow={addCustomRow}
                        onToggleAddRow={() => setShowAddRow((v) => !v)}
                        onBack={() => goTo(0)}
                        onSave={handleSave}
                      />
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step-2"
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                    >
                      <OnboardingModalDone2
                        salary={salary}
                        enabledCount={enabledCount}
                        onComplete={onComplete}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}