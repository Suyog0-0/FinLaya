'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  Search, Trash2, X, Users,
  Mail, Calendar, DollarSign, Eye,
  Receipt, TrendingUp, Target, Bell
} from 'lucide-react';

interface User {
  user_id: string;
  username: string;
  email: string;
  monthly_salary: number | null;
  registration_date: string;
  created_at: string;
  avatar_url: string | null;
}

interface UserStats {
  expenses: number;
  income: number;
  goals: number;
  bills: number;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export default function AdminUsersMainContent() {
  const { user: adminUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // View modal
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('users')
      .select('user_id, username, email, monthly_salary, registration_date, created_at, avatar_url')
      .order('created_at', { ascending: false });
    setUsers(data ?? []);
    setFiltered(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      users.filter(
        (u) =>
          u.username?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      )
    );
  }, [search, users]);

  const openViewModal = async (u: User) => {
    setViewUser(u);
    setUserStats(null);
    setStatsLoading(true);
    const [
      { count: expenses },
      { count: income },
      { count: goals },
      { count: bills },
    ] = await Promise.all([
      supabase.from('expenses').select('*', { count: 'exact', head: true }).eq('user_id', u.user_id),
      supabase.from('income').select('*', { count: 'exact', head: true }).eq('user_id', u.user_id),
      supabase.from('goals').select('*', { count: 'exact', head: true }).eq('user_id', u.user_id),
      supabase.from('bill_reminders').select('*', { count: 'exact', head: true }).eq('user_id', u.user_id),
    ]);
    setUserStats({ expenses: expenses ?? 0, income: income ?? 0, goals: goals ?? 0, bills: bills ?? 0 });
    setStatsLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${deleteTarget.user_id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const json = await res.json();
        setDeleteError(json.error || 'Failed to delete user');
        setDeleting(false);
        return;
      }

      setUsers((prev) => prev.filter((u) => u.user_id !== deleteTarget.user_id));
      setDeleteTarget(null);
      if (viewUser?.user_id === deleteTarget.user_id) setViewUser(null);
    } catch {
      setDeleteError('Could not reach backend server');
    }

