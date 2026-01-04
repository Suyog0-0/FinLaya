'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function SplashScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      const redirectTimer = setTimeout(() => {
        router.push('/login');
      }, 500);
      return () => clearTimeout(redirectTimer);
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen w-full bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-4"
    >
      <div className="text-center">
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 150, damping: 15 }}
          className="text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent"
        >
          FinLaya
        </motion.h1>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: isLoading ? '100%' : '0%' }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="h-1 mt-6 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto rounded-full overflow-hidden max-w-32"
        />
      </div>
    </motion.div>
  );
}