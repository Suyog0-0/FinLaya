'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa';

export default function LoginBox() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <motion.input
            whileFocus={{ scale: 1.01 }}
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 placeholder-gray-400 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            placeholder="example@gmail.com"
            required
          />
        </div>

        <div className="relative">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 placeholder-gray-400 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all pr-12"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer" />
            <span className="ml-2 text-sm text-gray-600 cursor-pointer">Remember me</span>
          </label>
          <Link href="/forgot-password" className="text-sm text-orange-600 font-semibold hover:text-orange-700">
            Forgot password?
          </Link>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto"
            />
          ) : (
            'Sign In'
          )}
        </motion.button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center px-4 py-2 border border-red-200 rounded-lg text-red-600 font-semibold bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
        >
          <FaGoogle className="mr-2" />
          Google
        </motion.button>
      </div>

      <p className="text-center mt-6 text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-orange-600 font-semibold hover:text-orange-700">
          Sign up
        </Link>
      </p>
    </motion.div>
  );
}