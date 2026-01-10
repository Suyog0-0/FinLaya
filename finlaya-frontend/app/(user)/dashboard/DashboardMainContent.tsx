'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function DashboardMainContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">Welcome to FinLaya</h1>
        <p className="text-lg text-gray-700">Your financial journey starts here.</p>
      </div>
    </div>
  );
}