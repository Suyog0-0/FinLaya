'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
// import { motion } from 'framer-motion';

export default function HomeMainContent() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-4">Welcome to FinLaya</h1>
      <p className="text-lg text-gray-600">Your financial journey starts here.</p>
    </div>
  )




}