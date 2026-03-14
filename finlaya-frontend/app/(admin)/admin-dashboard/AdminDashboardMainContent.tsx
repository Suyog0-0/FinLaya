'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Users, Receipt, TrendingUp, Target } from 'lucide-react';

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
    { label: 'Total Users', value: stats.totalUsers, icon: Users, iconColor: 'text-orange-400', iconBg: 'bg-orange-500/10' },
    { label: 'Expenses Logged', value: stats.totalExpenses, icon: Receipt, iconColor: 'text-red-400', iconBg: 'bg-red-500/10' },
    { label: 'Income Entries', value: stats.totalIncome, icon: TrendingUp, iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/10' },
    { label: 'Goals Set', value: stats.totalGoals, icon: Target, iconColor: 'text-amber-400', iconBg: 'bg-amber-500/10' },
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-white text-xl font-bold tracking-tight">Overview</h1>
            <p className="text-white/40 text-sm mt-1">{today}</p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
            ● LIVE
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, iconColor, iconBg }) => (
            <div
              key={label}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
            >
              <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
                <Icon size={18} className={iconColor} strokeWidth={2} />
              </div>
              <p className="text-2xl font-bold text-white tabular-nums tracking-tight mb-1">
                {loading ? <span className="text-white/20">—</span> : value}
              </p>
              <p className="text-sm text-white/40">{label}</p>
            </div>
          ))}
        </div>

        {/* Recent users table */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">

          {/* Table header */}
          <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
            <h2 className="text-white font-semibold text-sm">Recent Users</h2>
            <a href="/admin-users" className="text-white/40 text-xs hover:text-white/70 transition-colors font-medium">
              View all →
            </a>
          </div>

          {/* Column headers */}
          <div className="px-6 py-3 grid grid-cols-12 border-b border-white/[0.05]">
            <span className="col-span-4 text-[11px] text-white/30 uppercase tracking-widest font-semibold">User</span>
            <span className="col-span-4 text-[11px] text-white/30 uppercase tracking-widest font-semibold hidden md:block">Email</span>
            <span className="col-span-2 text-[11px] text-white/30 uppercase tracking-widest font-semibold hidden lg:block">Salary</span>
            <span className="col-span-2 text-[11px] text-white/30 uppercase tracking-widest font-semibold text-right">Joined</span>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-white/25 text-sm">Loading...</div>
          ) : recentUsers.length === 0 ? (
            <div className="px-6 py-12 text-center text-white/25 text-sm">No users yet</div>
          ) : (
            <div>
              {recentUsers.map((u, i) => (
                <div
                  key={u.user_id}
                  className={`px-6 py-3.5 grid grid-cols-12 items-center hover:bg-white/[0.03] transition-colors ${
                    i !== recentUsers.length - 1 ? 'border-b border-white/[0.05]' : ''
                  }`}
                >
                  {/* Username + avatar */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/15 border border-orange-500/20 flex items-center justify-center text-orange-400 text-[11px] font-bold flex-shrink-0">
                      {u.username?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="text-white/80 text-sm font-medium truncate">{u.username ?? '—'}</span>
                  </div>

                  {/* Email */}
                  <div className="col-span-4 hidden md:block">
                    <span className="text-white/40 text-sm truncate block">{u.email}</span>
                  </div>

                  {/* Salary */}
                  <div className="col-span-2 hidden lg:block">
                    <span className="text-white/40 text-sm">
                      {u.monthly_salary ? `NRs ${u.monthly_salary.toLocaleString()}` : '—'}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="col-span-2 text-right">
                    <span className="text-white/30 text-xs">
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