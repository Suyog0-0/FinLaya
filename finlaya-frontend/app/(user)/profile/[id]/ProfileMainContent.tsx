'use client';

import Image from 'next/image';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User, Mail, Calendar, LogIn, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-static';
export const revalidate = 60;

export default function ProfileMainContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    };
    fetchAvatar();
  }, [user?.id]);

  if (loading || !user) return null;

  const userName   = user.user_metadata?.full_name || 'Not provided';
  const userEmail  = user.email || 'Not provided';
  const createdAt  = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Not available';
  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Not available';

  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const details = [
    { icon: User,     label: 'Full Name',    value: userName   },
    { icon: Mail,     label: 'Email',        value: userEmail  },
    { icon: Calendar, label: 'Joined',       value: createdAt  },
    { icon: LogIn,    label: 'Last Sign In', value: lastSignIn },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] py-10 px-4 transition-colors">
      <div className="max-w-2xl mx-auto">

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 transition-colors">

          {/* Avatar + Name */}
          <div className="flex flex-col items-center text-center mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
            {avatarUrl ? (
              <Image
                src={avatarUrl} alt="Profile"
                width={80} height={80}
                className="w-20 h-20 rounded-full object-cover border-3 border-orange-200 mb-3"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-2xl mb-3 shadow-md">
                {userInitials}
              </div>
            )}
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{userName}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{userEmail}</p>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 py-2">
                <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-gray-500 dark:text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{label}</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Back Button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}