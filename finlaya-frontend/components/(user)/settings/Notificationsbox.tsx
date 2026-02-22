'use client';

import { useState } from 'react';
import { Bell, AlertTriangle, FileText, Calendar, CreditCard } from 'lucide-react';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-orange-500' : 'bg-gray-300'
      }`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function NotificationsBox() {
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [monthlyReports, setMonthlyReports] = useState(false);
  const [billReminders, setBillReminders] = useState(true);
  const [msg, setMsg] = useState('');

  const items = [
    { label: 'Budget Alerts', desc: 'Get notified when approaching budget limits', value: budgetAlerts, set: setBudgetAlerts, icon: AlertTriangle },
    { label: 'Weekly Reports', desc: 'Receive weekly spending summaries', value: weeklyReports, set: setWeeklyReports, icon: FileText },
    { label: 'Monthly Reports', desc: 'Get detailed monthly financial reports', value: monthlyReports, set: setMonthlyReports, icon: Calendar },
    { label: 'Bill Reminders', desc: 'Remind me about upcoming bills and payments', value: billReminders, set: setBillReminders, icon: CreditCard },
  ];

  const handleSave = () => {
    setMsg('Preferences saved!');
    setTimeout(() => setMsg(''), 3000);
  };

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

      {/* Toggle Items */}
      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Icon size={14} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </div>
              <Toggle checked={item.value} onChange={item.set} />
            </div>
          );
        })}
      </div>

      {/* Save + Message */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        {msg && <p className="text-sm font-medium text-green-600">✓ {msg}</p>}
        <button onClick={handleSave} className="ml-auto inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg">
          Save Preferences
        </button>
      </div>
    </div>
  );
}