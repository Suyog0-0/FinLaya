import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';
import GoBackButton from '@/components/not-found/GoBackButton';

export const dynamic = 'force-static';
export const revalidate = 60;

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 via-white to-amber-50 px-4">
      <div className="text-center max-w-md">

        {/* Fun 404 Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-4">
            <Search size={32} className="text-orange-500" />
          </div>
        </div>

        {/* Brand */}
        <h1 className="text-xl font-bold text-orange-500 mb-2">FinLaya</h1>

        {/* Big 404 with subtle animation */}
        <p className="text-7xl font-black text-gray-900 mb-2 animate-bounce-slow">404</p>

        {/* Friendly message */}
        <p className="text-lg font-semibold text-gray-800 mb-1">Oops! Page not found</p>
        <p className="text-gray-500 text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <GoBackButton />
          <Link
            href="/dashboard"
            prefetch={true}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg"
          >
            <Home size={14} />
            Go to Dashboard
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
          <span>Try:</span>
          <Link href="/expenses" className="hover:text-orange-500 transition-colors">Expenses</Link>
          <span className="text-gray-300">•</span>
          <Link href="/categories" className="hover:text-orange-500 transition-colors">Categories</Link>
          <span className="text-gray-300">•</span>
          <Link href="/reports" className="hover:text-orange-500 transition-colors">Reports</Link>
        </div>

        {/* Prefetch important pages for faster navigation */}
        <div className="sr-only">
          <Link href="/dashboard" prefetch={true} />
          <Link href="/expenses" prefetch={true} />
          <Link href="/categories" prefetch={true} />
          <Link href="/goals" prefetch={true} />
          <Link href="/emi-loan" prefetch={true} />
          <Link href="/reports" prefetch={true} />
        </div>

      </div>
    </div>
  );
}