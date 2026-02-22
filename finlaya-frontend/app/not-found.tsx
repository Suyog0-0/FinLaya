import Link from 'next/link';
import GoBackButton from '@/components/not-found/GoBackButton'; // small client component

export const dynamic = 'force-static'; // forces SSG for better performance and SEO on 404 page
export const revalidate = 60; // ISR: rebuild the page every 60 seconds

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white px-4">
      <div className="text-center">

        <h1 className="text-2xl font-bold text-orange-500 mb-6">FinLaya</h1>

        <p className="text-8xl font-black text-gray-900 mb-4">404</p>

        <p className="text-xl font-semibold text-gray-800 mb-2">Page not found</p>
        <p className="text-gray-400 text-sm mb-10">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>

        <div className="flex gap-3 justify-center">
          <GoBackButton />
          <Link
            href="/dashboard"
            prefetch={true}
            className="px-5 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors cursor-pointer"
          >
            Dashboard
          </Link>
        </div>

        <div style={{ display: 'none' }}>
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