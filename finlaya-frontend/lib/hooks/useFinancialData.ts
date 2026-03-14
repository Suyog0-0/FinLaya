'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

interface FinancialData {
  monthlySalary:   number; // salary + income entries this month
  monthlyExpenses: number; // expenses recorded this month
  savings:         number; // cumulative bank-style savings across all months
  totalBalance:    number; // this month: income - expenses - EMI
  isLoading:       boolean;
  error:           string | null;
  refetch:         () => void;
}

export function useFinancialData(): FinancialData {
  const { user } = useAuth();

  const [monthlySalary,   setMonthlySalary]   = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [savings,         setSavings]         = useState(0);
  const [totalBalance,    setTotalBalance]    = useState(0);
  const [isLoading,       setIsLoading]       = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [trigger,         setTrigger]         = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const now        = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString().split('T')[0];
        const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString().split('T')[0];

        const [
          { data: userData, error: userError },
          { data: expThisMonth },
          { data: incThisMonth },
          { data: allExpenses },
          { data: allIncome },
          { data: emiData },
        ] = await Promise.all([
          supabase
            .from('users')
            .select('monthly_salary')
            .eq('user_id', user.id)
            .maybeSingle(),

          // Expenses this month only
          supabase
            .from('expenses')
            .select('amount')
            .eq('user_id', user.id)
            .gte('expense_date', monthStart)
            .lte('expense_date', monthEnd),

          // Income table entries this month only
          supabase
            .from('income')
            .select('amount')
            .eq('user_id', user.id)
            .gte('income_date', monthStart)
            .lte('income_date', monthEnd),

          // All expenses ever — for cumulative savings
          supabase
            .from('expenses')
            .select('amount, expense_date')
            .eq('user_id', user.id),

          // All income ever — for cumulative savings
          supabase
            .from('income')
            .select('amount, income_date')
            .eq('user_id', user.id),

          // Active EMIs
          supabase
            .from('emi_payments')
            .select('emi_amount')
            .eq('user_id', user.id)
            .eq('is_active', true),
        ]);

        if (userError || !userData) {
          setError('User not found — please enter your salary');
          setIsLoading(false);
          return;
        }

        const salary          = Number(userData.monthly_salary) || 0;
        const totalMonthlyEMI = (emiData || []).reduce((s, e) => s + Number(e.emi_amount), 0);

        // ── Monthly Income card ──────────────────────────────────────────────
        // Salary + any extra income entries recorded this month
        const incomeThisMonth    = (incThisMonth || []).reduce((s, i) => s + Number(i.amount), 0);
        const totalMonthlyIncome = salary + incomeThisMonth;
        setMonthlySalary(totalMonthlyIncome);

        // ── Monthly Expenses card ────────────────────────────────────────────
        const expensesThisMonth = (expThisMonth || []).reduce((s, e) => s + Number(e.amount), 0);
        setMonthlyExpenses(expensesThisMonth);

        // ── Total Balance ────────────────────────────────────────────────────
        // What's left in your pocket THIS MONTH after all obligations.
        // income this month - expenses this month - monthly EMI obligations.
        // Shown in red if negative (user is in deficit).
        const balance = totalMonthlyIncome - expensesThisMonth - totalMonthlyEMI;
        setTotalBalance(balance);

        // ── Total Savings (cumulative bank-style) ────────────────────────────
        // Answers: "How much have I saved in total since I started using this app?"
        //
        // Method: count distinct calendar months (YYYY-MM) that appear in any
        // expense or income record. Salary is applied once per distinct month.
        // This is accurate regardless of how many transactions exist per month.
        //
        // Formula per month M:
        //   net(M) = salary + sum(income in M) - sum(expenses in M) - totalMonthlyEMI
        //
        // Total Savings = sum of net(M) across all months, clamped to 0.

        // Collect all distinct YYYY-MM keys from expenses and income
        const monthKeys = new Set<string>();

        (allExpenses || []).forEach((e) => {
          if (e.expense_date) monthKeys.add(e.expense_date.slice(0, 7));
        });
        (allIncome || []).forEach((i) => {
          if (i.income_date) monthKeys.add(i.income_date.slice(0, 7));
        });

        // Always include the current month even if no transactions yet
        monthKeys.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

        // Build per-month expense and income maps
        const expByMonth: Record<string, number> = {};
        (allExpenses || []).forEach((e) => {
          const key = e.expense_date?.slice(0, 7);
          if (key) expByMonth[key] = (expByMonth[key] || 0) + Number(e.amount);
        });

        const incByMonth: Record<string, number> = {};
        (allIncome || []).forEach((i) => {
          const key = i.income_date?.slice(0, 7);
          if (key) incByMonth[key] = (incByMonth[key] || 0) + Number(i.amount);
        });

        // Sum net savings across all months
        let cumulativeSavings = 0;
        monthKeys.forEach((key) => {
          const monthIncome   = salary + (incByMonth[key]  || 0);
          const monthExpenses = expByMonth[key] || 0;
          cumulativeSavings  += monthIncome - monthExpenses - totalMonthlyEMI;
        });

        setSavings(Math.max(0, cumulativeSavings));

      } catch {
        setError('Unexpected error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id, trigger]);

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