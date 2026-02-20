'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import SalarySetupModal from '@/components/modals/SalarySetupModal';
import StatsCard from '@/components/(user)/shared/StatsCard';
import SpendingTrendChart from '@/components/(user)/dashboard/SpendingTrendChart';
import CategoryBreakdownChart from '@/components/(user)/dashboard/CategoryBreakdownChart';
import BudgetStatus from '@/components/(user)/dashboard/BudgetStatus';
import RecentTransactions from '@/components/(user)/dashboard/RecentTransactions';
import { supabase } from '@/lib/supabase/client';
import { useFinancialData } from '@/lib/hooks/useFinancialData';

export default function DashboardMainContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  const { monthlySalary, monthlyExpenses, savings, totalBalance, isLoading, refetch } =
    useFinancialData();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const checkUserSetup = async () => {
      if (!user?.email) return;

      try {
        const { data: userData } = await supabase
          .from('users')
          .select('monthly_salary')
          .eq('user_id', user.id)
          .single();

        // Show modal if user exists but salary not set
        if (!userData || !userData.monthly_salary || Number(userData.monthly_salary) === 0) {
          setShowSalaryModal(true);
        }
      } catch {
        setShowSalaryModal(true);
      } finally {
        setIsCheckingSetup(false);
      }
    };

    if (user) {
      checkUserSetup();
    }
  }, [user]);


  const handleSalarySubmit = async (salary: number) => {
    if (!user?.email) return;

    try {
      const categories = [
        { name: 'Housing', percentage: 30, budget: salary * 0.3 },
        { name: 'Food', percentage: 15, budget: salary * 0.15 },
        { name: 'Transportation', percentage: 10, budget: salary * 0.1 },
        { name: 'Utilities', percentage: 8, budget: salary * 0.08 },
        { name: 'Health', percentage: 7, budget: salary * 0.07 },
        { name: 'Entertainment', percentage: 5, budget: salary * 0.05 },
        { name: 'Savings', percentage: 20, budget: salary * 0.2 },
        { name: 'Others', percentage: 5, budget: salary * 0.05 },
      ];

      const { error } = await supabase
        .from('users')
        .update({
          monthly_salary: salary,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (error) {
        console.error('Salary update error:', error);
        return;
      }

      localStorage.setItem('default_categories', JSON.stringify(categories));
      setShowSalaryModal(false);
      refetch();
    } catch (err) {
      console.error('Error setting up salary:', err);
    }
  };





  if (loading || isCheckingSetup) return null;
  if (!user) return null;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here&apos;s your financial overview.</p>
            </div>

            <button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
              <span className="text-xl">+</span>
              Add Expense
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              statId="balance"
              totalBalance={totalBalance}
              isLoading={isLoading}
            />
            <StatsCard
              statId="income"
              monthlySalary={monthlySalary}
              isLoading={isLoading}
            />
            <StatsCard
              statId="expenses"
              monthlyExpenses={monthlyExpenses}
              isLoading={isLoading}
            />
            <StatsCard
              statId="savings"
              savings={savings}
              isLoading={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <SpendingTrendChart />
            <CategoryBreakdownChart />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BudgetStatus />
            <RecentTransactions />
          </div>
        </div>
      </div>

      <SalarySetupModal
        isOpen={showSalaryModal}
        onClose={() => setShowSalaryModal(false)}
        onSubmit={handleSalarySubmit}
      />
    </>
  );
}