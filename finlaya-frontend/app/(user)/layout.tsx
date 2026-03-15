import Navbar from "@/components/layout/navbar";
import { NotificationProvider } from "@/lib/contexts/NotificationContext";
import ToastContainer from "@/components/layout/ToastContainer";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <Navbar />
      <ToastContainer />
      <main>{children}</main>
    </NotificationProvider>
  );
}