'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

interface FinancialData {
  monthlySalary: number;
  monthlyExpenses: number;
  savings: number;
  totalBalance: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFinancialData(): FinancialData {
  const { user } = useAuth();
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch user salary
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('monthly_salary')
          .eq('user_id', user.id)
          .maybeSingle();

        if (userError || !userData) {
          setError('User not found — please enter your salary');
          setIsLoading(false);
          return;
        }

        const salary = Number(userData.monthly_salary) || 0;
        setMonthlySalary(salary);

        // Get expenses for current month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split('T')[0];
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .split('T')[0];

        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', user.id)
          .gte('expense_date', monthStart)
          .lte('expense_date', monthEnd);

        if (expensesError) {
          setError('Failed to fetch expenses');
          setIsLoading(false);
          return;
        }

        const totalExpenses = (expensesData || []).reduce(
          (sum, e) => sum + Number(e.amount),
          0
        );
        setMonthlyExpenses(totalExpenses);

      } catch {
        setError('Unexpected error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id, trigger]);

  // Correct savings: 20% of salary
  const savings = monthlySalary * 0.2;

  // Correct total balance: salary - expenses + savings
  const totalBalance = monthlySalary - monthlyExpenses + savings;

  return {
    monthlySalary,
    monthlyExpenses,
    savings,
    totalBalance,
    isLoading,
    error,
    refetch: () => setTrigger((t) => t + 1),
  };
}