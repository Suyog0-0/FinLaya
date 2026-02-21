'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
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
  useState(() => {
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
  });

  // Get initials as fallback
  const displayName = fullName || email.split('@')[0] || 'U';
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setAvatarMsg('Please select an image file.');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setAvatarMsg('Image must be smaller than 2MB.');
      return;
    }

    // Show preview
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
      // Create a unique file path: userId/avatar.jpg
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedFile, { upsert: true }); // upsert: true = overwrite if exists

      if (uploadError) {
        setAvatarMsg('Failed to upload image. Try again.');
        setUploadingAvatar(false);
        return;
      }

      // Get the public URL of the uploaded image
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Save the URL to the users table
      const { error: dbError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (dbError) {
        setAvatarMsg('Failed to save photo. Try again.');
        setUploadingAvatar(false);
        return;
      }

      // Update UI
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

  // Which image to show: preview > saved avatar > initials
  const displayImage = avatarPreview || avatarUrl;

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

      {/* Avatar section */}
      <div className="flex items-center gap-4 mb-6">
        {/* Avatar display */}
        <div className="relative">
          {displayImage ? (
            <Image
              src={displayImage}
              alt="Profile"
              width={64}
              height={64}
              className="rounded-full object-cover border-2 border-orange-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-xl">
              {initials}
            </div>
          )}

          {/* Preview badge */}
          {avatarPreview && (
            <span className="absolute -bottom-1 -right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              Preview
            </span>
          )}
        </div>

        {/* Upload controls */}
        <div>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex items-center gap-2 flex-wrap">
            {/* Change Photo button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Change Photo
            </button>

            {/* Save Photo button - only shows after picking a file */}
            {selectedFile && (
              <>
                <button
                  onClick={handleAvatarSave}
                  disabled={uploadingAvatar}
                  className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all disabled:opacity-50"
                >
                  {uploadingAvatar ? 'Saving...' : 'Save Photo'}
                </button>
                <button
                  onClick={handleCancelPreview}
                  className="px-4 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-1">JPG, PNG or GIF. Max 2MB.</p>

          {/* Avatar message */}
          {avatarMsg && (
            <p className={`text-xs mt-1 font-medium ${avatarMsg.includes('updated') ? 'text-green-600' : 'text-red-500'}`}>
              {avatarMsg}
            </p>
          )}
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