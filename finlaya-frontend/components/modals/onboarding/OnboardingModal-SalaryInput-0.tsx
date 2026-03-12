'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface DefaultCategory {
  name: string;
  percentage: number;
}

interface SalaryInputProps {
  salary: string;
  onSalaryChange: (val: string) => void;
  defaultCategories: DefaultCategory[];
  onNext: () => void;
  onSkip: () => void;
}

const MIN_SALARY = 1000;

export default function OnboardingModalSalaryInput0({
  salary,
  onSalaryChange,
  onNext,
  onSkip,
}: SalaryInputProps) {
  const [touched, setTouched] = useState(false);

  const salaryNum = parseFloat(salary) || 0;
  const isValid   = salaryNum >= MIN_SALARY;

  const error = touched
    ? salaryNum <= 0
      ? 'Please enter your monthly salary.'
      : salaryNum < MIN_SALARY
      ? `Minimum salary is NRs ${MIN_SALARY.toLocaleString('en-IN')}.`
      : ''
    : '';

  const handleNext = () => {
    setTouched(true);
    if (isValid) onNext();
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <p className="text-sm text-gray-500 leading-relaxed">
        Enter your monthly take-home salary. We'll use this to suggest how to split your budget.
      </p>

      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Monthly Salary
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium select-none">
            NRs
          </span>
          <input
            type="number"
            value={salary}
            onChange={(e) => {
              setTouched(true);
              onSalaryChange(e.target.value);
            }}
            onBlur={() => setTouched(true)}
            placeholder="50,000"
            min={MIN_SALARY}
            autoFocus
            className={`w-full pl-14 pr-4 py-3.5 rounded-xl border-2 outline-none text-gray-900 text-lg font-semibold transition-all placeholder:text-gray-300 placeholder:font-normal ${
              error
                ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                : 'border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
            }`}
          />
        </div>

        {error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500 mt-1.5 font-medium"
          >
            {error}
          </motion.p>
        ) : (
          !touched && (
            <p className="text-xs text-gray-400 mt-1.5">
              Minimum NRs {MIN_SALARY.toLocaleString('en-IN')}
            </p>
          )
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onSkip}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Skip for now
        </button>
        <motion.button
          whileHover={{ scale: isValid ? 1.02 : 1 }}
          whileTap={{ scale: isValid ? 0.98 : 1 }}
          onClick={handleNext}
          className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors ${
            isValid
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}