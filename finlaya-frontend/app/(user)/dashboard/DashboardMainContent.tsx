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

export const dynamic   = 'force-static';
export const revalidate = 60;

// ── Helper: current YYYY-MM string ────────────────────────────────────────────
function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ── Per-user localStorage keys ─────────────────────────────────────────────────
const monthKey  = (uid: string) => `finlaya_onboarding_month_${uid}`;
const doneKey   = (uid: string) => `finlaya_onboarding_done_${uid}`;

export default function DashboardMainContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [showOnboarding,  setShowOnboarding]  = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [dataVersion,     setDataVersion]     = useState(0);

  const { monthlySalary, monthlyExpenses, savings, totalBalance, isLoading, refetch } =
    useFinancialData();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  // ── Decide whether to show the onboarding modal ────────────────────────────
  useEffect(() => {
    const checkSetup = async () => {
      if (!user?.id) return;

      const thisMonth  = currentMonthKey();
      const lastMonth  = localStorage.getItem(monthKey(user.id));
      const everDone   = localStorage.getItem(doneKey(user.id)) === 'true';

      if (!everDone) {
        try {
          const [{ data: cats }, { data: userData }] = await Promise.all([
            supabase
              .from('budget_categories')
              .select('category_id')
              .eq('user_id', user.id)
              .limit(1),
            supabase
              .from('users')
              .select('monthly_salary')
              .eq('user_id', user.id)
              .maybeSingle(),
          ]);

          const hasCategories = (cats ?? []).length > 0;
          const hasSalary     = userData?.monthly_salary && Number(userData.monthly_salary) > 0;

          if (!hasCategories || !hasSalary) {
            setShowOnboarding(true);
          } else {
            localStorage.setItem(doneKey(user.id),  'true');
            localStorage.setItem(monthKey(user.id), thisMonth);
          }
        } catch {
          setShowOnboarding(true);
        }
        setIsCheckingSetup(false);
        return;
      }

      if (lastMonth !== thisMonth) {
        setShowOnboarding(true);
      }

      setIsCheckingSetup(false);
    };

    if (user) checkSetup();
  }, [user]);

  const handleDismiss = () => {
    if (user?.id) {
      localStorage.setItem(monthKey(user.id), currentMonthKey());
    }
    setShowOnboarding(false);
  };

  const handleComplete = () => {
    if (user?.id) {
      localStorage.setItem(doneKey(user.id),  'true');
      localStorage.setItem(monthKey(user.id), currentMonthKey());
    }
    setShowOnboarding(false);
    refetch();
    setDataVersion((v) => v + 1);
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading || isCheckingSetup) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
        <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
              <div className="h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="h-12 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
        <div className="max-w-7xl mx-auto px-4 py-8">

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Welcome back! Here&apos;s your financial overview.</p>
            </div>
            {/* FIXED: View Expenses button — better dark mode appearance */}
            <button
              onClick={() => router.push('/expenses')}
              className="group inline-flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 dark:from-orange-500 dark:to-orange-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-amber-200/40 dark:shadow-orange-900/30 hover:shadow-amber-300/50 dark:hover:shadow-orange-900/50 hover:from-amber-600 hover:to-orange-600 dark:hover:from-orange-600 dark:hover:to-orange-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-[#0f1117] transition-all duration-200 cursor-pointer"
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
            <StatsCard statId="balance"  totalBalance={totalBalance}       isLoading={isLoading} />
            <StatsCard statId="income"   monthlySalary={monthlySalary}     isLoading={isLoading} />
            <StatsCard statId="expenses" monthlyExpenses={monthlyExpenses} isLoading={isLoading} />
            <StatsCard statId="savings"  savings={savings}                 isLoading={isLoading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <SpendingTrendChart      key={`trend-${dataVersion}`} />
            <CategoryBreakdownChart  key={`cat-${dataVersion}`}   />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BudgetStatus       key={`budget-${dataVersion}`}  />
            <RecentTransactions key={`recent-${dataVersion}`}  />
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