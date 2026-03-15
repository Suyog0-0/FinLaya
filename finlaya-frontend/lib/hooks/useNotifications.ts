'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

export interface AppNotification {
  id:         string;
  type:       'budget_alert' | 'bill_reminder';
  title:      string;
  message:    string;
  is_read:    boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading,       setLoading]       = useState(true);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Insert one notification - plain insert, unique index silently rejects duplicates
  const insertIfNew = async (
    userId:   string,
    type:     'budget_alert' | 'bill_reminder',
    title:    string,
    message:  string,
    dedupKey: string,
  ) => {
    const { error } = await supabase.from('notifications').insert({
      user_id:   userId,
      type,
      title,
      message,
      dedup_key: dedupKey,
      is_read:   false,
    });
    // 23505 = unique_violation, expected when notification already exists
    if (error && error.code !== '23505') {
      console.error('[notifications] insert error:', error);
    }
  };

  // Generate budget alert notifications at 90% threshold
  const generateBudgetAlerts = useCallback(async (userId: string, enabled: boolean) => {
    if (!enabled) return;

    const now        = new Date();
    const monthKey   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [{ data: cats, error: catErr }, { data: expenses, error: expErr }] = await Promise.all([
      supabase
        .from('budget_categories')
        .select('category_id, category_name, budget_limit')
        .eq('user_id', userId),
      supabase
        .from('expenses')
        .select('amount, category_id')
        .eq('user_id', userId)
        .gte('expense_date', monthStart)
        .lte('expense_date', monthEnd),
    ]);

    if (catErr)  { console.error('[notifications] cats error:', catErr);     return; }
    if (expErr)  { console.error('[notifications] expenses error:', expErr); return; }
    if (!cats || !expenses) return;

    const spentMap: Record<number, number> = {};
    for (const e of expenses) {
      if (e.category_id) {
        spentMap[e.category_id] = (spentMap[e.category_id] || 0) + Number(e.amount);
      }
    }

    for (const cat of cats) {
      const budget = Number(cat.budget_limit);
      if (budget <= 0) continue;

      const spent      = spentMap[cat.category_id] || 0;
      const pct        = spent / budget;

      if (pct >= 0.9) {
        const isOver     = spent >= budget;
        const roundedPct = Math.round(pct * 100);
        const dedupKey   = `budget_${cat.category_id}_${monthKey}_${isOver ? 'over' : '90pct'}`;

        await insertIfNew(
          userId,
          'budget_alert',
          isOver
            ? `${cat.category_name} budget exceeded`
            : `${cat.category_name} at ${roundedPct}% of budget`,
          isOver
            ? `You've spent NRs ${Math.round(spent).toLocaleString('en-IN')} - NRs ${Math.round(spent - budget).toLocaleString('en-IN')} over your NRs ${Math.round(budget).toLocaleString('en-IN')} budget.`
            : `You've used ${roundedPct}% of your NRs ${Math.round(budget).toLocaleString('en-IN')} ${cat.category_name} budget this month.`,
          dedupKey,
        );
      }
    }
  }, []);

  // Generate bill reminder notifications 3 days and 1 day before due
  const generateBillReminders = useCallback(async (userId: string, enabled: boolean) => {
    if (!enabled) return;

    const now      = new Date();
    const today    = now.getDate();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const { data: emis, error: emiErr } = await supabase
      .from('emi_payments')
      .select('emi_id, loan_name, emi_amount, payment_day')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (emiErr) { console.error('[notifications] emi error:', emiErr); return; }
    if (!emis || emis.length === 0) return;

    const { data: logs } = await supabase
      .from('emi_payment_logs')
      .select('emi_id')
      .eq('user_id', userId)
      .gte('paid_month', `${monthKey}-01`)
      .lte('paid_month', `${monthKey}-31`);

    const paidIds = new Set((logs || []).map((l) => l.emi_id));

    for (const emi of emis) {
      if (!emi.payment_day)        continue;
      if (paidIds.has(emi.emi_id)) continue;

      const daysUntilDue = emi.payment_day - today;

      if (daysUntilDue === 3 || daysUntilDue === 1) {
        const tag      = daysUntilDue === 1 ? '1day' : '3day';
        const dedupKey = `bill_${emi.emi_id}_${monthKey}_${tag}`;

        await insertIfNew(
          userId,
          'bill_reminder',
          `${emi.loan_name} due ${daysUntilDue === 1 ? 'tomorrow' : 'in 3 days'}`,
          `Your EMI of NRs ${Number(emi.emi_amount).toLocaleString('en-IN')} is due on day ${emi.payment_day} of this month.`,
          dedupKey,
        );
      }
    }
  }, []);

  // Fetch all notifications from DB
  const fetchNotifications = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) { console.error('[notifications] fetch error:', error); }
    setNotifications((data || []) as AppNotification[]);
    setLoading(false);
  }, []);

  // Mark one notification as read
  const markRead = async (id: string) => {
    if (!user?.id) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', user.id);
  };

  // Mark all as read
  const markAllRead = async () => {
    if (!user?.id) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  };

  // Main effect - retries session up to 3 times to handle slow hydration
  useEffect(() => {
    if (!user?.id) return;

    const init = async () => {
      // Supabase session can take a tick to hydrate from storage.
      // Retry up to 3 times with 300ms delay before giving up.
      let session = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          session = data.session;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      if (!session) return;

      const userId = session.user.id;

      // Load preferences
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('budget_alerts, bill_reminders')
        .eq('user_id', userId)
        .maybeSingle();

      const budgetAlertsEnabled  = prefs?.budget_alerts  ?? true;
      const billRemindersEnabled = prefs?.bill_reminders ?? true;

      // Generate new notifications (dedup_key makes these safe to run repeatedly)
      await generateBudgetAlerts(userId, budgetAlertsEnabled);
      await generateBillReminders(userId, billRemindersEnabled);

      // Fetch everything to display
      await fetchNotifications(userId);
    };

    init();
  }, [user?.id, generateBudgetAlerts, generateBillReminders, fetchNotifications]);

  return { notifications, unreadCount, loading, markRead, markAllRead };
}