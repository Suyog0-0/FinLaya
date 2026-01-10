'use client';

import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface RegisterFormProps {
  formData: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
  error: string;
  success: string;
  isLoading: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  togglePasswordVisibility: () => void;
  toggleConfirmPasswordVisibility: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export default function RegisterForm({
  formData,
  error,
  success,
  isLoading,
  showPassword,
  showConfirmPassword,
  handleChange,
  togglePasswordVisibility,
  toggleConfirmPasswordVisibility,
  handleSubmit
}: RegisterFormProps) {
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Full Name
        </label>
        <motion.input
          whileFocus={{ scale: 1.01 }}
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 placeholder-gray-400 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
          placeholder="John Doe"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <motion.input
          whileFocus={{ scale: 1.01 }}
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
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
            name="password"
            value={formData.password}
            onChange={handleChange}
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

      <div className="relative">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <motion.input
            whileFocus={{ scale: 1.01 }}
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 placeholder-gray-400 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all pr-12"
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={toggleConfirmPasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            {showConfirmPassword ? <FaEye size={20} /> : <FaEyeSlash size={20} />}
          </button>
        </div>
      </div>

      <div className="flex items-start">
        <input
          type="checkbox"
          id="terms"
          required
          className="mt-1 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
        />
        <label htmlFor="terms" className="ml-2 text-sm text-gray-600 cursor-pointer">
          I agree to the <span className="text-orange-600 font-semibold cursor-pointer">Terms and Conditions</span> and{' '}
          <span className="text-orange-600 font-semibold cursor-pointer">Privacy Policy</span>
        </label>
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
          'Create Account'
        )}
      </motion.button>
    </form>
  );
}