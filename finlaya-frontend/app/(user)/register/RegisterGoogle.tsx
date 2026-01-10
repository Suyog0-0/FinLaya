'use client';

import { motion } from 'framer-motion';
import { FaGoogle } from 'react-icons/fa';
import { useAuth } from '@/lib/contexts/AuthContext';

interface RegisterGoogleProps {
  setError: (error: string) => void;
}

export default function RegisterGoogle({ setError }: RegisterGoogleProps) {
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignUp = async () => {
    setError('');
    const { error: googleError } = await signInWithGoogle();
    
    if (googleError) {
      setError(googleError.message);
    }
    // Note: Redirect happens automatically via Supabase
  };

  return (
    <div className="flex justify-center">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleGoogleSignUp}
        className="flex items-center justify-center px-6 py-2 border border-red-200 rounded-lg text-red-600 font-semibold bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
      >
        <FaGoogle className="mr-2" />
        Google
      </motion.button>
    </div>
  );
}