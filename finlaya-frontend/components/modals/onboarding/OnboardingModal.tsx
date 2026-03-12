'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import OnboardingModalSalaryInput0 from '../onboarding/OnboardingModal-SalaryInput-0';
import OnboardingModalEMISetup1, { EMIRow } from '../onboarding/OnboardingModal-EMISetup-1';
import OnboardingModalCategorySetup2, { CategoryRow } from '../onboarding/OnboardingModal-CategorySetup-1';
import OnboardingModalDone3 from '../onboarding/OnboardingModal-Success-2';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
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

const STEP_LABELS = ['Salary', 'EMIs', 'Categories', 'Done'];

// Largest remainder method — amounts always sum exactly to budgetableSalary
function buildRows(budgetableSalary: number): CategoryRow[] {
  const exactAmounts = DEFAULT_CATEGORIES.map((c) => budgetableSalary * (c.percentage / 100));
  const flooredAmounts = exactAmounts.map((a) => Math.floor(a));
  const remainder = budgetableSalary - flooredAmounts.reduce((s, a) => s + a, 0);
  const indices = exactAmounts
    .map((a, i) => ({ i, frac: a - Math.floor(a) }))
    .sort((a, b) => b.frac - a.frac)
    .map((x) => x.i);
  const finalAmounts = [...flooredAmounts];
  for (let n = 0; n < remainder; n++) finalAmounts[indices[n]] += 1;

  return DEFAULT_CATEGORIES.map((c, i) => ({
    id: `default-${i}`,
    name: c.name,
    percentage: c.percentage,
    amount: finalAmounts[i],
    enabled: true,
    isEditing: false,
  }));
}

function makeEMI(): EMIRow {
  return {
    id: `emi-${Date.now()}`,
    loanName: '',
    monthlyAmount: '',
    totalRemaining: '',
    dueDate: '',
    startDate: new Date().toISOString().split('T')[0],
  };
}

