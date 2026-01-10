'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User
} from "lucide-react";

const navLinks = [
  { href: "/home", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/categories", label: "Categories", icon: PieChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  // Get user's name or email
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/home" className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            FinLaya
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
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
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                  {userInitials}
                </div>
                <span className="text-sm font-medium text-gray-700">{userName}</span>
              </button>

              {/* Dropdown */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                  <Link
                    href={`/profile/${user?.id}`}
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-t-lg"
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </Link>
                  <div className="border-t border-gray-200"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 w-full rounded-b-lg"
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
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
            {/* Mobile Navigation Links */}
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                    isActive 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}

            {/* Mobile User Section */}
            <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white font-semibold">
                  {userInitials}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{userName}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>

              <Link
                href={`/profile/${user?.id}`}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <User size={20} />
                <span className="font-medium">Profile</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 w-full"
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