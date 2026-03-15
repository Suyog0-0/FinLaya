'use client';

import { Bell, AlertTriangle, FileText, Calendar, CreditCard } from 'lucide-react';
import { useNotificationPreferences } from '@/lib/hooks/useNotificationPreferences';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-orange-500' : 'bg-gray-300'
      }`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );
}

export default function NotificationsBox() {
  const { prefs, loading, saving, saved, update, save } = useNotificationPreferences();

  const items = [
    {
      key:   'budget_alerts' as const,
      label: 'Budget Alerts',
      desc:  'Get notified when spending reaches 90% of a budget',
      icon:  AlertTriangle,
    },
    {
      key:   'weekly_reports' as const,
      label: 'Weekly Reports',
      desc:  'Receive weekly spending summaries (email — coming soon)',
      icon:  FileText,
    },
    {
      key:   'monthly_reports' as const,
      label: 'Monthly Reports',
      desc:  'Get detailed monthly financial reports (email — coming soon)',
      icon:  Calendar,
    },
    {
      key:   'bill_reminders' as const,
      label: 'Bill Reminders',
      desc:  'In-app reminders 3 days and 1 day before EMI due dates',
      icon:  CreditCard,
    },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="h-5 w-40 bg-gray-100 rounded mb-4" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-50 rounded-xl mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
          <Bell size={18} className="text-orange-500" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">Notifications</p>
          <p className="text-xs text-gray-400 mt-0.5">Configure how you receive alerts</p>
        </div>
      </div>

      {/* Toggle items */}
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Icon size={14} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </div>
              <Toggle
                checked={prefs[item.key]}
                onChange={(v) => update(item.key, v)}
              />
            </div>
          );
        })}
      </div>

      {/* Save */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        {saved && (
          <p className="text-sm font-medium text-green-600">✓ Preferences saved!</p>
        )}
        <button
          onClick={save}
          disabled={saving}
          className="ml-auto inline-flex items-center gap-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}