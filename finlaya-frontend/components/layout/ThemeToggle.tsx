'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/contexts/ThemeContext';

interface ThemeToggleProps {
  /** 'icon' = compact button for navbar, 'row' = full row for settings */
  variant?: 'icon' | 'row';
}

export default function ThemeToggle({ variant = 'icon' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'row') {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            {isDark ? (
              <Moon size={14} className="text-gray-500 dark:text-gray-300" />
            ) : (
              <Sun size={14} className="text-gray-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            </p>
          </div>
        </div>
        {/* Toggle pill */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isDark ? 'bg-orange-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              isDark ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    );
  }

  // icon variant — compact for navbar
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}