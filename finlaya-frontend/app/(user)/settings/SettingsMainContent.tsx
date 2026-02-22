'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import ProfileBox from '@/components/(user)/settings/Profilebox';
import NotificationsBox from '@/components/(user)/settings/Notificationsbox';
import SecurityBox from '@/components/(user)/settings/Securitybox';
import DeleteAccountBox from '@/components/(user)/settings/Deleteaccountbox';

export const dynamic = 'force-static';
export const revalidate = 60; // rebuild every 60 seconds

export default function SettingsMainContent() {
  const { user } = useAuth();

  const fullName = user?.user_metadata?.full_name || '';
  const email = user?.email || '';
  const phone = user?.user_metadata?.phone || '';

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

        {/* Each section is its own self-contained component */}
        <ProfileBox fullName={fullName} email={email} phone={phone} />
        <NotificationsBox />
        <SecurityBox />
        <DeleteAccountBox />

      </div>
    </div>
  );
}