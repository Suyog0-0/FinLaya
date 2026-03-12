'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { 
  LayoutDashboard, Receipt, PieChart, Settings, LogOut, Menu, X,
  User, ChevronDown, Target, CreditCard, BarChart2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/categories", label: "Categories", icon: PieChart },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/emis", label: "EMI/Loan", icon: CreditCard },
  { href: "/reports", label: "Reports", icon: BarChart2 },
];

const AvatarCircle = ({ avatarUrl, initials, size = 'sm' }: { avatarUrl: string | null; initials: string; size?: 'sm' | 'lg' }) => {
  const dimension = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';
  const sizePixels = size === 'sm' ? 32 : 40;
  if (avatarUrl) {
    return <Image src={avatarUrl} alt="Profile" width={sizePixels} height={sizePixels} className={`${dimension} rounded-full object-cover border-2 border-orange-200`} />;
  }
  return <div className={`${dimension} rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold shadow-sm`}>{initials}</div>;
};

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user?.id) return;
      const { data } = await supabase.from('users').select('avatar_url').eq('user_id', user.id).maybeSingle();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    };
    fetchAvatar();
  }, [user?.id]);

  useEffect(() => {
    if (!router || !user?.id) return;
    ["/dashboard", "/expenses", "/categories", "/goals", "/emi-loan", "/reports", `/profile/${user.id}`, "/settings"].forEach(page => router.prefetch(page));
  }, [router, user?.id]);

  const handleLogout = async () => { await signOut(); router.push("/login"); };

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/dashboard" prefetch className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent hover:opacity-90 transition-opacity">
            FinLaya
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  prefetch 
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                    isActive 
                      ? 'bg-orange-50 text-orange-600 shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={16} className="transition-transform group-hover:scale-110" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            {/* Desktop Dropdown */}
            <div className="hidden md:block relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <AvatarCircle avatarUrl={avatarUrl} initials={userInitials} size="sm" />
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -8 }} 
                    transition={{ duration: 0.15 }} 
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                  >
                    <Link href={`/profile/${user?.id}`} prefetch onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:scale-[1.01] transition-transform duration-150">
                      <User size={14} /> Profile
                    </Link>
                    <Link href="/settings" prefetch onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:scale-[1.01] transition-transform duration-150">
                      <Settings size={14} /> Settings
                    </Link>
                    <div className="border-t border-gray-100" />
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:scale-[1.01] transition-transform duration-150 w-full text-left">
                      <LogOut size={14} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Toggle */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }} 
              className="md:hidden overflow-hidden"
            >
              <div className="py-3 space-y-1 border-t border-gray-100">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link 
                      key={link.href} 
                      href={link.href} 
                      prefetch 
                      onClick={() => setIsMenuOpen(false)} 
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
                        isActive 
                          ? 'bg-orange-50 text-orange-600' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
                
                {/* Mobile User Section */}
                <div className="border-t border-gray-100 pt-3 mt-2 space-y-1">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <AvatarCircle avatarUrl={avatarUrl} initials={userInitials} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <Link href={`/profile/${user?.id}`} prefetch onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:scale-[1.01] transition-all duration-200">
                    <User size={16} /> Profile
                  </Link>
                  <Link href="/settings" prefetch onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:scale-[1.01] transition-all duration-200">
                    <Settings size={16} /> Settings
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 hover:scale-[1.01] transition-all duration-200 w-full text-left">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}