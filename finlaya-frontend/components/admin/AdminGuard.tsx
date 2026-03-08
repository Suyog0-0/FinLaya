'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, isAdminLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Still resolving auth or admin status
  if (loading || isAdminLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin" />
          <p className="text-slate-600 text-xs font-mono tracking-widest">VERIFYING ACCESS</p>
        </div>
      </div>
    );
  }

  // Not logged in — redirect handled by useEffect
  if (!user) return null;

  // Logged in but not an admin — show 403
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <ShieldX size={28} className="text-red-400" />
            </div>
          </div>

          {/* Code */}
          <p className="text-7xl font-black text-slate-800 font-mono mb-2">403</p>
          <h1 className="text-lg font-semibold text-slate-200 mb-2">Access Denied</h1>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            You don&apos;t have permission to view this page.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft size={14} />
              Go Back
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
            >
              <Home size={14} />
              My Dashboard
            </Link>
          </div>

          {/* Divider */}
          <div className="mt-10 flex items-center gap-3 opacity-20">
            <div className="h-px flex-1 bg-slate-700" />
            <span className="text-xs text-slate-600 font-mono">FINLAYA</span>
            <div className="h-px flex-1 bg-slate-700" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}