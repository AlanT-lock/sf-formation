import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StagiaireNav } from "@/components/layout/StagiaireNav";

export default async function StagiaireDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/stagiaire/login");
  if (session.role !== "stagiaire") redirect("/");
  if (!session.firstLoginDone) redirect("/stagiaire/first-login");

  return (
    <div className="min-h-screen bg-slate-50">
      <StagiaireNav />
      <main className="p-4 md:p-6 max-w-2xl mx-auto">{children}</main>
    </div>
  );
}
