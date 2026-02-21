'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';

// Simple reusable toggle switch
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-orange-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
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
    {
      label: 'Budget Alerts',
      desc: 'Get notified when approaching budget limits',
      value: budgetAlerts,
      set: setBudgetAlerts,
    },
    {
      label: 'Weekly Reports',
      desc: 'Receive weekly spending summaries',
      value: weeklyReports,
      set: setWeeklyReports,
    },
    {
      label: 'Monthly Reports',
      desc: 'Get detailed monthly financial reports',
      value: monthlyReports,
      set: setMonthlyReports,
    },
    {
      label: 'Bill Reminders',
      desc: 'Remind me about upcoming bills and payments',
      value: billReminders,
      set: setBillReminders,
    },
  ];

  const handleSave = () => {
    // UI only — notifications feature not yet built
    setMsg('Preferences saved!');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
          <Bell size={16} className="text-orange-500" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">Notifications</p>
          <p className="text-xs text-gray-400">Configure how you receive alerts</p>
        </div>
      </div>

      <div className="space-y-5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
            </div>
            <Toggle checked={item.value} onChange={item.set} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-6">
        {msg && <p className="text-sm font-medium text-green-600">{msg}</p>}
        <div className="ml-auto">
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}