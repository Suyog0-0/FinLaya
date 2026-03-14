'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { EMI, EMIPaymentLog, currentMonthKey } from './utils';
import EMISummaryBox from './EMISummaryBox';
import EMITable from './EMITable';
import EMIFormModal from './EMIFormModal';
import ConfirmDialog from './ConfirmDialog';
import RebalanceDialog from './RebalanceDialog';

export default function EMIMainContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [emis, setEmis] = useState<EMI[]>([]);
  const [logs, setLogs] = useState<EMIPaymentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trigger, setTrigger] = useState(0);
  const refetch = () => setTrigger((t) => t + 1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEMI, setEditingEMI] = useState<EMI | null>(null);
  const [availableBalance, setAvailableBalance] = useState(0);

  const [toggleConfirm, setToggleConfirm] = useState<{ isOpen: boolean; emi: EMI | null }>({
    isOpen: false,
    emi: null,
  });

  const [addConfirm, setAddConfirm] = useState<{
    isOpen: boolean;
    pendingData: Omit<EMI, 'emi_id' | 'is_active'> | null;
    message: string;
    editingEMISnap: EMI | null;
  }>({ isOpen: false, pendingData: null, message: '', editingEMISnap: null });

  const [rebalanceDialog, setRebalanceDialog] = useState<{
    isOpen: boolean;
    overflowAmount: number;
    newBudgetable: number;
  }>({ isOpen: false, overflowAmount: 0, newBudgetable: 0 });
  const [isScaling, setIsScaling] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    // Scope income/expenses to current month so available balance is accurate
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [emiResult, logResult, userRes, incomeRes, expenseRes, goalRes] = await Promise.all([
      supabase.from('emi_payments').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('emi_payment_logs').select('*').eq('user_id', user.id),
      supabase.from('users').select('monthly_salary').eq('user_id', user.id).maybeSingle(),
      supabase.from('income').select('amount').eq('user_id', user.id).gte('income_date', monthStart).lte('income_date', monthEnd),
      supabase.from('expenses').select('amount').eq('user_id', user.id).gte('expense_date', monthStart).lte('expense_date', monthEnd),
      supabase.from('goals').select('saved_amount').eq('user_id', user.id),
    ]);

    setEmis((emiResult.data || []) as EMI[]);
    setLogs((logResult.data || []) as EMIPaymentLog[]);

    const salary = Number(userRes.data?.monthly_salary ?? 0);
    const income = (incomeRes.data || []).reduce((s, r) => s + Number(r.amount), 0);
    const expenses = (expenseRes.data || []).reduce((s, r) => s + Number(r.amount), 0);
    const goalSavings = (goalRes.data || []).reduce((s, r) => s + Number(r.saved_amount), 0);
    setAvailableBalance(Math.max(0, salary + income - expenses - goalSavings));

    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, trigger]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const checkCategoryOverflow = async () => {
    if (!user?.id) return;
    const [userRes, emiRes, catRes] = await Promise.all([
      supabase.from('users').select('monthly_salary').eq('user_id', user.id).maybeSingle(),
      supabase.from('emi_payments').select('emi_amount').eq('user_id', user.id).eq('is_active', true),
      supabase.from('budget_categories').select('budget_limit').eq('user_id', user.id),
    ]);
    const salary = Number(userRes.data?.monthly_salary ?? 0);
    const totalEMI = (emiRes.data || []).reduce((s, e) => s + Number(e.emi_amount), 0);
    const newBudgetable = Math.max(0, salary - totalEMI);
    const totalCatBudget = (catRes.data || []).reduce((s, c) => s + Number(c.budget_limit), 0);
    if (totalCatBudget > 0 && totalCatBudget > newBudgetable) {
      setRebalanceDialog({ isOpen: true, overflowAmount: totalCatBudget - newBudgetable, newBudgetable });
    }
  };

  const handleAutoScale = async () => {
    if (!user?.id) return;
    setIsScaling(true);
    const [userRes, emiRes, catRes] = await Promise.all([
      supabase.from('users').select('monthly_salary').eq('user_id', user.id).maybeSingle(),
      supabase.from('emi_payments').select('emi_amount').eq('user_id', user.id).eq('is_active', true),
      supabase.from('budget_categories').select('category_id, budget_limit').eq('user_id', user.id),
    ]);
    const salary = Number(userRes.data?.monthly_salary ?? 0);
    const totalEMI = (emiRes.data || []).reduce((s, e) => s + Number(e.emi_amount), 0);
    const newBudgetable = Math.max(0, salary - totalEMI);
    const categories = catRes.data || [];
    const totalCurrent = categories.reduce((s, c) => s + Number(c.budget_limit), 0);
    if (totalCurrent <= 0 || newBudgetable <= 0) {
      setIsScaling(false);
      setRebalanceDialog({ isOpen: false, overflowAmount: 0, newBudgetable: 0 });
      return;
    }
    const scaleFactor = newBudgetable / totalCurrent;
    const scaled = categories.map((c) => ({ ...c, exact: Number(c.budget_limit) * scaleFactor }));
    const floored = scaled.map((c) => ({ ...c, budget: Math.floor(c.exact) }));
    const remainder = newBudgetable - floored.reduce((s, c) => s + c.budget, 0);
    const sortedByFrac = scaled.map((c, i) => ({ i, frac: c.exact - floored[i].budget })).sort((a, b) => b.frac - a.frac);
    const finalBudgets = [...floored];
    for (let n = 0; n < Math.round(remainder); n++) finalBudgets[sortedByFrac[n].i].budget += 1;
    await Promise.all(
      finalBudgets.map((c) =>
        supabase.from('budget_categories').update({
          budget_limit: c.budget,
          allocation_percentage: newBudgetable > 0 ? Math.round((c.budget / newBudgetable) * 100) : 0,
          updated_at: new Date().toISOString(),
        }).eq('category_id', c.category_id).eq('user_id', user.id)
      )
    );
    setIsScaling(false);
    setRebalanceDialog({ isOpen: false, overflowAmount: 0, newBudgetable: 0 });
  };

  const doSave = async (data: Omit<EMI, 'emi_id' | 'is_active'>, editingEMISnap: EMI | null) => {
    if (!user?.id) return;
    if (editingEMISnap) {
      await supabase.from('emi_payments').update({ ...data, updated_at: new Date().toISOString() }).eq('emi_id', editingEMISnap.emi_id).eq('user_id', user.id);
    } else {
      await supabase.from('emi_payments').insert({ ...data, user_id: user.id, is_active: true });
    }
    setEditingEMI(null);
    refetch();
    await checkCategoryOverflow();
  };

  const handleSaveDirect = async (data: Omit<EMI, 'emi_id' | 'is_active'>) => {
    await doSave(data, editingEMI);
  };

  const handleSaveNeedsConfirm = (data: Omit<EMI, 'emi_id' | 'is_active'>, message: string) => {
    const snap = editingEMI;
    setModalOpen(false);
    setAddConfirm({ isOpen: true, pendingData: data, message, editingEMISnap: snap });
  };

  const handleEdit = (emi: EMI) => { setEditingEMI(emi); setModalOpen(true); };
  const handleAdd = () => { setEditingEMI(null); setModalOpen(true); };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this loan? This will also remove its payment history.')) return;
    if (!user?.id) return;
    await supabase.from('emi_payment_logs').delete().eq('emi_id', id);
    await supabase.from('emi_payments').delete().eq('emi_id', id).eq('user_id', user.id);
    refetch();
  };

  const doTogglePaid = async (emi: EMI, alreadyPaid: boolean) => {
    if (!user?.id) return;
    const monthKey = currentMonthKey();
    if (alreadyPaid) {
      await supabase.from('emi_payment_logs').delete()
        .eq('emi_id', emi.emi_id).eq('user_id', user.id)
        .gte('paid_month', `${monthKey.slice(0, 7)}-01`)
        .lte('paid_month', `${monthKey.slice(0, 7)}-31`);
    } else {
      await supabase.from('emi_payment_logs').insert({ emi_id: emi.emi_id, user_id: user.id, paid_month: monthKey });
    }
    refetch();
  };

  const handleTogglePaid = (emi: EMI, alreadyPaid: boolean) => {
    if (alreadyPaid) { doTogglePaid(emi, true); return; }
    if (emi.emi_amount > availableBalance) { setToggleConfirm({ isOpen: true, emi }); return; }
    doTogglePaid(emi, false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-72 bg-gray-100 rounded mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
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

        {/* Page header — consistent with other pages */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">EMI & Loans</h1>
            <p className="text-sm text-gray-500 mt-1">Track your active loans and monthly payments</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
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

      <EMIFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEMI(null); }}
        onSaveDirect={handleSaveDirect}
        onSaveNeedsConfirm={handleSaveNeedsConfirm}
        existing={editingEMI}
        availableBalance={availableBalance}
      />

      <ConfirmDialog
        isOpen={toggleConfirm.isOpen}
        title="Low balance warning"
        message={toggleConfirm.emi ? `Your available balance is NRs ${availableBalance.toLocaleString('en-IN')}, which is less than this EMI of NRs ${toggleConfirm.emi.emi_amount.toLocaleString('en-IN')}. Do you still want to mark it as paid?` : ''}
        confirmLabel="Mark as Paid"
        onConfirm={() => { if (toggleConfirm.emi) doTogglePaid(toggleConfirm.emi, false); setToggleConfirm({ isOpen: false, emi: null }); }}
        onCancel={() => setToggleConfirm({ isOpen: false, emi: null })}
      />

      <ConfirmDialog
        isOpen={addConfirm.isOpen}
        title="Low balance warning"
        message={addConfirm.message}
        confirmLabel="Add Anyway"
        onConfirm={async () => {
          if (addConfirm.pendingData) await doSave(addConfirm.pendingData, addConfirm.editingEMISnap);
          setAddConfirm({ isOpen: false, pendingData: null, message: '', editingEMISnap: null });
        }}
        onCancel={() => setAddConfirm({ isOpen: false, pendingData: null, message: '', editingEMISnap: null })}
      />

      <RebalanceDialog
        isOpen={rebalanceDialog.isOpen}
        overflowAmount={rebalanceDialog.overflowAmount}
        newBudgetable={rebalanceDialog.newBudgetable}
        isScaling={isScaling}
        onAutoScale={handleAutoScale}
        onEditManually={() => { setRebalanceDialog({ isOpen: false, overflowAmount: 0, newBudgetable: 0 }); router.push('/categories'); }}
        onDismiss={() => setRebalanceDialog({ isOpen: false, overflowAmount: 0, newBudgetable: 0 })}
      />
    </div>
  );
}