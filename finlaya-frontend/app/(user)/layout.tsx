import Navbar from "@/components/layout/navbar";
import { NotificationProvider } from "@/lib/contexts/NotificationContext";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import ToastContainer from "@/components/layout/ToastContainer";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] transition-colors">
          <Navbar />
          <ToastContainer />
          <main>{children}</main>
        </div>
      </NotificationProvider>
    </ThemeProvider>
  );
}