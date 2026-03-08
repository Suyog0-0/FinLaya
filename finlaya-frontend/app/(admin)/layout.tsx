import AdminGuard from "@/components/admin/AdminGuard";
import AdminNavbar from "@/components/layout/AdminNavbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#0d0d0d]">
        <AdminNavbar />
        <main>{children}</main>
      </div>
    </AdminGuard>
  );
}