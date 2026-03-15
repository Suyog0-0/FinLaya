'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface AppNotification {
  id:         string;
  type:       'budget_alert' | 'bill_reminder';
  title:      string;
  message:    string;
  is_read:    boolean;
  severity:   NotificationSeverity;
  created_at: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  toasts:        AppNotification[];
  unreadCount:   number;
  loading:       boolean;
  refresh:       () => Promise<void>;
  markRead:      (id: string) => Promise<void>;
  markAllRead:   () => Promise<void>;
  dismissToast:  (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  toasts:        [],
  unreadCount:   0,
  loading:       true,
  refresh:       async () => {},
  markRead:      async () => {},
  markAllRead:   async () => {},
  dismissToast:  () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

async function insertIfNew(
  userId:   string,
  type:     'budget_alert' | 'bill_reminder',
  title:    string,
  message:  string,
  dedupKey: string,
  severity: NotificationSeverity,
) {
  const { error } = await supabase.from('notifications').insert({
    user_id:   userId,
    type,
    title,
    message,
    dedup_key: dedupKey,
    is_read:   false,
    severity,
  });
  if (error && error.code !== '23505') {
    console.error('[notifications] insert error:', error);
  }
}

async function generateBudgetAlerts(userId: string, enabled: boolean) {
  if (!enabled) return;

  const now        = new Date();
  const monthKey   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [{ data: cats }, { data: expenses }] = await Promise.all([
    supabase.from('budget_categories').select('category_id, category_name, budget_limit').eq('user_id', userId),
    supabase.from('expenses').select('amount, category_id').eq('user_id', userId).gte('expense_date', monthStart).lte('expense_date', monthEnd),
  ]);

  if (!cats || !expenses) return;

  const spentMap: Record<number, number> = {};
  for (const e of expenses) {
    if (e.category_id)
      spentMap[e.category_id] = (spentMap[e.category_id] || 0) + Number(e.amount);
  }

  for (const cat of cats) {
    const budget = Number(cat.budget_limit);
    if (budget <= 0) continue;

    const spent      = spentMap[cat.category_id] || 0;
    const pct        = spent / budget;
    const roundedPct = Math.round(pct * 100);

    if (pct >= 1) {
      await insertIfNew(
        userId, 'budget_alert',
        `${cat.category_name} budget exceeded`,
        `You've spent NRs ${Math.round(spent).toLocaleString('en-IN')} — NRs ${Math.round(spent - budget).toLocaleString('en-IN')} over your NRs ${Math.round(budget).toLocaleString('en-IN')} budget.`,
        `budget_${cat.category_id}_${monthKey}_over`,
        'critical',
      );
    } else if (pct >= 0.9) {
      await insertIfNew(
        userId, 'budget_alert',
        `${cat.category_name} at ${roundedPct}% of budget`,
        `You've used ${roundedPct}% of your NRs ${Math.round(budget).toLocaleString('en-IN')} ${cat.category_name} budget this month.`,
        `budget_${cat.category_id}_${monthKey}_90pct`,
        'critical',
      );
    } else if (pct >= 0.8) {
      await insertIfNew(
        userId, 'budget_alert',
        `${cat.category_name} at ${roundedPct}% of budget`,
        `You've used ${roundedPct}% of your NRs ${Math.round(budget).toLocaleString('en-IN')} ${cat.category_name} budget this month.`,
        `budget_${cat.category_id}_${monthKey}_80pct`,
        'warning',
      );
    }
  }
}

async function generateBillReminders(userId: string, enabled: boolean) {
  if (!enabled) return;

  const now      = new Date();
  const today    = now.getDate();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const { data: emis } = await supabase
    .from('emi_payments').select('emi_id, loan_name, emi_amount, payment_day')
    .eq('user_id', userId).eq('is_active', true);

  if (!emis || emis.length === 0) return;

  const { data: logs } = await supabase
    .from('emi_payment_logs').select('emi_id').eq('user_id', userId)
    .gte('paid_month', `${monthKey}-01`).lte('paid_month', `${monthKey}-31`);

  const paidIds = new Set((logs || []).map((l) => l.emi_id));

  for (const emi of emis) {
    if (!emi.payment_day || paidIds.has(emi.emi_id)) continue;
    const daysUntilDue = emi.payment_day - today;
    if (daysUntilDue !== 3 && daysUntilDue !== 1) continue;

    await insertIfNew(
      userId, 'bill_reminder',
      `${emi.loan_name} due ${daysUntilDue === 1 ? 'tomorrow' : 'in 3 days'}`,
      `Your EMI of NRs ${Number(emi.emi_amount).toLocaleString('en-IN')} is due on day ${emi.payment_day} of this month.`,
      `bill_${emi.emi_id}_${monthKey}_${daysUntilDue === 1 ? '1day' : '3day'}`,
      'info',
    );
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts,        setToasts]        = useState<AppNotification[]>([]);
  const [loading,       setLoading]       = useState(true);

  // Track which IDs we've already seen so we only toast truly new ones
  const knownIds = useRef<Set<string>>(new Set());

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('notifications').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(30);

    if (error) { console.error('[notifications] fetch error:', error); return; }

    const fetched = (data || []) as AppNotification[];

    // First load — populate knownIds silently, no toasts yet
    if (knownIds.current.size === 0) {
      fetched.forEach((n) => knownIds.current.add(n.id));
      setNotifications(fetched);
      setLoading(false);
      return;
    }

    // Subsequent refreshes — diff to find brand new notifications
    const brandNew = fetched.filter((n) => !knownIds.current.has(n.id));
    brandNew.forEach((n) => knownIds.current.add(n.id));

    if (brandNew.length > 0) {
      setToasts((prev) => [...prev, ...brandNew]);
    }

    setNotifications(fetched);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    if (!user?.id) return;

    let session = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data } = await supabase.auth.getSession();
      if (data.session) { session = data.session; break; }
      await new Promise((r) => setTimeout(r, 300));
    }
    if (!session) return;

    const userId = session.user.id;

    const { data: prefs } = await supabase
      .from('notification_preferences').select('budget_alerts, bill_reminders')
      .eq('user_id', userId).maybeSingle();

    await generateBudgetAlerts(userId,  prefs?.budget_alerts  ?? true);
    await generateBillReminders(userId, prefs?.bill_reminders ?? true);
    await fetchNotifications(userId);
  }, [user?.id, fetchNotifications]);

  useEffect(() => {
    if (user?.id) refresh();
  }, [user?.id, refresh]);

  const dismissToast = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const markRead = async (id: string) => {
    if (!user?.id) return;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', user.id);
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, toasts, unreadCount, loading, refresh, markRead, markAllRead, dismissToast }}
    >
      {children}
    </NotificationContext.Provider>
  );
}