export default function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Step 0 — Salary
  const [salary, setSalary] = useState('');

  // Step 1 — EMIs
  const [emis, setEmis] = useState<EMIRow[]>([]);
  const [noEMI, setNoEMI] = useState(false);
  const [emiError, setEmiError] = useState('');

  // Step 2 — Categories
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatAmount, setNewCatAmount] = useState('');
  const [showAddRow, setShowAddRow] = useState(false);

  // Shared
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Core derived values
  const salaryNum = parseFloat(salary) || 0;
  const totalMonthlyEMI = emis.reduce((sum, e) => sum + (parseFloat(e.monthlyAmount) || 0), 0);
  const budgetableSalary = Math.max(0, salaryNum - totalMonthlyEMI);

  // Rebuild rows whenever budgetable salary changes
  useEffect(() => {
    setRows(buildRows(budgetableSalary));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetableSalary]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  // ── EMI helpers ──────────────────────────────────────
  const addEMI = () => {
    setNoEMI(false);
    setEmis((prev) => [...prev, makeEMI()]);
  };

  const removeEMI = (id: string) => setEmis((prev) => prev.filter((e) => e.id !== id));

  const updateEMI = (id: string, field: keyof EMIRow, value: string) =>
    setEmis((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));

  const toggleNoEMI = () => {
    setNoEMI((v) => {
      if (!v) setEmis([]);
      return !v;
    });
    setEmiError('');
  };

  const handleEMINext = () => {
    if (emis.length === 0 && !noEMI) {
      setEmiError('Please add your EMIs or confirm you have none.');
      return;
    }
    for (const emi of emis) {
      if (!emi.loanName.trim()) {
        setEmiError('Please enter a name for each EMI.');
        return;
      }
      if (!emi.monthlyAmount || parseFloat(emi.monthlyAmount) <= 0) {
        setEmiError('Please enter a valid monthly amount for each EMI.');
        return;
      }
      const m = parseFloat(emi.monthlyAmount);
      const t = parseFloat(emi.totalRemaining);
      if (t > 0 && m > t) {
        setEmiError(`Monthly EMI for "${emi.loanName}" exceeds total remaining amount.`);
        return;
      }
    }
    if (totalMonthlyEMI >= salaryNum) {
      setEmiError('Your total EMIs equal or exceed your salary. Please review.');
      return;
    }
    setEmiError('');
    goTo(2);
  };

  // ── Category helpers ─────────────────────────────────
  const toggleRow = (id: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));

  const updateAmount = (id: string, raw: string) => {
    const amount = parseFloat(raw) || 0;
    const base = budgetableSalary || 1;
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, amount, percentage: Math.round((amount / base) * 100) } : r
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
    const base = budgetableSalary || 1;
    setRows((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name,
        amount,
        percentage: Math.round((amount / base) * 100),
        enabled: true,
        isEditing: false,
      },
    ]);
    setNewCatName('');
    setNewCatAmount('');
    setShowAddRow(false);
  };

  // ── Save ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    setError('');

    try {
      if (!salaryNum || salaryNum <= 0) {
        setError('Please enter a valid salary.');
        setIsSaving(false);
        return;
      }

      const totalAllocated = rows.filter((r) => r.enabled).reduce((s, r) => s + r.amount, 0);
      if (totalAllocated > budgetableSalary) {
        setError('Total category amounts exceed your available budget after EMIs.');
        setIsSaving(false);
        return;
      }

      // Save salary
      const { error: salaryErr } = await supabase
        .from('users')
        .update({ monthly_salary: salaryNum, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (salaryErr) throw salaryErr;

      // Save categories
      await supabase.from('budget_categories').delete().eq('user_id', user.id);
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

      // Save EMIs
      await supabase.from('emi_payments').delete().eq('user_id', user.id);
      if (emis.length > 0) {
        const emisToInsert = emis.map((e) => ({
          user_id: user.id,
          loan_name: e.loanName.trim(),
          emi_amount: parseFloat(e.monthlyAmount) || 0,
          total_amount: parseFloat(e.totalRemaining) || 0,
          payment_day: parseInt(e.dueDate) || null,
          start_date: e.startDate || new Date().toISOString().split('T')[0],
          is_active: true,
        }));
        const { error: emiErr } = await supabase.from('emi_payments').insert(emisToInsert);
        if (emiErr) throw emiErr;
      }

      goTo(3);
    } catch (err: unknown) {
      console.error('[OnboardingModal] save error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Animation ────────────────────────────────────────
  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  const enabledCount = rows.filter((r) => r.enabled).length;
  const stepTitle = ['Set Up Your Budget', 'Your EMIs', 'Customize Categories', "You're All Set!"];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
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
                      <h2 className="text-lg font-bold text-gray-900">{stepTitle[step]}</h2>
                      <p className="text-xs text-gray-400">Step {step + 1} of 4</p>
                    </div>
                  </div>
                  {step < 3 && (
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
                      <div className={`h-1.5 rounded-full transition-colors duration-300 ${
                        i <= step ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gray-100'
                      }`} />
                      <p className={`text-xs mt-1 text-center font-medium ${i <= step ? 'text-orange-500' : 'text-gray-300'}`}>
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step content */}
              <div className="relative overflow-hidden" style={{ minHeight: 320 }}>
                <AnimatePresence custom={direction} mode="wait">
                  {step === 0 && (
                    <motion.div key="step-0" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22, ease: 'easeInOut' }}>
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
                    <motion.div key="step-1" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22, ease: 'easeInOut' }}>
                      <OnboardingModalEMISetup1
                        emis={emis}
                        noEMI={noEMI}
                        error={emiError}
                        onAddEMI={addEMI}
                        onRemoveEMI={removeEMI}
                        onUpdateEMI={updateEMI}
                        onToggleNoEMI={toggleNoEMI}
                        onBack={() => goTo(0)}
                        onNext={handleEMINext}
                      />
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div key="step-2" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22, ease: 'easeInOut' }}>
                      <OnboardingModalCategorySetup2
                        salary={budgetableSalary}
                        reservedForEMI={totalMonthlyEMI}
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
                        onBack={() => goTo(1)}
                        onSave={handleSave}
                      />
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div key="step-3" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22, ease: 'easeInOut' }}>
                      <OnboardingModalDone3
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