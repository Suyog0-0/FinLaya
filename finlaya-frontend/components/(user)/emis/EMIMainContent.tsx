'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { EMI, EMIPaymentLog, currentMonthKey } from './utils';
import EMISummaryBox from './EMISummaryBox';
import EMITable from './EMITable';
import EMIFormModal from './EMIFormModal';

// ── Reusable confirmation dialog ───────────────────────────────────────────────

interface ConfirmDialogProps {
  isOpen:        boolean;
  title:         string;
  message:       string;
  confirmLabel?: string;
  onConfirm:     () => void;
  onCancel:      () => void;
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

  const [emis, setEmis]           = useState<EMI[]>([]);
  const [logs, setLogs]           = useState<EMIPaymentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trigger, setTrigger]     = useState(0);
  const refetch = () => setTrigger((t) => t + 1);

  const [modalOpen, setModalOpen]   = useState(false);
  const [editingEMI, setEditingEMI] = useState<EMI | null>(null);
  const [availableBalance, setAvailableBalance] = useState(0);

  // Dialog for marking a loan paid when balance is low
  const [toggleConfirm, setToggleConfirm] = useState<{
    isOpen: boolean;
    emi:    EMI | null;
  }>({ isOpen: false, emi: null });

  // Dialog for adding a loan when EMI exceeds balance.
  // The form modal is closed BEFORE this dialog appears.
  // We snapshot editingEMI here so doSave doesn't rely on a stale closure.
  const [addConfirm, setAddConfirm] = useState<{
    isOpen:         boolean;
    pendingData:    Omit<EMI, 'emi_id' | 'is_active'> | null;
    message:        string;
    editingEMISnap: EMI | null; // snapshot of editingEMI at the time user submitted
  }>({ isOpen: false, pendingData: null, message: '', editingEMISnap: null });

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    const [emiResult, logResult, userRes, incomeRes, expenseRes, goalRes] = await Promise.all([
      supabase.from('emi_payments').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('emi_payment_logs').select('*').eq('user_id', user.id),
      supabase.from('users').select('monthly_salary').eq('user_id', user.id).maybeSingle(),
      supabase.from('income').select('amount').eq('user_id', user.id),
      supabase.from('expenses').select('amount').eq('user_id', user.id),
      supabase.from('goals').select('saved_amount').eq('user_id', user.id),
    ]);

    setEmis((emiResult.data || []) as EMI[]);
    setLogs((logResult.data || []) as EMIPaymentLog[]);

    const salary      = Number(userRes.data?.monthly_salary ?? 0);
    const income      = (incomeRes.data  || []).reduce((s, r) => s + Number(r.amount), 0);
    const expenses    = (expenseRes.data || []).reduce((s, r) => s + Number(r.amount), 0);
    const goalSavings = (goalRes.data    || []).reduce((s, r) => s + Number(r.saved_amount), 0);
    setAvailableBalance(Math.max(0, salary + income - expenses - goalSavings));

    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, trigger]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Save (add / edit) ──────────────────────────────────────────────────────

  // editingEMISnap is passed explicitly so this never reads from a stale closure.
  // When called from the addConfirm dialog the form modal is already closed,
  // so reading `editingEMI` state directly would be unreliable.
  const doSave = async (
    data: Omit<EMI, 'emi_id' | 'is_active'>,
    editingEMISnap: EMI | null,
  ) => {
    if (!user?.id) return;
    if (editingEMISnap) {
      await supabase
        .from('emi_payments')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('emi_id', editingEMISnap.emi_id)
        .eq('user_id', user.id);
    } else {
      await supabase.from('emi_payments').insert({ ...data, user_id: user.id, is_active: true });
    }
    setEditingEMI(null);
    refetch();
  };

  // EMIFormModal calls this when balance is fine → pass editingEMI snapshot now
  const handleSaveDirect = async (data: Omit<EMI, 'emi_id' | 'is_active'>) => {
    await doSave(data, editingEMI);
  };

  // EMIFormModal calls this when balance is LOW →
  // Snapshot editingEMI NOW (before modal closes and state can drift),
  // close the form modal, then show the confirm dialog.
  const handleSaveNeedsConfirm = (
    data: Omit<EMI, 'emi_id' | 'is_active'>,
    message: string,
  ) => {
    const snap = editingEMI; // capture before setModalOpen triggers any re-render
    setModalOpen(false);
    setAddConfirm({ isOpen: true, pendingData: data, message, editingEMISnap: snap });
  };

  const handleEdit = (emi: EMI) => { setEditingEMI(emi); setModalOpen(true); };
  const handleAdd  = ()          => { setEditingEMI(null); setModalOpen(true); };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this loan? This will also remove its payment history.')) return;
    if (!user?.id) return;
    await supabase.from('emi_payment_logs').delete().eq('emi_id', id);
    await supabase.from('emi_payments').delete().eq('emi_id', id).eq('user_id', user.id);
    refetch();
  };

  // ── Toggle paid ────────────────────────────────────────────────────────────
  // BUG FIX: `alreadyPaid` is passed in from EMITable where it is computed
  // from the fresh `logs` prop at click time — never from a stale closure.
  // Previously, re-deriving it inside this function from the `logs` state
  // caused the wrong loan to be unticked after a sort re-render.

  const doTogglePaid = async (emi: EMI, alreadyPaid: boolean) => {
    if (!user?.id) return;
    const monthKey = currentMonthKey();

    if (alreadyPaid) {
      await supabase
        .from('emi_payment_logs')
        .delete()
        .eq('emi_id', emi.emi_id)   // exact loan — no ambiguity
        .eq('user_id', user.id)
        .gte('paid_month', `${monthKey.slice(0, 7)}-01`)
        .lte('paid_month', `${monthKey.slice(0, 7)}-31`);
    } else {
      await supabase.from('emi_payment_logs').insert({
        emi_id:     emi.emi_id,
        user_id:    user.id,
        paid_month: monthKey,
      });
    }

    refetch();
  };

  // EMITable passes (emi, alreadyPaid) — alreadyPaid computed there at click time
  const handleTogglePaid = (emi: EMI, alreadyPaid: boolean) => {
    if (alreadyPaid) {
      doTogglePaid(emi, true);
      return;
    }
    if (emi.emi_amount > availableBalance) {
      setToggleConfirm({ isOpen: true, emi });
      return;
    }
    doTogglePaid(emi, false);
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

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">EMI & Loans</h1>
            <p className="text-gray-500 text-sm mt-1">Track your active loans and monthly payments</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-md transition-all"
          >
            <Plus size={16} /> Add Loan
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

      {/* Add / Edit form modal */}
      <EMIFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEMI(null); }}
        onSaveDirect={handleSaveDirect}
        onSaveNeedsConfirm={handleSaveNeedsConfirm}
        existing={editingEMI}
        availableBalance={availableBalance}
      />

      {/* Confirm: mark paid despite low balance */}
      <ConfirmDialog
        isOpen={toggleConfirm.isOpen}
        title="Low balance warning"
        message={
          toggleConfirm.emi
            ? `Your available balance is NRs ${availableBalance.toLocaleString('en-IN')}, which is less than this EMI of NRs ${toggleConfirm.emi.emi_amount.toLocaleString('en-IN')}. Do you still want to mark it as paid?`
            : ''
        }
        confirmLabel="Mark as Paid"
        onConfirm={() => {
          if (toggleConfirm.emi) doTogglePaid(toggleConfirm.emi, false);
          setToggleConfirm({ isOpen: false, emi: null });
        }}
        onCancel={() => setToggleConfirm({ isOpen: false, emi: null })}
      />

      {/* Confirm: add loan despite low balance — shown AFTER form modal closes */}
      <ConfirmDialog
        isOpen={addConfirm.isOpen}
        title="Low balance warning"
        message={addConfirm.message}
        confirmLabel="Add Anyway"
        onConfirm={async () => {
          if (addConfirm.pendingData) {
            await doSave(addConfirm.pendingData, addConfirm.editingEMISnap);
          }
          setAddConfirm({ isOpen: false, pendingData: null, message: '', editingEMISnap: null });
        }}
        onCancel={() => setAddConfirm({ isOpen: false, pendingData: null, message: '', editingEMISnap: null })}
      />
    </div>
  );
}