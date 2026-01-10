'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  error: string;
  isLoading: boolean;
  showPassword: boolean;
  togglePasswordVisibility: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export default function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  error,
  isLoading,
  showPassword,
  togglePasswordVisibility,
  handleSubmit
}: LoginFormProps) {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

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
            {showPassword ? <FaEye size={20} /> : <FaEyeSlash size={20} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer" />
          <span className="ml-2 text-sm text-gray-600 cursor-pointer">Remember me</span>
        </label>
        <Link href="/forgotPassword" className="text-sm text-orange-600 font-semibold hover:text-orange-700">
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
  );
}