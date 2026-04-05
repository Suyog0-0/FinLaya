'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import ProfileBox from '@/components/(user)/settings/Profilebox';
import NotificationsBox from '@/components/(user)/settings/Notificationsbox';
import SecurityBox from '@/components/(user)/settings/Securitybox';
import DeleteAccountBox from '@/components/(user)/settings/Deleteaccountbox';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { Palette } from 'lucide-react';

export const dynamic = 'force-static';
export const revalidate = 60;

export default function SettingsMainContent() {
  const { user } = useAuth();

  const fullName = user?.user_metadata?.full_name || '';
  const email = user?.email || '';
  const phone = user?.user_metadata?.phone || '';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0f1117] py-8 px-4 transition-colors">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage your account and preferences
          </p>
        </div>

        {/* Profile box */}
        <ProfileBox fullName={fullName} email={email} phone={phone} />

        {/* Appearance box */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
              <Palette size={18} className="text-orange-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Appearance</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Choose your preferred theme</p>
            </div>
          </div>

          {/* Theme toggle row */}
          <ThemeToggle variant="row" />
        </div>

        {/* Notifications box */}
        <NotificationsBox />

        {/* Security box */}
        <SecurityBox />

        {/* Delete account box */}
        <DeleteAccountBox />

      </div>
    </div>
  );
}