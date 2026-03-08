'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { LayoutDashboard, Users, LogOut, Menu, X, ChevronDown } from "lucide-react";

const navLinks = [
  { href: "/admin-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin-users", label: "Users", icon: Users },
];

export default function AdminNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin';
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <nav className="bg-[#0a0a0a] border-b border-white/[0.06] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex items-center justify-between h-12">

          {/* Logo */}
          <Link href="/admin-dashboard" className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm tracking-tight">FinLaya</span>
            <span className="text-[10px] font-mono text-white/20 border border-white/10 px-1.5 py-0.5 rounded">
              ADMIN
            </span>
          </Link>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                    active
                      ? 'text-white bg-white/10'
                      : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right — user */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-white/5 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/70 text-[10px] font-bold">
                {initials}
              </div>
              <span className="text-white/60 text-[13px]">{name}</span>
              <ChevronDown size={11} className={`text-white/30 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-[#111] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden">
                <div className="px-3.5 py-2.5 border-b border-white/[0.06]">
                  <p className="text-[11px] text-white/30 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-1.5 rounded-md text-white/40 hover:bg-white/5"
          >
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/[0.06] py-2 space-y-0.5">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm ${
                    active ? 'text-white bg-white/10' : 'text-white/40 hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              );
            })}
            <div className="border-t border-white/[0.06] pt-2 mt-2">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-red-400/80 w-full hover:bg-red-500/10"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}