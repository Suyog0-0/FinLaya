'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import OnboardingModalSalaryInput0 from '../onboarding/OnboardingModal-SalaryInput-0';
import OnboardingModalEMISetup1, { EMIRow } from '../onboarding/OnboardingModal-EMISetup-1';
import OnboardingModalCategorySetup1, { CategoryRow } from '../onboarding/OnboardingModal-CategorySetup-1';
import OnboardingModalSuccess2 from '../onboarding/OnboardingModal-Success-2';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const DEFAULT_CATEGORIES = [
  { name: 'Housing',       percentage: 30 },
  { name: 'Food',          percentage: 15 },
  { name: 'Transportation',percentage: 10 },
  { name: 'Utilities',     percentage:  8 },
  { name: 'Health',        percentage:  7 },
  { name: 'Entertainment', percentage:  5 },
  { name: 'Savings',       percentage: 20 },
  { name: 'Others',        percentage:  5 },
];

const STEPS       = ['Salary', 'EMIs', 'Categories', 'Done'];
const STEP_TITLES = [
  'Set up your salary',
  'Any active loans?',
  'Customize categories',
  "You're all set!",
];

// Largest remainder method — amounts sum exactly to budgetableSalary
function buildRows(budgetableSalary: number): CategoryRow[] {
  const exactAmounts   = DEFAULT_CATEGORIES.map((c) => budgetableSalary * (c.percentage / 100));
  const flooredAmounts = exactAmounts.map((a) => Math.floor(a));
  const remainder      = budgetableSalary - flooredAmounts.reduce((s, a) => s + a, 0);
  const indices        = exactAmounts
    .map((a, i) => ({ i, frac: a - Math.floor(a) }))
    .sort((a, b) => b.frac - a.frac)
    .map((x) => x.i);
  const finalAmounts = [...flooredAmounts];
  for (let n = 0; n < Math.round(remainder); n++) finalAmounts[indices[n]] += 1;

  return DEFAULT_CATEGORIES.map((c, i) => ({
    id:         `default-${i}`,
    name:       c.name,
    percentage: c.percentage,
    amount:     finalAmounts[i],
    enabled:    true,
    isEditing:  false,
  }));
}

function makeEMI(): EMIRow {
  return {
    id:             `emi-${Date.now()}`,
    loanName:       '',
    monthlyAmount:  '',
    totalRemaining: '',
    dueDate:        '',
    startDate:      new Date().toISOString().split('T')[0],
  };
}

