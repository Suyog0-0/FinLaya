'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { User, Mail, Phone, Camera, X, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

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
  const { user } = useAuth();
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Avatar states
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing avatar when component loads
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    };
    fetchAvatar();
  }, [user?.id]);

  // Get initials as fallback
  const displayName = fullName || email.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // When user picks a file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarMsg('Please select an image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarMsg('Image must be smaller than 2MB.');
      return;
    }

    setSelectedFile(file);
    setAvatarMsg('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // When user clicks Save Photo
  const handleAvatarSave = async () => {
    if (!selectedFile || !user?.id) return;

    setUploadingAvatar(true);
    setAvatarMsg('');

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedFile, { upsert: true });

      if (uploadError) {
        setAvatarMsg('Failed to upload image. Try again.');
        setUploadingAvatar(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      const { error: dbError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (dbError) {
        setAvatarMsg('Failed to save photo. Try again.');
        setUploadingAvatar(false);
        return;
      }

      setAvatarUrl(publicUrl);
      setAvatarPreview(null);
      setSelectedFile(null);
      setAvatarMsg('Profile photo updated!');
      setTimeout(() => setAvatarMsg(''), 3000);

    } catch {
      setAvatarMsg('Something went wrong. Try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Cancel preview
  const handleCancelPreview = () => {
    setAvatarPreview(null);
    setSelectedFile(null);
    setAvatarMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save profile info (name, phone)
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

  const displayImage = avatarPreview || avatarUrl;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
        {/* FIXED: icon bg + color for dark mode */}
        <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
          <User size={18} className="text-orange-500" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">Profile Settings</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Update your personal information</p>
        </div>
      </div>

      {/* Avatar section */}
      <div className="flex items-center gap-5 mb-7 pb-6 border-b border-gray-100 dark:border-gray-700">
        {/* Avatar display */}
        <div className="relative group">
          {displayImage ? (
            <div className="relative">
              <Image
                src={displayImage}
                alt="Profile"
                width={72}
                height={72}
                className="rounded-full object-cover border-2 border-orange-200"
              />
              {/* Hover overlay for desktop */}
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera size={20} className="text-white" />
              </label>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {initials}
            </div>
          )}

          {/* Preview badge */}
          {avatarPreview && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-sm">
              New
            </span>
          )}

          {/* Hidden file input */}
          <input
            id="avatar-upload"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Upload controls */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Profile Photo</p>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 transition-all font-medium"
            >
              <Camera size={14} />
              Change
            </button>

            {selectedFile && (
              <>
                <button
                  onClick={handleAvatarSave}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Save
                </button>
                <button
                  onClick={handleCancelPreview}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 transition-colors"
                >
                  <X size={14} />
                  Cancel
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">JPG, PNG or GIF. Max 2MB.</p>

          {/* Avatar message */}
          {avatarMsg && (
            <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${
              avatarMsg.includes('updated') ? 'text-green-600' : 'text-red-500'
            }`}>
              {avatarMsg.includes('updated') ? <Check size={12} /> : <X size={12} />}
              {avatarMsg}
            </p>
          )}
        </div>
      </div>

      {/* Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          {/* FIXED: label icons use explicit colors so they don't go white in dark */}
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            <User size={14} className="text-gray-400 dark:text-gray-500" />
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 focus:bg-white dark:focus:bg-gray-700 bg-gray-50 dark:bg-gray-700/50 transition-all"
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            <Mail size={14} className="text-gray-400 dark:text-gray-500" />
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/30 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Phone */}
      <div className="mb-6">
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          <Phone size={14} className="text-gray-400 dark:text-gray-500" />
          Phone Number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+977 98XXXXXXXX"
          className="w-full sm:w-80 px-3.5 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 focus:bg-white dark:focus:bg-gray-700 bg-gray-50 dark:bg-gray-700/50 transition-all"
        />
      </div>

      {/* Save button + message */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
        {msg && (
          <p className={`text-sm font-medium flex items-center gap-1.5 ${
            msg.includes('Failed') ? 'text-red-500' : 'text-green-600 dark:text-green-400'
          }`}>
            {msg.includes('Failed') ? <X size={14} /> : <Check size={14} />}
            {msg}
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="sm:ml-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-600 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Check size={14} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}