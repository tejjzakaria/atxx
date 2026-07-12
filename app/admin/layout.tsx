import { notFound } from "next/navigation";
import { auth } from "@/auth";
import AdminSidebar from "@/components/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") notFound();

  return (
    <div className="flex h-screen overflow-hidden bg-[#EBEBEB]">
      <AdminSidebar />
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
