'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { EMI, EMIPaymentLog, currentMonthKey, isPaidThisMonth } from './utils';
import EMISummaryBox from './EMISummaryBox';
import EMITable from './EMITable';
import EMIFormModal from './EMIFormModal';

export default function EMIMainContent() {
  const { user } = useAuth();

  const [emis, setEmis] = useState<EMI[]>([]);
  const [logs, setLogs] = useState<EMIPaymentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trigger, setTrigger] = useState(0);
  const refetch = () => setTrigger((t) => t + 1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEMI, setEditingEMI] = useState<EMI | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);

      const [emiResult, logResult] = await Promise.all([
        supabase
          .from('emi_payments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),

        supabase
          .from('emi_payment_logs')
          .select('*')
          .eq('user_id', user.id),
      ]);

      if (cancelled) return;
      setEmis((emiResult.data || []) as EMI[]);
      setLogs((logResult.data || []) as EMIPaymentLog[]);
      setIsLoading(false);
    };

    run();
    return () => { cancelled = true; };
  }, [user?.id, trigger]);

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

  const handleEdit = (emi: EMI) => {
    setEditingEMI(emi);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingEMI(null);
    setModalOpen(true);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this loan? This will also remove its payment history.')) return;
    if (!user?.id) return;

    await supabase.from('emi_payment_logs').delete().eq('emi_id', id);
    await supabase.from('emi_payments').delete().eq('emi_id', id).eq('user_id', user.id);
    refetch();
  };

  // ── Toggle paid this month ─────────────────────────────────────────────────
  const handleTogglePaid = async (emi: EMI) => {
    if (!user?.id) return;
    const monthKey = currentMonthKey();
    const alreadyPaid = isPaidThisMonth(emi, logs);

    if (alreadyPaid) {
      // Remove the log for this month
      await supabase
        .from('emi_payment_logs')
        .delete()
        .eq('emi_id', emi.emi_id)
        .eq('user_id', user.id)
        .like('paid_month', `${monthKey.slice(0, 7)}%`);
    } else {
      // Insert a new log for this month
      await supabase.from('emi_payment_logs').insert({
        emi_id: emi.emi_id,
        user_id: user.id,
        paid_month: monthKey,
      });
    }

    refetch();
  };

  // ── Loading ────────────────────────────────────────────────────────────────
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

        {/* ── Header ─────────────────────────────────────────────────────── */}
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

        {/* ── Summary boxes ──────────────────────────────────────────────── */}
        <EMISummaryBox emis={emis} logs={logs} />

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <EMITable
          emis={emis}
          logs={logs}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onTogglePaid={handleTogglePaid}
          onAdd={handleAdd}
        />
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      <EMIFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEMI(null); }}
        onSave={handleSave}
        existing={editingEMI}
      />
    </div>
  );
}