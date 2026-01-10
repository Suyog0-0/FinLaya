'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only redirect after splash is gone and auth is loaded
    if (!showSplash && !loading) {
      if (!user) {
        // User doesn't have account/signed in -> go to login
        router.push('/login');
      } else {
        // User exists -> go to /dashboard
        router.push('/dashboard');
      }
    }
  }, [showSplash, user, loading, router]);

  if (showSplash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <h1 className="text-4xl font-bold text-amber-600 animate-pulse">FinLaya</h1>
      </div>
    );
  }

  // Show loading state while auth is initializing
  if (loading) {
    return null; // or a loading spinner
  }

  // No in-place homepage content rendering since logged-in users are redirected to /home
  return null;
}