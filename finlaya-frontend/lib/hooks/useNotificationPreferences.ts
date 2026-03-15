'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

export interface NotificationPreferences {
  budget_alerts:   boolean;
  weekly_reports:  boolean;
  monthly_reports: boolean;
  bill_reminders:  boolean;
}

const DEFAULTS: NotificationPreferences = {
  budget_alerts:   true,
  weekly_reports:  true,
  monthly_reports: false,
  bill_reminders:  true,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [prefs,   setPrefs]   = useState<NotificationPreferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  // ── Load from DB on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setPrefs({
          budget_alerts:   data.budget_alerts,
          weekly_reports:  data.weekly_reports,
          monthly_reports: data.monthly_reports,
          bill_reminders:  data.bill_reminders,
        });
      }
      setLoading(false);
    };

    load();
  }, [user?.id]);

  // ── Save (upsert) to DB ────────────────────────────────────────────────────
  const save = async () => {
    if (!user?.id) return;
    setSaving(true);

    await supabase
      .from('notification_preferences')
      .upsert({
        user_id:         user.id,
        ...prefs,
        updated_at:      new Date().toISOString(),
      }, { onConflict: 'user_id' });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const update = (key: keyof NotificationPreferences, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  return { prefs, loading, saving, saved, update, save };
}