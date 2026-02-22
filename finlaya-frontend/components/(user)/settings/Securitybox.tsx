'use client';

import { useState } from 'react';
import { Shield, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-orange-500' : 'bg-gray-300'}`}>
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function SecurityBox() {
  const [showForm, setShowForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: '', color: '' };
    if (pass.length < 6) return { label: 'Weak', color: 'text-red-500' };
    if (pass.length < 10) return { label: 'Medium', color: 'text-amber-500' };
    return { label: 'Strong', color: 'text-green-500' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleChangePassword = async () => {
    setMsg('');
    if (!newPassword || newPassword !== confirmPassword) { setMsg('Passwords do not match.'); return; }
    if (newPassword.length < 6) { setMsg('Password must be at least 6 characters.'); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) { setMsg('Failed to update password. Try again.'); }
    else {
      setMsg('Password updated successfully!');
      setNewPassword(''); setConfirmPassword('');
      setTimeout(() => { setMsg(''); setShowForm(false); }, 2000);
    }
  };

  const handleCancel = () => { setShowForm(false); setMsg(''); setNewPassword(''); setConfirmPassword(''); };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
          <Shield size={18} className="text-orange-500" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">Security</p>
          <p className="text-xs text-gray-400 mt-0.5">Manage your account security</p>
        </div>
      </div>

      {/* Change Password Button */}
      <button onClick={() => { setShowForm(v => !v); setMsg(''); }} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all font-medium">
        <Shield size={14} />
        Change Password
      </button>
      <p className="text-xs text-gray-400 mt-2">Last changed: 30 days ago</p>

      {/* Password Form */}
      {showForm && (
        <div className="mt-5 space-y-4 p-4 bg-gray-50 rounded-xl">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <div className="relative w-full sm:w-80">
              <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 pr-10" />
              <button type="button" onClick={() => setShowNewPassword(v => !v)} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">{showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
            {newPassword && <p className={`text-xs mt-1 font-medium ${strength.color}`}>• {strength.label}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
            <div className="relative w-full sm:w-80">
              <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 pr-10" />
              <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
            {confirmPassword && newPassword === confirmPassword && <p className="text-xs mt-1 text-green-600 font-medium">✓ Passwords match</p>}
          </div>

          {/* Message */}
          {msg && (
            <p className={`text-sm font-medium flex items-center gap-1.5 ${msg.includes('successfully') ? 'text-green-600' : 'text-red-500'}`}>
              {msg.includes('successfully') ? <Check size={14} /> : msg.includes('match') || msg.includes('characters') ? <AlertCircle size={14} /> : <X size={14} />}
              {msg}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button onClick={handleChangePassword} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50">
              {saving ? <span className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" /> : <Check size={14} />}
              {saving ? 'Updating…' : 'Update'}
            </button>
            <button onClick={handleCancel} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}