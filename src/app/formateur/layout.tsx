import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FormateurNav } from "@/components/layout/FormateurNav";

export default async function FormateurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session && session.role !== "formateur") redirect("/");
  if (!session) return <>{children}</>;
  if (!session.firstLoginDone) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50">
      <FormateurNav />
      <main className="p-4 md:p-6 max-w-4xl mx-auto">{children}</main>
    </div>
  );
}
