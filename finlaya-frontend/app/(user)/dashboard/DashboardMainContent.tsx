'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react'; 
import { useAuth } from '@/lib/contexts/AuthContext';
import OnboardingModal from '@/components/modals/onboarding/OnboardingModal';
import StatsCard from '@/components/(user)/shared/StatsCard';
import SpendingTrendChart from '@/components/(user)/dashboard/SpendingTrendChart';
import CategoryBreakdownChart from '@/components/(user)/dashboard/CategoryBreakdownChart';
import BudgetStatus from '@/components/(user)/dashboard/BudgetStatus';
import RecentTransactions from '@/components/(user)/dashboard/RecentTransactions';
import { supabase } from '@/lib/supabase/client';
import { useFinancialData } from '@/lib/hooks/useFinancialData';

export const dynamic = 'force-static';
export const revalidate = 60;

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

      // Per-user key so switching accounts always re-checks
      const sessionKey = `finlaya_setup_dismissed_${user.id}`;

      if (sessionStorage.getItem(sessionKey) === 'true') {
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
    sessionStorage.setItem(`finlaya_setup_dismissed_${user!.id}`, 'true');
    setShowOnboarding(false);
  };

  const handleComplete = () => {
    sessionStorage.setItem(`finlaya_setup_dismissed_${user!.id}`, 'true');
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
              className="group inline-flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-amber-200/40 hover:shadow-amber-300/50 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-gray-50 transition-all duration-200 cursor-pointer"
            >
              <span>View Expenses</span>
              <ArrowRight
                size={16}
                className="text-white/90 group-hover:translate-x-0.5 transition-transform duration-200"
                strokeWidth={2.5}
              />
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