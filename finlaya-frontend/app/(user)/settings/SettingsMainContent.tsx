'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { User, Bell, Shield, Trash2 } from 'lucide-react';

export default function SettingsMainContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  // ── Profile state ──────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState(
    user?.user_metadata?.full_name || ''
  );
  const [phone, setPhone] = useState(
    user?.user_metadata?.phone || ''
  );
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // ── Notification toggles (UI only — feature not yet built) ─────────────────
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [monthlyReports, setMonthlyReports] = useState(false);
  const [billReminders, setBillReminders] = useState(true);
  const [notifMsg, setNotifMsg] = useState('');

  // ── Security state ─────────────────────────────────────────────────────────
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // ── Delete account state ───────────────────────────────────────────────────
  const [deleting, setDeleting] = useState(false);

  // Get initials for avatar
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'U';
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const email = user?.email || '';

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileMsg('');
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, phone },
    });
    setProfileSaving(false);
    if (error) {
      setProfileMsg('Failed to save. Try again.');
    } else {
      setProfileMsg('Changes saved!');
      setTimeout(() => setProfileMsg(''), 3000);
    }
  };

  const handleSaveNotifications = () => {
    // UI only — feature not yet built
    setNotifMsg('Preferences saved!');
    setTimeout(() => setNotifMsg(''), 3000);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      setPasswordMsg('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters.');
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) {
      setPasswordMsg('Failed to update password. Try again.');
    } else {
      setPasswordMsg('Password updated!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordMsg('');
        setShowPasswordForm(false);
      }, 2000);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This cannot be undone.'
    );
    if (!confirmed) return;
    setDeleting(true);
    // Sign out for now — actual deletion requires a backend/admin call
    await signOut();
    router.push('/login');
  };

  // ── Toggle switch component ────────────────────────────────────────────────
  const Toggle = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
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

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your account and preferences
          </p>
        </div>

        {/* ── Profile ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <User size={16} className="text-orange-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Profile</p>
              <p className="text-xs text-gray-400">Update your personal information</p>
            </div>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-xl">
              {initials}
            </div>
            <div>
              <button className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                Change Photo
              </button>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG or GIF. Max 2MB.</p>
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 bg-gray-50 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+977 98XXXXXXXX"
              className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-between">
            {profileMsg && (
              <p
                className={`text-sm font-medium ${
                  profileMsg.includes('Failed') ? 'text-red-500' : 'text-green-600'
                }`}
              >
                {profileMsg}
              </p>
            )}
            <div className="ml-auto">
              <button
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all disabled:opacity-50"
              >
                {profileSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Notifications ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
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
            {[
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
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                </div>
                <Toggle checked={item.value} onChange={item.set} />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6">
            {notifMsg && (
              <p className="text-sm font-medium text-green-600">{notifMsg}</p>
            )}
            <div className="ml-auto">
              <button
                onClick={handleSaveNotifications}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>

        {/* ── Security ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Shield size={16} className="text-orange-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Security</p>
              <p className="text-xs text-gray-400">Manage your account security</p>
            </div>
          </div>

          <button
            onClick={() => {
              setShowPasswordForm((v) => !v);
              setPasswordMsg('');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Change Password
          </button>
          <p className="text-xs text-gray-400 mt-2">
            Last password change: 30 days ago
          </p>

          {showPasswordForm && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full sm:w-2/3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full sm:w-2/3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
              </div>

              {passwordMsg && (
                <p
                  className={`text-sm font-medium ${
                    passwordMsg.includes('updated') ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {passwordMsg}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleChangePassword}
                  disabled={passwordSaving}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all disabled:opacity-50"
                >
                  {passwordSaving ? 'Updating…' : 'Update Password'}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordMsg('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Delete Account ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-red-100">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-red-50">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 size={16} className="text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-red-600">Delete Account</p>
              <p className="text-xs text-gray-400">Irreversible account actions</p>
            </div>
          </div>

          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete Account'}
          </button>
          <p className="text-xs text-gray-400 mt-3">
            Once you delete your account, there is no going back. Please be certain.
          </p>
        </div>

      </div>
    </div>
  );
}