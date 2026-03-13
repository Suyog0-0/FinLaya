'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { EMI, EMIPaymentLog, currentMonthKey, isPaidThisMonth } from './utils';
import EMISummaryBox from './EMISummaryBox';
import EMITable from './EMITable';
import EMIFormModal from './EMIFormModal';

// ── Small confirmation dialog ──────────────────────────────────────────────────

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  isOpen, title, message, confirmLabel = 'Confirm', onConfirm, onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={onCancel}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <AlertTriangle size={20} className="text-amber-500" />
              </div>

              <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">{message}</p>

              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
                >
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function EMIMainContent() {
  const { user } = useAuth();

  const [emis, setEmis]         = useState<EMI[]>([]);
  const [logs, setLogs]         = useState<EMIPaymentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trigger, setTrigger]   = useState(0);
  const refetch = () => setTrigger((t) => t + 1);

  const [modalOpen, setModalOpen]   = useState(false);
  const [editingEMI, setEditingEMI] = useState<EMI | null>(null);

  // Available balance — fetched once and refreshed on refetch
  const [availableBalance, setAvailableBalance] = useState(0);

  // Confirmation dialog state
  const [confirmState, setConfirmState] = useState<{
    isOpen:    boolean;
    emi:       EMI | null;
    title:     string;
    message:   string;
  }>({ isOpen: false, emi: null, title: '', message: '' });

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    const [emiResult, logResult, userRes, incomeRes, expenseRes, goalRes] = await Promise.all([
      supabase
        .from('emi_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),

      supabase
        .from('emi_payment_logs')
        .select('*')
        .eq('user_id', user.id),

      supabase
        .from('users')
        .select('monthly_salary')
        .eq('user_id', user.id)
        .maybeSingle(),

      supabase
        .from('income')
        .select('amount')
        .eq('user_id', user.id),

      supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id),

      supabase
        .from('goals')
        .select('saved_amount')
        .eq('user_id', user.id),
    ]);

    setEmis((emiResult.data || []) as EMI[]);
    setLogs((logResult.data || []) as EMIPaymentLog[]);

    // Available balance = salary + other income - expenses - goal savings
    const salary      = Number(userRes.data?.monthly_salary ?? 0);
    const income      = (incomeRes.data  || []).reduce((s, r) => s + Number(r.amount), 0);
    const expenses    = (expenseRes.data || []).reduce((s, r) => s + Number(r.amount), 0);
    const goalSavings = (goalRes.data    || []).reduce((s, r) => s + Number(r.saved_amount), 0);
    setAvailableBalance(Math.max(0, salary + income - expenses - goalSavings));

    setIsLoading(false);
  }, [user?.id, trigger]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Add / Edit ─────────────────────────────────────────────────────────────

  const handleSave = async (data: Omit<EMI, 'emi_id' | 'is_active'>) => {
    if (!user?.id) return;
    if (editingEMI) {
      await supabase
        .from('emi_payments')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('emi_id', editingEMI.emi_id)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('emi_payments')
        .insert({ ...data, user_id: user.id, is_active: true });
    }
    setEditingEMI(null);
    refetch();
  };

  const handleEdit  = (emi: EMI) => { setEditingEMI(emi); setModalOpen(true); };
  const handleAdd   = ()          => { setEditingEMI(null); setModalOpen(true); };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this loan? This will also remove its payment history.')) return;
    if (!user?.id) return;
    await supabase.from('emi_payment_logs').delete().eq('emi_id', id);
    await supabase.from('emi_payments').delete().eq('emi_id', id).eq('user_id', user.id);
    refetch();
  };

  // ── Actually write the toggle to Supabase ──────────────────────────────────

  const doTogglePaid = async (emi: EMI) => {
    if (!user?.id) return;
    const monthKey     = currentMonthKey();
    const alreadyPaid  = isPaidThisMonth(emi, logs);

    if (alreadyPaid) {
      // Unmark — always allowed, no balance check needed
      await supabase
        .from('emi_payment_logs')
        .delete()
        .eq('emi_id', emi.emi_id)
        .eq('user_id', user.id)
        .gte('paid_month', `${monthKey.slice(0, 7)}-01`)
        .lte('paid_month', `${monthKey.slice(0, 7)}-31`);
    } else {
      // Mark as paid
      await supabase.from('emi_payment_logs').insert({
        emi_id:     emi.emi_id,
        user_id:    user.id,
        paid_month: monthKey,
      });
    }

    refetch();
  };

  // ── Toggle paid — check balance first, show dialog if low ─────────────────

  const handleTogglePaid = (emi: EMI) => {
    const alreadyPaid = isPaidThisMonth(emi, logs);

    // Unmarking is always fine — no dialog needed
    if (alreadyPaid) {
      doTogglePaid(emi);
      return;
    }

    // Marking as paid — check if available balance covers this EMI
    if (emi.emi_amount > availableBalance) {
      // Show confirmation dialog with low-savings warning
      setConfirmState({
        isOpen:  true,
        emi,
        title:   'Low balance warning',
        message: `Your available balance is NRs ${availableBalance.toLocaleString('en-IN')}, which is less than this EMI of NRs ${emi.emi_amount.toLocaleString('en-IN')}. Do you still want to mark it as paid?`,
      });
      return;
    }

    // Balance is fine — proceed directly
    doTogglePaid(emi);
  };

  // Confirm dialog callbacks
  const handleConfirm = () => {
    if (confirmState.emi) doTogglePaid(confirmState.emi);
    setConfirmState({ isOpen: false, emi: null, title: '', message: '' });
  };
  const handleCancelConfirm = () => {
    setConfirmState({ isOpen: false, emi: null, title: '', message: '' });
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-72 bg-gray-100 rounded mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">EMI & Loans</h1>
            <p className="text-gray-500 text-sm mt-1">
              Track your active loans and monthly payments
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-md transition-all"
          >
            <Plus size={16} />
            Add Loan
          </button>
        </div>

        <EMISummaryBox emis={emis} logs={logs} />

        <EMITable
          emis={emis}
          logs={logs}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onTogglePaid={handleTogglePaid}
          onAdd={handleAdd}
        />
      </div>

      {/* Add/Edit modal */}
      <EMIFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEMI(null); }}
        onSave={handleSave}
        existing={editingEMI}
        availableBalance={availableBalance}
      />

      {/* Low-balance confirmation dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel="Mark as Paid"
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />
    </div>
  );
}