'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import OnboardingModal from '@/components/modals/onboarding/OnboardingModal';
import StatsCard from '@/components/(user)/shared/StatsCard';
import SpendingTrendChart from '@/components/(user)/dashboard/SpendingTrendChart';
import CategoryBreakdownChart from '@/components/(user)/dashboard/CategoryBreakdownChart';
import BudgetStatus from '@/components/(user)/dashboard/BudgetStatus';
import RecentTransactions from '@/components/(user)/dashboard/RecentTransactions';
import { supabase } from '@/lib/supabase/client';
import { useFinancialData } from '@/lib/hooks/useFinancialData';

const SESSION_KEY = 'finlaya_setup_dismissed';

export const dynamic = 'force-static';
export const revalidate = 60; // rebuild every 60 seconds

export default function DashboardMainContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);

  const { monthlySalary, monthlyExpenses, savings, totalBalance, isLoading, refetch } =
    useFinancialData();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const checkSetup = async () => {
      if (!user?.id) return;

      if (sessionStorage.getItem(SESSION_KEY) === 'true') {
        setIsCheckingSetup(false);
        return;
      }

      try {
        const { data: cats } = await supabase
          .from('budget_categories')
          .select('category_id')
          .eq('user_id', user.id)
          .limit(1);

        const hasCategories = (cats ?? []).length > 0;

        const { data: userData } = await supabase
          .from('users')
          .select('monthly_salary')
          .eq('user_id', user.id)
          .single();

        const hasSalary = userData?.monthly_salary && Number(userData.monthly_salary) > 0;

        if (!hasCategories || !hasSalary) {
          setShowOnboarding(true);
        }
      } catch {
        setShowOnboarding(true);
      } finally {
        setIsCheckingSetup(false);
      }
    };

    if (user) {
      checkSetup();
    }
  }, [user]);

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setShowOnboarding(false);
  };

  const handleComplete = () => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setShowOnboarding(false);
    refetch();
    setDataVersion((v) => v + 1);
  };

  if (loading || isCheckingSetup) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="h-8 w-48 bg-gray-200 rounded mb-3" />
              <div className="h-4 w-72 bg-gray-200 rounded" />
            </div>
            <div className="h-12 w-36 bg-gray-200 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="h-72 bg-gray-200 rounded-xl" />
            <div className="h-72 bg-gray-200 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-xl" />
            <div className="h-64 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

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
            <button
              onClick={() => router.push('/expenses')}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              View Expenses
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard statId="balance" totalBalance={totalBalance} isLoading={isLoading} />
            <StatsCard statId="income" monthlySalary={monthlySalary} isLoading={isLoading} />
            <StatsCard statId="expenses" monthlyExpenses={monthlyExpenses} isLoading={isLoading} />
            <StatsCard statId="savings" savings={savings} isLoading={isLoading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <SpendingTrendChart key={`trend-${dataVersion}`} />
            <CategoryBreakdownChart key={`cat-${dataVersion}`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BudgetStatus key={`budget-${dataVersion}`} />
            <RecentTransactions key={`recent-${dataVersion}`} />
          </div>
        </div>
      </div>

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleDismiss}
        onComplete={handleComplete}
      />
    </>
  );
}