    setDeleting(false);
  };

  const isSelf = (u: User) => u.email === adminUser?.email;

  const initials = (name: string) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <div className="min-h-screen bg-[#080c10]">
      <div className="max-w-6xl mx-auto px-5 py-8">

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-white text-lg font-semibold tracking-tight">Users</h1>
          <p className="text-white/25 text-xs mt-0.5">
            {loading ? '—' : `${users.length} registered`}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white/70 placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.04] transition-all"
          />
        </div>

        {/* Table */}
        <div className="border border-white/[0.06] rounded-xl overflow-hidden">

          {/* Column headers */}
          <div className="px-5 py-3 grid grid-cols-12 bg-white/[0.02] border-b border-white/[0.06]">
            <span className="col-span-4 text-[10px] text-white/20 uppercase tracking-widest font-semibold">User</span>
            <span className="col-span-4 text-[10px] text-white/20 uppercase tracking-widest font-semibold hidden md:block">Email</span>
            <span className="col-span-2 text-[10px] text-white/20 uppercase tracking-widest font-semibold hidden lg:block">Joined</span>
            <span className="col-span-2 text-[10px] text-white/20 uppercase tracking-widest font-semibold text-right">Actions</span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-white/20 text-sm bg-white/[0.01]">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center bg-white/[0.01]">
              <Users size={22} className="text-white/10 mx-auto mb-3" />
              <p className="text-white/20 text-sm">No users found</p>
            </div>
          ) : (
            <div className="bg-white/[0.015]">
              {filtered.map((u, i) => (
                <div
                  key={u.user_id}
                  className={`px-5 py-3.5 grid grid-cols-12 items-center hover:bg-cyan-500/[0.03] transition-colors ${
                    i !== filtered.length - 1 ? 'border-b border-white/[0.04]' : ''
                  }`}
                >
                  {/* Avatar + name */}
                  <div className="col-span-4 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-[11px] font-bold flex-shrink-0">
                      {initials(u.username)}
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-white/70 text-[13px] font-medium truncate">{u.username ?? '—'}</span>
                      {isSelf(u) && (
                        <span className="text-[9px] font-mono text-cyan-400/50 bg-cyan-500/10 border border-cyan-500/15 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="col-span-4 hidden md:block">
                    <span className="text-white/30 text-[12px] truncate block">{u.email}</span>
                  </div>

                  {/* Joined */}
                  <div className="col-span-2 hidden lg:block">
                    <span className="text-white/25 text-[11px]">
                      {new Date(u.registration_date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <button
                      onClick={() => openViewModal(u)}
                      className="p-1.5 rounded-lg text-white/20 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                      title="View user"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => { setDeleteError(''); setDeleteTarget(u); }}
                      disabled={isSelf(u)}
                      title={isSelf(u) ? "Can't delete your own account" : "Delete user"}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isSelf(u)
                          ? 'text-white/10 cursor-not-allowed'
                          : 'text-white/20 hover:text-red-400 hover:bg-red-500/10'
                      }`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── View User Modal ── */}
      {viewUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewUser(null)} />
          <div className="relative bg-[#0d1117] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <span className="text-white/60 text-sm font-medium">User Profile</span>
              <button
                onClick={() => setViewUser(null)}
                className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Profile section */}
            <div className="px-6 py-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 border-2 border-cyan-500/20 flex items-center justify-center text-cyan-400 text-base font-bold">
                  {initials(viewUser.username)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold">{viewUser.username}</p>
                    {isSelf(viewUser) && (
                      <span className="text-[9px] font-mono text-cyan-400/50 bg-cyan-500/10 border border-cyan-500/15 px-1.5 py-0.5 rounded-full">
                        YOU
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400/60 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                    USER
                  </span>
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="px-6 py-5 grid grid-cols-2 gap-4 border-b border-white/[0.06]">
              <div className="flex items-start gap-2.5">
                <Mail size={12} className="text-white/20 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-white/20 uppercase tracking-wider mb-0.5">Email</p>
                  <p className="text-white/60 text-xs break-all">{viewUser.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Calendar size={12} className="text-white/20 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-white/20 uppercase tracking-wider mb-0.5">Joined</p>
                  <p className="text-white/60 text-xs">
                    {new Date(viewUser.registration_date).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 col-span-2">
                <DollarSign size={12} className="text-white/20 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-white/20 uppercase tracking-wider mb-0.5">Monthly Salary</p>
                  <p className="text-white/60 text-xs">
                    {viewUser.monthly_salary ? `NRs ${viewUser.monthly_salary.toLocaleString()}` : 'Not set'}
                  </p>
                </div>
              </div>
            </div>

            {/* Activity stats */}
            <div className="px-6 py-5 border-b border-white/[0.06]">
              <p className="text-[10px] text-white/20 uppercase tracking-wider mb-3">Activity</p>
              {statsLoading ? (
                <p className="text-white/20 text-xs">Loading stats...</p>
              ) : userStats ? (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Expenses', value: userStats.expenses, icon: Receipt, color: 'text-orange-400' },
                    { label: 'Income', value: userStats.income, icon: TrendingUp, color: 'text-emerald-400' },
                    { label: 'Goals', value: userStats.goals, icon: Target, color: 'text-cyan-400' },
                    { label: 'Bills', value: userStats.bills, icon: Bell, color: 'text-purple-400' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 text-center">
                      <Icon size={12} className={`${color} mx-auto mb-1.5 opacity-70`} />
                      <p className="text-white font-semibold text-base leading-none">{value}</p>
                      <p className="text-white/20 text-[10px] mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 flex items-center justify-between">
              {isSelf(viewUser) ? (
                <span className="text-white/15 text-xs flex items-center gap-1.5">
                  <Trash2 size={11} />
                  Cannot delete your own account
                </span>
              ) : (
                <button
                  onClick={() => { setViewUser(null); setDeleteError(''); setDeleteTarget(viewUser); }}
                  className="flex items-center gap-1.5 text-red-400/60 hover:text-red-400 text-xs transition-colors"
                >
                  <Trash2 size={12} />
                  Delete user
                </button>
              )}
              <button
                onClick={() => setViewUser(null)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="relative bg-[#0d1117] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
              <Trash2 size={16} className="text-red-400" />
            </div>

            <h3 className="text-white font-semibold text-base mb-1">Delete user?</h3>
            <p className="text-white/40 text-sm mb-1">
              <span className="text-white/70 font-medium">{deleteTarget.username}</span> and all their data will be permanently removed from the platform.
            </p>
            <p className="text-red-400/50 text-xs mb-5">This cannot be undone.</p>

            {deleteError && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
                {deleteError}
              </p>
            )}

            <div className="flex gap-2.5">
              <button
                onClick={() => { setDeleteTarget(null); setDeleteError(''); }}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/5 text-sm transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500/90 hover:bg-red-500 text-white text-sm font-medium transition-colors disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}