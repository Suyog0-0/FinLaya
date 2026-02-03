'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import SalarySetupModal from '@/components/modals/SalarySetupModal';
import StatsCard from '@/components/(user)/dashboard/StatsCard';
import SpendingTrendChart from '@/components/(user)/dashboard/SpendingTrendChart';
import CategoryBreakdownChart from '@/components/(user)/dashboard/CategoryBreakdownChart';
import BudgetStatus from '@/components/(user)/dashboard/BudgetStatus';
import RecentTransactions from '@/components/(user)/dashboard/RecentTransactions';
import { supabase } from '@/lib/supabase/client';
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';

export default function DashboardMainContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Check if user has completed salary setup
  useEffect(() => {
    const checkUserSetup = async () => {
      if (!user) return;

      try {
        const hasCompletedSetup = user.user_metadata?.salary_setup_complete;
        
        if (!hasCompletedSetup) {
          setShowSalaryModal(true);
        }
      } catch (error) {
        console.error('Error checking user setup:', error);
      } finally {
        setIsCheckingSetup(false);
      }
    };

    if (user) {
      checkUserSetup();
    }
  }, [user]);

  const handleSalarySubmit = async (salary: number) => {
    if (!user) return;

    try {
      const categories = [
        { name: 'Housing', percentage: 30, budget: salary * 0.30 },
        { name: 'Food', percentage: 15, budget: salary * 0.15 },
        { name: 'Transportation', percentage: 10, budget: salary * 0.10 },
        { name: 'Utilities', percentage: 8, budget: salary * 0.08 },
        { name: 'Health', percentage: 7, budget: salary * 0.07 },
        { name: 'Entertainment', percentage: 5, budget: salary * 0.05 },
        { name: 'Savings', percentage: 20, budget: salary * 0.20 },
        { name: 'Others', percentage: 5, budget: salary * 0.05 },
      ];

      await supabase.auth.updateUser({
        data: {
          salary_setup_complete: true,
          monthly_salary: salary,
          setup_date: new Date().toISOString(),
        }
      });

      localStorage.setItem('default_categories', JSON.stringify(categories));
      localStorage.setItem('monthly_salary', salary.toString());

      setShowSalaryModal(false);
    } catch (error) {
      console.error('Error setting up salary:', error);
    }
  };

  if (loading || isCheckingSetup) return null;
  if (!user) return null;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Balance"
              amount="NRs 2,400"
              percentage="+12%"
              isPositive={true}
              icon={Wallet}
              iconBg="bg-amber-50"
            />
            <StatsCard
              title="Monthly Income"
              amount="NRs 1,000"
              percentage="+5%"
              isPositive={true}
              icon={TrendingUp}
              iconBg="bg-green-50"
            />
            <StatsCard
              title="Monthly Expenses"
              amount="NRs 740"
              percentage="-8%"
              isPositive={false}
              icon={TrendingDown}
              iconBg="bg-red-50"
            />
            <StatsCard
              title="Savings"
              amount="NRs 260"
              percentage="+24%"
              isPositive={true}
              icon={PiggyBank}
              iconBg="bg-blue-50"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <SpendingTrendChart />
            <CategoryBreakdownChart />
          </div>

          {/* Budget and Transactions Row */}
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