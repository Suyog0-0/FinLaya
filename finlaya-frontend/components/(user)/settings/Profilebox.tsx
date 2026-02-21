'use client';

import { useState } from 'react';
import { User } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface ProfileBoxProps {
  fullName: string;
  email: string;
  phone?: string;
}

export default function ProfileBox({
  fullName: initialName,
  email,
  phone: initialPhone = '',
}: ProfileBoxProps) {
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Get initials from name or email
  const displayName = fullName || email.split('@')[0] || 'U';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, phone },
    });
    setSaving(false);
    if (error) {
      setMsg('Failed to save. Try again.');
    } else {
      setMsg('Changes saved!');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  return (
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

      {/* Name + Email */}
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
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Phone */}
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
        {msg && (
          <p className={`text-sm font-medium ${msg.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
            {msg}
          </p>
        )}
        <div className="ml-auto">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}