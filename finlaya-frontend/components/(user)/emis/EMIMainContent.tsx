'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, AlertTriangle, Sliders, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { EMI, EMIPaymentLog, currentMonthKey } from './utils';
import EMISummaryBox from './EMISummaryBox';
import EMITable from './EMITable';
import EMIFormModal from './EMIFormModal';

// ── Two-button confirmation dialog (used for low-balance warnings) ─────────────

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
                <button onClick={onCancel}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={onConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors">
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

// ── Rebalance dialog — shown after a loan causes category overflow ─────────────
// Three choices: Auto-scale, Edit Manually, Dismiss

interface RebalanceDialogProps {
  isOpen:          boolean;
  overflowAmount:  number; // how much over budget the categories are
  newBudgetable:   number; // new budgetable salary after the loan
  isScaling:       boolean;
  onAutoScale:     () => void;
  onEditManually:  () => void;
  onDismiss:       () => void;
}

function RebalanceDialog({
  isOpen, overflowAmount, newBudgetable, isScaling, onAutoScale, onEditManually, onDismiss,
}: RebalanceDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={onDismiss}
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
              <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                <AlertTriangle size={20} className="text-orange-500" />
              </div>

              <h3 className="text-base font-bold text-gray-900 mb-2">
                Categories exceed new budget
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">
                Adding this loan reduced your available budget by{' '}
                <span className="font-semibold text-gray-700">
                  NRs {overflowAmount.toLocaleString('en-IN')}
                </span>
                . Your category budgets now exceed your available salary of{' '}
                <span className="font-semibold text-gray-700">
                  NRs {newBudgetable.toLocaleString('en-IN')}
                </span>
                . How would you like to fix this?
              </p>

              {/* Two action buttons */}
              <div className="flex flex-col gap-2.5 mb-3">
                {/* Auto-scale */}
                <button
                  onClick={onAutoScale}
                  disabled={isScaling}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isScaling ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full flex-shrink-0"
                    />
                  ) : (
                    <Sliders size={15} className="flex-shrink-0" />
                  )}
                  <div className="text-left">
                    <p className="font-semibold text-sm">Auto-scale categories</p>
                    <p className="text-xs text-orange-100 font-normal">
                      Proportionally reduce all budgets to fit
                    </p>
                  </div>
                </button>

                {/* Edit manually */}
                <button
                  onClick={onEditManually}
                  disabled={isScaling}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <Pencil size={15} className="flex-shrink-0 text-gray-500" />
                  <div className="text-left">
                    <p className="font-semibold text-sm text-gray-800">Edit manually</p>
                    <p className="text-xs text-gray-400 font-normal">
                      Go to categories page and adjust yourself
                    </p>
                  </div>
                </button>
              </div>

              {/* Dismiss link */}
              <button
                onClick={onDismiss}
                disabled={isScaling}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 font-medium py-1 transition-colors disabled:opacity-40"
              >
                Dismiss for now
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function EMIMainContent() {
  const { user }  = useAuth();
  const router    = useRouter();

  const [emis, setEmis]           = useState<EMI[]>([]);
  const [logs, setLogs]           = useState<EMIPaymentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trigger, setTrigger]     = useState(0);
  const refetch = () => setTrigger((t) => t + 1);

  const [modalOpen, setModalOpen]   = useState(false);
  const [editingEMI, setEditingEMI] = useState<EMI | null>(null);
  const [availableBalance, setAvailableBalance] = useState(0);

  // Dialog: mark paid despite low balance
  const [toggleConfirm, setToggleConfirm] = useState<{
    isOpen: boolean; emi: EMI | null;
  }>({ isOpen: false, emi: null });

  // Dialog: add loan despite low balance (form already closed)
  const [addConfirm, setAddConfirm] = useState<{
    isOpen:         boolean;
    pendingData:    Omit<EMI, 'emi_id' | 'is_active'> | null;
    message:        string;
    editingEMISnap: EMI | null;
  }>({ isOpen: false, pendingData: null, message: '', editingEMISnap: null });

  // Dialog: rebalance categories after loan caused overflow
  const [rebalanceDialog, setRebalanceDialog] = useState<{
    isOpen:         boolean;
    overflowAmount: number;
    newBudgetable:  number;
  }>({ isOpen: false, overflowAmount: 0, newBudgetable: 0 });
  const [isScaling, setIsScaling] = useState(false);

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

  // ── Check if adding a loan caused category overflow ────────────────────────
  // Called after every successful save. Fetches fresh salary + EMI total +
  // category total and compares. If categories > new budgetable → show dialog.

  const checkCategoryOverflow = async () => {
    if (!user?.id) return;

    const [userRes, emiRes, catRes] = await Promise.all([
      supabase.from('users').select('monthly_salary').eq('user_id', user.id).maybeSingle(),
      supabase.from('emi_payments').select('emi_amount').eq('user_id', user.id).eq('is_active', true),
      supabase.from('budget_categories').select('budget_limit').eq('user_id', user.id),
    ]);

    const salary         = Number(userRes.data?.monthly_salary ?? 0);
    const totalEMI       = (emiRes.data || []).reduce((s, e) => s + Number(e.emi_amount), 0);
    const newBudgetable  = Math.max(0, salary - totalEMI);
    const totalCatBudget = (catRes.data || []).reduce((s, c) => s + Number(c.budget_limit), 0);

    // Only show dialog if there are actual categories set up AND they overflow
    if (totalCatBudget > 0 && totalCatBudget > newBudgetable) {
      const overflowAmount = totalCatBudget - newBudgetable;
      setRebalanceDialog({ isOpen: true, overflowAmount, newBudgetable });
    }
  };

  // ── Auto-scale categories proportionally to fit new budgetable salary ──────

  const handleAutoScale = async () => {
    if (!user?.id) return;
    setIsScaling(true);

    const [userRes, emiRes, catRes] = await Promise.all([
      supabase.from('users').select('monthly_salary').eq('user_id', user.id).maybeSingle(),
      supabase.from('emi_payments').select('emi_amount').eq('user_id', user.id).eq('is_active', true),
      supabase.from('budget_categories')
        .select('category_id, budget_limit')
        .eq('user_id', user.id),
    ]);

    const salary        = Number(userRes.data?.monthly_salary ?? 0);
    const totalEMI      = (emiRes.data || []).reduce((s, e) => s + Number(e.emi_amount), 0);
    const newBudgetable = Math.max(0, salary - totalEMI);
    const categories    = catRes.data || [];
    const totalCurrent  = categories.reduce((s, c) => s + Number(c.budget_limit), 0);

    if (totalCurrent <= 0 || newBudgetable <= 0) {
      setIsScaling(false);
      setRebalanceDialog({ isOpen: false, overflowAmount: 0, newBudgetable: 0 });
      return;
    }

    // Scale factor: how much to multiply each budget by
    const scaleFactor = newBudgetable / totalCurrent;

    // Update each category proportionally
    // Use the largest-remainder method so totals sum exactly to newBudgetable
    const scaled = categories.map((c) => ({
      category_id: c.category_id,
      exact:       Number(c.budget_limit) * scaleFactor,
    }));

    const floored      = scaled.map((c) => ({ ...c, budget: Math.floor(c.exact) }));
    const remainder    = newBudgetable - floored.reduce((s, c) => s + c.budget, 0);
    const sortedByFrac = [...floored]
      .map((c, i) => ({ i, frac: scaled[i].exact - c.budget }))
      .sort((a, b) => b.frac - a.frac);

    const finalBudgets = [...floored];
    for (let n = 0; n < Math.round(remainder); n++) {
      finalBudgets[sortedByFrac[n].i].budget += 1;
    }

    // Write all updates to Supabase in parallel
    await Promise.all(
      finalBudgets.map((c) =>
        supabase
          .from('budget_categories')
          .update({
            budget_limit:          c.budget,
            allocation_percentage: newBudgetable > 0
              ? Math.round((c.budget / newBudgetable) * 100)
              : 0,
            updated_at: new Date().toISOString(),
          })
          .eq('category_id', c.category_id)
          .eq('user_id', user.id)
      )
    );

    setIsScaling(false);
    setRebalanceDialog({ isOpen: false, overflowAmount: 0, newBudgetable: 0 });
    // No page navigation needed — user stays on EMI page
  };

  // ── Save (add / edit) ──────────────────────────────────────────────────────

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

    // After saving, check if categories now overflow the new budgetable salary
    await checkCategoryOverflow();
  };

  const handleSaveDirect = async (data: Omit<EMI, 'emi_id' | 'is_active'>) => {
    await doSave(data, editingEMI);
  };

  const handleSaveNeedsConfirm = (
    data: Omit<EMI, 'emi_id' | 'is_active'>,
    message: string,
  ) => {
    const snap = editingEMI;
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

  const doTogglePaid = async (emi: EMI, alreadyPaid: boolean) => {
    if (!user?.id) return;
    const monthKey = currentMonthKey();

    if (alreadyPaid) {
      await supabase
        .from('emi_payment_logs')
        .delete()
        .eq('emi_id', emi.emi_id)
        .eq('user_id', user.id)
        .gte('paid_month', `${monthKey.slice(0, 7)}-01`)
        .lte('paid_month', `${monthKey.slice(0, 7)}-31`);
    } else {
      await supabase.from('emi_payment_logs').insert({
        emi_id: emi.emi_id, user_id: user.id, paid_month: monthKey,
      });
    }
    refetch();
  };

  const handleTogglePaid = (emi: EMI, alreadyPaid: boolean) => {
    if (alreadyPaid) { doTogglePaid(emi, true); return; }
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

      {/* Confirm: add loan despite low balance */}
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

      {/* Rebalance: categories overflow after new loan was added */}
      <RebalanceDialog
        isOpen={rebalanceDialog.isOpen}
        overflowAmount={rebalanceDialog.overflowAmount}
        newBudgetable={rebalanceDialog.newBudgetable}
        isScaling={isScaling}
        onAutoScale={handleAutoScale}
        onEditManually={() => {
          setRebalanceDialog({ isOpen: false, overflowAmount: 0, newBudgetable: 0 });
          router.push('/categories');
        }}
        onDismiss={() =>
          setRebalanceDialog({ isOpen: false, overflowAmount: 0, newBudgetable: 0 })
        }
      />
    </div>
  );
}