export default function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const { user } = useAuth();
  const [step, setStep]           = useState(0);
  const [direction, setDirection] = useState(1);

  const [salary, setSalary]     = useState('');
  const [emis, setEmis]         = useState<EMIRow[]>([]);
  const [noEMI, setNoEMI]       = useState(false);
  const [emiError, setEmiError] = useState('');
  const [rows, setRows]         = useState<CategoryRow[]>([]);
  const [newCatName, setNewCatName]     = useState('');
  const [newCatAmount, setNewCatAmount] = useState('');
  const [showAddRow, setShowAddRow]     = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError]       = useState('');

  const salaryNum        = parseFloat(salary) || 0;
  const totalMonthlyEMI  = emis.reduce((sum, e) => sum + (parseFloat(e.monthlyAmount) || 0), 0);
  const budgetableSalary = Math.max(0, salaryNum - totalMonthlyEMI);

  // Rebuild recommended rows whenever budgetable salary changes
  useEffect(() => {
    setRows(buildRows(budgetableSalary));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetableSalary]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  // ── EMI helpers ────────────────────────────────────────────────────────────

  const addEMI    = () => { setNoEMI(false); setEmis((p) => [...p, makeEMI()]); };
  const removeEMI = (id: string) => setEmis((p) => p.filter((e) => e.id !== id));
  const updateEMI = (id: string, field: keyof EMIRow, value: string) =>
    setEmis((p) => p.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  const toggleNoEMI = () => {
    setNoEMI((v) => { if (!v) setEmis([]); return !v; });
    setEmiError('');
  };
  const handleEMINext = () => {
    if (emis.length === 0 && !noEMI) { setEmiError('Please add your EMIs or confirm you have none.'); return; }
    for (const emi of emis) {
      if (!emi.loanName.trim())                                       { setEmiError('Please enter a name for each EMI.'); return; }
      if (!emi.monthlyAmount || parseFloat(emi.monthlyAmount) <= 0)   { setEmiError('Please enter a valid monthly amount.'); return; }
      const m = parseFloat(emi.monthlyAmount), t = parseFloat(emi.totalRemaining);
      if (t > 0 && m > t) { setEmiError(`Monthly EMI for "${emi.loanName}" exceeds total remaining.`); return; }
    }
    if (totalMonthlyEMI >= salaryNum) { setEmiError('Your total EMIs equal or exceed your salary.'); return; }
    setEmiError('');
    goTo(2);
  };

  // ── Category helpers ───────────────────────────────────────────────────────

  const toggleRow = (id: string) =>
    setRows((p) => p.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));

  const updateAmount = (id: string, raw: string) => {
    const amount = parseFloat(raw) || 0;
    const base   = budgetableSalary || 1;
    setRows((p) => p.map((r) => r.id === id ? { ...r, amount, percentage: Math.round((amount / base) * 100) } : r));
  };

  const updateName = (id: string, name: string) =>
    setRows((p) => p.map((r) => r.id === id ? { ...r, name } : r));

  const setEditing = (id: string, val: boolean) =>
    setRows((p) => p.map((r) => r.id === id ? { ...r, isEditing: val } : r));

  const removeRow = (id: string) =>
    setRows((p) => p.filter((r) => r.id !== id));

  // Wipe rows when user picks "Build my own"
  const clearRows = () => setRows([]);

  // BUG FIX: Re-populate rows with recommended defaults.
  // The useEffect above only fires when budgetableSalary changes — so if the user
  // cleared rows by picking "Build my own" and then goes back and picks
  // "Use recommended split", budgetableSalary hasn't changed and the effect
  // doesn't re-run. Calling this directly rebuilds the rows immediately.
  const resetRows = () => setRows(buildRows(budgetableSalary));

  const addCustomRow = () => {
    const name   = newCatName.trim();
    const amount = parseFloat(newCatAmount) || 0;
    if (!name) return;
    const base = budgetableSalary || 1;
    setRows((p) => [
      ...p,
      {
        id: `custom-${Date.now()}`,
        name, amount,
        percentage: Math.round((amount / base) * 100),
        enabled:   true,
        isEditing: false,
      },
    ]);
    setNewCatName('');
    setNewCatAmount('');
    setShowAddRow(false);
  };

  // ── Save ───────────────────────────────────────────────────────────────────

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
        setError('Total category amounts exceed your available budget.');
        setIsSaving(false);
        return;
      }

      const { error: salaryErr } = await supabase
        .from('users')
        .update({ monthly_salary: salaryNum, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (salaryErr) throw salaryErr;

      await supabase.from('budget_categories').delete().eq('user_id', user.id);
      const toInsert = rows
        .filter((r) => r.enabled && r.name.trim())
        .map((r) => ({
          user_id:              user.id,
          category_name:        r.name.trim(),
          allocation_percentage:r.percentage,
          budget_limit:         r.amount,
          current_balance:      r.amount,
        }));
      if (toInsert.length > 0) {
        const { error: catErr } = await supabase.from('budget_categories').insert(toInsert);
        if (catErr) throw catErr;
      }

      await supabase.from('emi_payments').delete().eq('user_id', user.id);
      if (emis.length > 0) {
        const emisToInsert = emis.map((e) => ({
          user_id:     user.id,
          loan_name:   e.loanName.trim(),
          emi_amount:  parseFloat(e.monthlyAmount)  || 0,
          total_amount:parseFloat(e.totalRemaining) || 0,
          payment_day: parseInt(e.dueDate)          || null,
          start_date:  e.startDate || new Date().toISOString().split('T')[0],
          is_active:   true,
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

  const variants = {
    enter:  (d: number) => ({ x: d > 0 ?  50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d: number) => ({ x: d > 0 ? -50 :  50, opacity: 0 }),
  };

  const enabledCount = rows.filter((r) => r.enabled).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={step < 3 ? onClose : undefined}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">{STEP_TITLES[step]}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Step {step + 1} of {STEPS.length}</p>
                  </div>
                  {step < 3 && (
                    <button
                      onClick={onClose}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                      aria-label="Close"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-orange-400"
                    animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  {STEPS.map((label, i) => (
                    <span key={label} className={`text-[11px] font-medium transition-colors ${i <= step ? 'text-orange-500' : 'text-gray-300'}`}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Step content */}
              <div className="relative overflow-hidden" style={{ minHeight: 280 }}>
                <AnimatePresence custom={direction} mode="wait">
                  {step === 0 && (
                    <motion.div key="step-0" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2, ease: 'easeInOut' }}>
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
                    <motion.div key="step-1" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2, ease: 'easeInOut' }}>
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
                    <motion.div key="step-2" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2, ease: 'easeInOut' }}>
                      <OnboardingModalCategorySetup1
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
                        onClearRows={clearRows}
                        onResetRows={resetRows}
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
                    <motion.div key="step-3" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2, ease: 'easeInOut' }}>
                      <OnboardingModalSuccess2
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