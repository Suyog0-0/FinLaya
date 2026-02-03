'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Shield
} from "lucide-react";

const adminNavLinks = [
  { href: "/admin/dashboard", label: "Admin Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/settings", label: "Admin Settings", icon: Settings },
];

export default function AdminNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin';
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <nav className="bg-gradient-to-r from-purple-600 to-indigo-600 border-b border-purple-700 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Shield className="text-white" size={28} />
            <div>
              <span className="text-2xl font-bold text-white">FinLaya</span>
              <span className="block text-xs text-purple-200">Admin Panel</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            {adminNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-white/20 text-white backdrop-blur-sm' 
                      : 'text-purple-100 hover:bg-white/10'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{link.label}</span>
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
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-white"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-semibold text-sm border-2 border-white/40">
                  {userInitials}
                </div>
                <span className="text-sm font-medium">{userName}</span>
              </button>

              {/* Dropdown */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-t-lg"
                  >
                    <LayoutDashboard size={16} />
                    <span>User Dashboard</span>
                  </Link>
                  <div className="border-t border-gray-200"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 w-full rounded-b-lg cursor-pointer"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 text-white"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-purple-700 py-4 space-y-2">
            {adminNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'text-purple-100 hover:bg-white/10'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}

            <div className="border-t border-purple-700 pt-4 mt-4 space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-purple-100 hover:bg-white/10"
              >
                <LayoutDashboard size={20} />
                <span className="font-medium">User Dashboard</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-red-500/20 w-full cursor-pointer"
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