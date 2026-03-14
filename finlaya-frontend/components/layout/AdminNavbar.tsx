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
    <nav className="bg-[#111318] border-b border-white/[0.08] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/admin-dashboard" className="flex items-center gap-2.5">
            <span className="text-white font-bold text-sm tracking-tight">FinLaya</span>
            <span className="text-[10px] font-semibold text-orange-400 bg-orange-500/15 border border-orange-500/20 px-2 py-0.5 rounded-md">
              ADMIN
            </span>
          </Link>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'text-white bg-white/10'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right — user */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 text-[11px] font-bold">
                {initials}
              </div>
              <span className="text-white/70 text-sm font-medium">{name}</span>
              <ChevronDown size={12} className={`text-white/30 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[#1a1d25] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.08]">
                  <p className="text-white/70 text-xs font-medium truncate">{name}</p>
                  <p className="text-white/30 text-[11px] truncate mt-0.5">{user?.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-1.5 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/[0.06]"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/[0.08] py-2 space-y-0.5">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    active ? 'text-white bg-white/10' : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
            <div className="border-t border-white/[0.08] pt-2 mt-2">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-400 w-full hover:bg-red-500/10"
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