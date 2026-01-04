'use client'

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function forgotPasswordMainContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 px-4 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* FinLaya Brand */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-8"
        >
          <motion.h1
            initial={{ letterSpacing: '-0.05em', opacity: 0 }}
            animate={{ letterSpacing: '0em', opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
            className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent"
          >
            FinLaya
          </motion.h1>
          <p className="text-gray-600 mt-2">Reset your password</p>
        </motion.div>

        {/* Forgot Password Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
        >
          <p className="text-gray-600 mb-6 text-center">
            Enter your email to receive a password reset link.
          </p>
          <input
            type="email"
            placeholder="example@gmail.com"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 placeholder-gray-400 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all mb-4"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
          >
            Send Reset Link
          </motion.button>
          <p className="text-sm text-gray-500 mt-4 text-center">
            Remembered your password?{' '}
            <Link href="/login" className="text-orange-600 font-semibold hover:text-orange-700">
              Sign In
            </Link>
          </p>
        </motion.div>

        {/* Floating Elements */}
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-20 right-10 w-20 h-20 bg-amber-400 rounded-full opacity-20 blur-xl"
        />
        <motion.div
          animate={{
            y: [0, 10, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-20 left-10 w-32 h-32 bg-orange-400 rounded-full opacity-20 blur-xl"
        />
      </motion.div>
    </div>
  );
}