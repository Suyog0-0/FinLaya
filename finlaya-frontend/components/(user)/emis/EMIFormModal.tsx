'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { EMI } from './utils';

interface EMIFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<EMI, 'emi_id' | 'is_active'>) => Promise<void>;
  existing?: EMI | null;
}

const inputClass =
  'w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-gray-800 placeholder-gray-400';

const inputErrorClass =
  'w-full px-3.5 py-2.5 text-sm rounded-xl border border-red-300 bg-red-50 focus:bg-white outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all text-gray-800 placeholder-gray-400';

const DEFAULT: Omit<EMI, 'emi_id' | 'is_active'> = {
  loan_name:               '',
  total_amount:            0,
  emi_amount:              0,
  start_date:              new Date().toISOString().split('T')[0],
  end_date:                null,
  payment_day:             null,
  remaining_installments:  null,
};

export default function EMIFormModal({ isOpen, onClose, onSave, existing }: EMIFormModalProps) {
  const { user } = useAuth();

  const [form, setForm]         = useState(DEFAULT);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError]       = useState('');

  // Inline field-level errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // User's salary and total of other active EMIs (to check budget)
  const [monthlySalary, setMonthlySalary]         = useState(0);
  const [otherActiveEMITotal, setOtherActiveEMITotal] = useState(0);

  // Reset form and fetch user data whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (existing) {
      setForm({
        loan_name:              existing.loan_name,
        total_amount:           existing.total_amount,
        emi_amount:             existing.emi_amount,
        start_date:             existing.start_date,
        end_date:               existing.end_date,
        payment_day:            existing.payment_day,
        remaining_installments: existing.remaining_installments,
      });
    } else {
      setForm(DEFAULT);
    }

    setError('');
    setFieldErrors({});

    if (!user?.id) return;

    // Fetch salary + existing active EMIs (excluding this one if editing)
    const fetchBudgetData = async () => {
      const [userRes, emiRes] = await Promise.all([
        supabase
          .from('users')
          .select('monthly_salary')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('emi_payments')
          .select('emi_id, emi_amount')
          .eq('user_id', user.id)
          .eq('is_active', true),
      ]);

      const salary = Number(userRes.data?.monthly_salary ?? 0);
      setMonthlySalary(salary);

      // When editing, exclude this loan's own EMI from the total
      const otherEMIs = (emiRes.data || [])
        .filter((e) => !existing || e.emi_id !== existing.emi_id)
        .reduce((s, e) => s + Number(e.emi_amount), 0);
      setOtherActiveEMITotal(otherEMIs);
    };

    fetchBudgetData();
  }, [existing, isOpen, user?.id]);

  const set = (field: string, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field error as user types
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Validate EMI vs total loan — called on blur of either field
  const validateEMIvsTotal = () => {
    if (form.emi_amount > 0 && form.total_amount > 0 && form.emi_amount > form.total_amount) {
      setFieldErrors((prev) => ({
        ...prev,
        emi_amount: 'Monthly EMI cannot exceed total loan amount.',
      }));
    } else {
      setFieldErrors((prev) => ({ ...prev, emi_amount: '' }));
    }
  };

  // Validate payment_day — called on blur
  const validatePaymentDay = () => {
    const day = form.payment_day;
    if (day !== null && (day < 1 || day > 31)) {
      setFieldErrors((prev) => ({
        ...prev,
        payment_day: 'Due day must be between 1 and 31.',
      }));
    } else {
      setFieldErrors((prev) => ({ ...prev, payment_day: '' }));
    }
  };

  // Derived values
  const estimatedInstallments =
    form.total_amount > 0 && form.emi_amount > 0
      ? Math.ceil(form.total_amount / form.emi_amount)
      : null;

  // Live warning: new EMI would exceed available salary budget
  const projectedTotalEMI = otherActiveEMITotal + (form.emi_amount || 0);
  const emiExceedsSalary  = monthlySalary > 0 && projectedTotalEMI > monthlySalary;
  const emiWarningMsg     = emiExceedsSalary
    ? `Your total monthly EMIs would be NRs ${projectedTotalEMI.toLocaleString('en-IN')}, which exceeds your salary of NRs ${monthlySalary.toLocaleString('en-IN')}.`
    : null;

  const handleSave = async () => {
    // Full validation on submit
    if (!form.loan_name.trim()) {
      setError('Loan name is required.');
      return;
    }
    if (!form.total_amount || form.total_amount <= 0) {
      setError('Please enter a valid total loan amount.');
      return;
    }
    if (!form.emi_amount || form.emi_amount <= 0) {
      setError('Please enter a valid monthly EMI.');
      return;
    }
    if (form.emi_amount > form.total_amount) {
      setFieldErrors((prev) => ({
        ...prev,
        emi_amount: 'Monthly EMI cannot exceed total loan amount.',
      }));
      return;
    }
    if (form.payment_day !== null && (form.payment_day < 1 || form.payment_day > 31)) {
      setFieldErrors((prev) => ({
        ...prev,
        payment_day: 'Due day must be between 1 and 31.',
      }));
      return;
    }
    // Hard block: EMI would push total EMIs over salary
    if (emiExceedsSalary) {
      setError(
        `Cannot add this loan. Your total monthly EMIs (NRs ${projectedTotalEMI.toLocaleString('en-IN')}) would exceed your monthly salary of NRs ${monthlySalary.toLocaleString('en-IN')}.`
      );
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <CreditCard size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      {existing ? 'Edit Loan' : 'Add New Loan'}
                    </h2>
                    <p className="text-xs text-gray-400">
                      Fields marked <span className="text-red-400">*</span> are required
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Global error */}
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-3.5 py-2.5 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {/* Loan name — required */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Loan Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Car Loan, Home Loan"
                    value={form.loan_name}
                    onChange={(e) => set('loan_name', e.target.value)}
                    className={inputClass}
                    autoFocus
                  />
                </div>

                {/* Total amount + Monthly EMI — both required */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                      Total Loan Amount <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">NRs</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={form.total_amount || ''}
                        onChange={(e) => set('total_amount', parseFloat(e.target.value) || 0)}
                        onBlur={validateEMIvsTotal}
                        className={`${inputClass} pl-10`}
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                      Monthly EMI <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">NRs</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={form.emi_amount || ''}
                        onChange={(e) => set('emi_amount', parseFloat(e.target.value) || 0)}
                        onBlur={validateEMIvsTotal}
                        className={`${fieldErrors.emi_amount ? inputErrorClass : inputClass} pl-10`}
                        min="0"
                      />
                    </div>
                    {/* Inline error: EMI > total loan */}
                    {fieldErrors.emi_amount && (
                      <motion.p
                        initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-500 mt-1 font-medium"
                      >
                        {fieldErrors.emi_amount}
                      </motion.p>
                    )}
                  </div>
                </div>

                {/* Estimated installments */}
                {estimatedInstallments && !fieldErrors.emi_amount && (
                  <p className="text-xs text-blue-600 bg-blue-50 px-3.5 py-2 rounded-xl">
                    Estimated <span className="font-semibold">{estimatedInstallments} installments</span> to pay off this loan
                  </p>
                )}

                {/* EMI exceeds salary warning — shown live as user types */}
                {emiWarningMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl"
                  >
                    <Info size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700 font-medium leading-relaxed">
                      {emiWarningMsg}
                    </p>
                  </motion.div>
                )}

                {/* Start date + Due day */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => set('start_date', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                      Due Day of Month
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 5"
                      value={form.payment_day || ''}
                      onChange={(e) => set('payment_day', parseInt(e.target.value) || null)}
                      onBlur={validatePaymentDay}
                      min="1"
                      max="31"
                      className={fieldErrors.payment_day ? inputErrorClass : inputClass}
                    />
                    {/* Inline error: invalid day */}
                    {fieldErrors.payment_day && (
                      <motion.p
                        initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-500 mt-1 font-medium"
                      >
                        {fieldErrors.payment_day}
                      </motion.p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={isSaving || !!fieldErrors.emi_amount || !!fieldErrors.payment_day}
                  className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <motion.div animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : existing ? 'Save Changes' : 'Add Loan'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}