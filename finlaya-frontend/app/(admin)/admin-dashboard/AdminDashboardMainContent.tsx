'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Users, Receipt, TrendingUp, Target, ArrowUpRight } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalExpenses: number;
  totalIncome: number;
  totalGoals: number;
}

interface RecentUser {
  user_id: string;
  email: string;
  username: string;
  registration_date: string;
  monthly_salary: number | null;
}

export default function AdminDashboardMainContent() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalExpenses: 0, totalIncome: 0, totalGoals: 0 });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [
        { count: usersCount },
        { count: expensesCount },
        { count: incomeCount },
        { count: goalsCount },
        { data: latestUsers },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('expenses').select('*', { count: 'exact', head: true }),
        supabase.from('income').select('*', { count: 'exact', head: true }),
        supabase.from('goals').select('*', { count: 'exact', head: true }),
        supabase.from('users')
          .select('user_id, email, username, registration_date, monthly_salary')
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      setStats({
        totalUsers: usersCount ?? 0,
        totalExpenses: expensesCount ?? 0,
        totalIncome: incomeCount ?? 0,
        totalGoals: goalsCount ?? 0,
      });
      setRecentUsers(latestUsers ?? []);
      setLoading(false);
    };

    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, suffix: '' },
    { label: 'Expenses Logged', value: stats.totalExpenses, icon: Receipt, suffix: '' },
    { label: 'Income Entries', value: stats.totalIncome, icon: TrendingUp, suffix: '' },
    { label: 'Goals Set', value: stats.totalGoals, icon: Target, suffix: '' },
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-5 py-8">

        {/* Page header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-white text-lg font-semibold tracking-tight">Overview</h1>
            <p className="text-white/30 text-xs mt-0.5">{today}</p>
          </div>
          <span className="text-[11px] font-mono text-white/20 border border-white/[0.06] px-2 py-1 rounded-md">
            LIVE
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {statCards.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon size={13} className="text-white/30" />
                <ArrowUpRight size={11} className="text-white/15" />
              </div>
              <p className="text-2xl font-semibold text-white tabular-nums">
                {loading ? <span className="text-white/10">—</span> : value}
              </p>
              <p className="text-white/30 text-[11px] mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Recent users table */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">

          {/* Table header */}
          <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="text-white/70 text-[13px] font-medium">Recent Users</h2>
            <a href="/admin-users" className="text-white/30 text-[11px] hover:text-white/60 transition-colors">
              View all →
            </a>
          </div>

          {/* Column headers */}
          <div className="px-5 py-2.5 grid grid-cols-12 border-b border-white/[0.04]">
            <span className="col-span-4 text-[11px] text-white/20 uppercase tracking-wider font-medium">User</span>
            <span className="col-span-4 text-[11px] text-white/20 uppercase tracking-wider font-medium hidden md:block">Email</span>
            <span className="col-span-2 text-[11px] text-white/20 uppercase tracking-wider font-medium hidden lg:block">Salary</span>
            <span className="col-span-2 text-[11px] text-white/20 uppercase tracking-wider font-medium text-right">Joined</span>
          </div>

          {loading ? (
            <div className="px-5 py-10 text-center text-white/20 text-sm">Loading...</div>
          ) : recentUsers.length === 0 ? (
            <div className="px-5 py-10 text-center text-white/20 text-sm">No users yet</div>
          ) : (
            <div>
              {recentUsers.map((u, i) => (
                <div
                  key={u.user_id}
                  className={`px-5 py-3 grid grid-cols-12 items-center hover:bg-white/[0.02] transition-colors ${
                    i !== recentUsers.length - 1 ? 'border-b border-white/[0.04]' : ''
                  }`}
                >
                  {/* Username + avatar */}
                  <div className="col-span-4 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/50 text-[11px] font-semibold flex-shrink-0">
                      {u.username?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="text-white/70 text-[13px] font-medium truncate">{u.username ?? '—'}</span>
                  </div>

                  {/* Email */}
                  <div className="col-span-4 hidden md:block">
                    <span className="text-white/35 text-[12px] truncate block">{u.email}</span>
                  </div>

                  {/* Salary */}
                  <div className="col-span-2 hidden lg:block">
                    <span className="text-white/35 text-[12px]">
                      {u.monthly_salary ? `NRs ${u.monthly_salary.toLocaleString()}` : '—'}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="col-span-2 text-right">
                    <span className="text-white/25 text-[11px]">
                      {new Date(u.registration_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}