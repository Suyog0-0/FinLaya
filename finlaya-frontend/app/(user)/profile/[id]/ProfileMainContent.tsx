'use client';

import Image from 'next/image';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-static';
export const revalidate = 60; // rebuild every 60 seconds

export default function ProfileMainContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch avatar from users table
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

  if (loading) return null;
  if (!user) return null;

  const userName = user.user_metadata?.full_name || 'Not provided';
  const userEmail = user.email || 'Not provided';
  const createdAt = user.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Not available';
  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Not available';

  // Initials as fallback
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">View your account information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">

            {/* Show photo if exists, otherwise show initials */}
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Profile"
                width={96}
                height={96}
                className="w-24 h-24 rounded-full object-cover border-4 border-orange-200 mb-4"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-3xl mb-4">
                {userInitials}
              </div>
            )}

            <h2 className="text-2xl font-bold text-gray-900">{userName}</h2>
            <p className="text-gray-500 mt-1">{userEmail}</p>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                    <p className="text-gray-900 mt-1">{userName}</p>
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email Address</p>
                    <p className="text-gray-900 mt-1">{userEmail}</p>
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Account Created</p>
                    <p className="text-gray-900 mt-1">{createdAt}</p>
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Sign In</p>
                    <p className="text-gray-900 mt-1">{lastSignIn}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Dashboard Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}