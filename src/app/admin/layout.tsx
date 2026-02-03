import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/layout/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session && session.role !== "admin") redirect("/");
  if (!session) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav />
      <main className="p-4 md:p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
