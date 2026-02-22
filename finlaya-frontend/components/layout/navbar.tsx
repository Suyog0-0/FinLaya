'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  Settings,    
  LogOut, 
  Menu, 
  X,
  User,
  ChevronDown,
  Target,
  CreditCard,
  BarChart2
} from "lucide-react";
import { motion } from "framer-motion";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/categories", label: "Categories", icon: PieChart },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/emi-loan", label: "EMI/Loan System", icon: CreditCard },
  { href: "/reports", label: "Reports", icon: BarChart2 },
];

const AvatarCircle = ({ avatarUrl, initials, size = 'sm' }: { avatarUrl: string | null; initials: string; size?: 'sm' | 'lg' }) => {
  const dimension = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';
  const sizePixels = size === 'sm' ? 32 : 40;
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt="Profile"
        width={sizePixels}
        height={sizePixels}
        className={`${dimension} rounded-full object-cover border-2 border-orange-300`}
      />
    );
  }
  return (
    <div className={`${dimension} rounded-full bg-orange-600 flex items-center justify-center text-white font-semibold`}>
      {initials}
    </div>
  );
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

  // Fetch avatar when user loads
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    };
    fetchAvatar();
  }, [user?.id]);

  // Prefetch all main pages programmatically
  useEffect(() => {
    if (!router || !user?.id) return;
    const pagesToPrefetch = [
      "/dashboard",
      "/expenses",
      "/categories",
      "/goals",
      "/emi-loan",
      "/reports",
      `/profile/${user.id}`,
      "/settings",
      "/not-found"
    ];
    pagesToPrefetch.forEach((page) => {
      router.prefetch(page);
    });
  }, [router, user?.id]);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/dashboard" prefetch={true} className="text-2xl font-bold text-orange-600">
            FinLaya
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  className={`flex items-center px-1 py-2 border-b-2 transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? 'border-orange-500 text-orange-600 font-semibold' 
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  <Icon size={18} />
                  <span className="ml-2 font-medium">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Desktop User Button */}
            <div className="hidden md:block relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <AvatarCircle avatarUrl={avatarUrl} initials={userInitials} size="sm" />
                <div className="flex flex-col text-left">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    {userName} <motion.span animate={{ rotate: isDropdownOpen ? 180 : 0 }} transition={{ duration: 0.3 }}><ChevronDown size={14} /></motion.span>
                  </span>
                  <span className="text-xs text-gray-500">{user?.email}</span>
                </div>
              </button>

              {/* Dropdown */}
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200"
                >
                  {/* Profile */}
                  <Link
                    href={`/profile/${user?.id}`}
                    prefetch={true}
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-t-lg cursor-pointer"
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </Link>

                  {/* Settings */}
                  <Link
                    href="/settings"
                    prefetch={true}
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </Link>

                  <div className="border-t border-gray-200"></div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-3 text-orange-600 hover:bg-orange-50 w-full rounded-b-lg cursor-pointer"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </motion.div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center px-1 py-2 border-b-2 transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? 'border-orange-500 text-orange-600 font-semibold' 
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  <Icon size={20} />
                  <span className="ml-2 font-medium">{link.label}</span>
                </Link>
              );
            })}

            {/* Mobile User Section */}
            <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
              <div className="flex items-center gap-3 px-4 py-2">
                <AvatarCircle avatarUrl={avatarUrl} initials={userInitials} size="lg" />
                <div>
                  <p className="font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>

              <Link
                href={`/profile/${user?.id}`}
                prefetch={true}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <User size={20} />
                <span className="font-medium">Profile</span>
              </Link>

              <Link
                href="/settings"
                prefetch={true}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <Settings size={20} />
                <span className="font-medium">Settings</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-orange-600 hover:bg-orange-50 w-full cursor-pointer"
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}